/*
  globe.js
  Builds the 3D rotating Earth (Three.js) that sits as a fixed background
  behind the whole page, and renders the plain repo list that reads from
  repos.js — the only repo UI on the site.
*/

(function () {
  // ----- Render the repo list from repos.js -----
  // Each repo is one clickable link — just its name — that opens its
  // GitHub page in a new tab.
  function renderRepoList() {
    const list = document.getElementById("repo-list");
    if (!list || !window.REPOS) return;

    window.REPOS.forEach(function (repo) {
      const item = document.createElement("li");

      const link = document.createElement("a");
      link.className = "repo-link";
      link.href = repo.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = repo.name;

      item.appendChild(link);
      list.appendChild(item);
    });
  }

  renderRepoList();

  // ----- Load Three.js from its CDN, without blocking the rest of the page -----
  // This is done here (instead of a <script> tag in index.html) so that a slow
  // or unreachable CDN can never delay the intro or the repo list from
  // showing up — the globe is a bonus, not a requirement.
  const THREE_JS_CDN_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  function loadThreeJs(onLoaded, onFailed) {
    const script = document.createElement("script");
    script.src = THREE_JS_CDN_URL;
    script.onload = onLoaded;
    script.onerror = onFailed;
    document.body.appendChild(script);
  }

  loadThreeJs(initGlobe, function () {
    // Three.js failed to load (offline, CDN blocked, etc).
    // Hide the (now-empty) globe background and lean on the plain repo list.
    console.warn("Three.js failed to load; showing plain repo list only.");
    const container = document.getElementById("globe-container");
    if (container) container.hidden = true;
  });

  // ----- Convert a latitude/longitude pair into a point on a sphere -----
  // Standard lat/lon-to-3D-sphere formula. `radius` is the sphere's size.
  function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // ----- Build the dot-cloud sphere that represents the globe's surface -----
  // Dots are spread evenly over the sphere using a "Fibonacci sphere" —
  // a simple trick for scattering points evenly without clumping at the poles.
  function createDotSphere(radius, dotCount, color) {
    const positions = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2; // from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      positions.push(x * radius, y * radius, z * radius);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.03,
      transparent: true,
      opacity: 0.85,
    });

    return new THREE.Points(geometry, material);
  }

  // ----- Build latitude/longitude grid lines over the sphere -----
  function createGridLines(radius, color) {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.25,
    });
    const segments = 64;

    // Latitude rings (circles of constant lat, stacked from south to north pole).
    // EDIT ME: change the step (30) to add more/fewer latitude rings.
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const lon = (i / segments) * 360 - 180;
        points.push(latLonToVector3(lat, lon, radius));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geometry, material));
    }

    // Longitude rings (circles of constant lon, running pole to pole).
    // EDIT ME: change the step (30) to add more/fewer longitude rings.
    for (let lon = -180; lon < 180; lon += 30) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const lat = (i / segments) * 180 - 90;
        points.push(latLonToVector3(lat, lon, radius));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geometry, material));
    }

    return group;
  }

  // ----- Build the pulsing beacon that marks Jos, Nigeria on the globe -----
  function createBeacon(radius, color) {
    // EDIT ME: Jos, Nigeria's approximate coordinates.
    const JOS_LAT = 9.9;
    const JOS_LON = 8.9;

    const position = latLonToVector3(JOS_LAT, JOS_LON, radius * 1.01);
    const geometry = new THREE.SphereGeometry(0.04, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
    });
    const beacon = new THREE.Mesh(geometry, material);
    beacon.position.copy(position);
    return beacon;
  }

  // ----- Set up and run the whole 3D scene -----
  function initGlobe() {
    const container = document.getElementById("globe-container");
    if (!container) return;

    // EDIT ME: tweak these to change the globe's look and feel.
    const GLOBE_RADIUS = 1.5;
    const DOT_COUNT = 900;
    const NEON_COLOR = 0x00e5ff;
    const AUTO_ROTATE_SPEED = 0.0015; // radians per frame
    const TILT_STRENGTH = 0.4; // how far the globe tilts toward the pointer
    const TILT_EASE = 0.05; // how quickly the tilt catches up (0-1)

    // ----- Scene / camera / renderer -----
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // "tiltGroup" is tilted toward the mouse/finger.
    // "spinGroup" (inside it) auto-rotates, so the two motions never fight.
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    tiltGroup.add(spinGroup);
    scene.add(tiltGroup);

    spinGroup.add(createDotSphere(GLOBE_RADIUS, DOT_COUNT, NEON_COLOR));
    spinGroup.add(createGridLines(GLOBE_RADIUS, NEON_COLOR));

    const beacon = createBeacon(GLOBE_RADIUS, NEON_COLOR);
    spinGroup.add(beacon);

    // ----- "jos" label that tracks the beacon's position on screen -----
    // This is a plain HTML element layered over the canvas (not a 3D
    // object), repositioned every frame to follow the beacon as it moves.
    const josLabel = document.createElement("div");
    josLabel.className = "jos-label";
    josLabel.textContent = "jos";
    container.appendChild(josLabel);
    const beaconWorldPos = new THREE.Vector3(); // reused each frame below

    // ----- Track the pointer (mouse or finger) across the whole page -----
    // The globe is now a full-page background, so the pointer is tracked on
    // the window, not just the globe's own container. Position is stored as
    // normalized values from -1 to 1.
    let pointerX = 0;
    let pointerY = 0;

    function setPointerFromClient(clientX, clientY) {
      pointerX = (clientX / window.innerWidth) * 2 - 1;
      pointerY = (clientY / window.innerHeight) * 2 - 1;
    }

    window.addEventListener("mousemove", function (event) {
      setPointerFromClient(event.clientX, event.clientY);
    });

    window.addEventListener(
      "touchmove",
      function (event) {
        if (event.touches.length > 0) {
          setPointerFromClient(event.touches[0].clientX, event.touches[0].clientY);
        }
      },
      { passive: true }
    );

    // ----- Animation loop -----
    function animate() {
      requestAnimationFrame(animate);

      // Slow constant spin.
      spinGroup.rotation.y += AUTO_ROTATE_SPEED;

      // Ease the tilt toward the pointer position (instead of snapping to it).
      const targetTiltX = pointerY * TILT_STRENGTH;
      const targetTiltY = pointerX * TILT_STRENGTH;
      tiltGroup.rotation.x += (targetTiltX - tiltGroup.rotation.x) * TILT_EASE;
      tiltGroup.rotation.y += (targetTiltY - tiltGroup.rotation.y) * TILT_EASE;

      // Pulse the beacon's size and glow using a simple sine wave over time.
      const pulse = 0.6 + Math.sin(performance.now() * 0.004) * 0.4;
      beacon.scale.setScalar(0.7 + pulse * 0.6);
      beacon.material.opacity = 0.5 + pulse * 0.5;

      // ----- Keep the "jos" label glued to the beacon's screen position -----
      beacon.getWorldPosition(beaconWorldPos);

      // The beacon sits on a sphere centered at the world origin, so its own
      // world position also doubles as the globe's outward surface normal
      // there. If that normal points away from the camera, Jos is currently
      // on the far side of the globe — hide the label instead of letting it
      // float in front of the globe.
      const towardCamera = camera.position.clone().sub(beaconWorldPos);
      const isFacingCamera = beaconWorldPos.dot(towardCamera) > 0;

      if (isFacingCamera) {
        const screenPos = beaconWorldPos.clone().project(camera);
        const x = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * container.clientHeight;
        josLabel.style.left = x + "px";
        josLabel.style.top = y + "px";
        josLabel.style.opacity = "1";
      } else {
        josLabel.style.opacity = "0";
      }

      renderer.render(scene, camera);
    }
    animate();

    // ----- Keep the canvas sized to the window on resize -----
    window.addEventListener("resize", function () {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  }
})();
