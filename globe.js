/*
  globe.js
  Builds the 3D rotating Earth (Three.js) and the repo orbit nodes, and
  renders the plain-list fallback for devices/browsers without 3D.

  Built out fully in Stage 2 (globe) and Stage 3 (repo nodes + fallback list).
  Stage 2 added: a slowly-rotating dotted globe with grid lines, that tilts
  toward the mouse/finger, plus a pulsing beacon marking Jos, Nigeria.
  Stage 3 adds: a glowing orbiting node for each repo in repos.js (click or
  tap one to open the terminal-style detail panel), and a plain fallback
  list below the globe that reads from the exact same repos.js array.
*/

(function () {
  // ----- Render the plain fallback list from repos.js -----
  // This runs now so the list works even before the globe exists, and is
  // also what devices without 3D fall back to entirely.
  function renderFallbackList() {
    const list = document.getElementById("repo-list");
    if (!list || !window.REPOS) return;

    window.REPOS.forEach(function (repo) {
      const item = document.createElement("li");

      const title = document.createElement("strong");
      title.textContent = repo.name + " ";
      item.appendChild(title);

      item.appendChild(document.createTextNode("— " + repo.brief + " ("));

      const link = document.createElement("a");
      link.href = repo.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = repo.lang;
      item.appendChild(link);

      item.appendChild(document.createTextNode(")"));

      list.appendChild(item);
    });
  }

  renderFallbackList();

  // ----- Terminal-style repo detail panel (shared by click and tap) -----
  // Shows the repo's name, brief, main language, and a GitHub link.
  // Used by both the 3D orbit nodes below and (later) any other repo UI.
  function showRepoPanel(repo) {
    const panel = document.getElementById("repo-panel");
    if (!panel) return;

    panel.innerHTML = ""; // clear whatever repo was shown last time

    const closeButton = document.createElement("button");
    closeButton.className = "repo-panel-close";
    closeButton.textContent = "x";
    closeButton.setAttribute("aria-label", "close");
    closeButton.addEventListener("click", function () {
      panel.hidden = true;
    });

    const name = document.createElement("p");
    name.className = "repo-panel-name";
    name.textContent = "> " + repo.name;

    const brief = document.createElement("p");
    brief.textContent = repo.brief;

    const lang = document.createElement("p");
    lang.className = "repo-panel-lang";
    lang.textContent = "lang: " + repo.lang;

    const link = document.createElement("a");
    link.href = repo.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "view on github ->";

    panel.appendChild(closeButton);
    panel.appendChild(name);
    panel.appendChild(brief);
    panel.appendChild(lang);
    panel.appendChild(link);
    panel.hidden = false;
  }

  // ----- Build one glowing node per repo, arranged in a ring around the globe -----
  // Each node's mesh remembers its own repo (in userData) so a click/tap
  // can look up which repo was hit.
  function createRepoNodes(orbitRadius, repos, color) {
    const group = new THREE.Group();
    const nodes = [];

    repos.forEach(function (repo, index) {
      const angle = (index / repos.length) * Math.PI * 2;

      const geometry = new THREE.SphereGeometry(0.07, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const node = new THREE.Mesh(geometry, material);

      node.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 2) * 0.3, // slight vertical offset per node, for variety
        Math.sin(angle) * orbitRadius
      );
      node.userData.repo = repo;

      group.add(node);
      nodes.push(node);
    });

    return { group: group, nodes: nodes };
  }

  // ----- Load Three.js from its CDN, without blocking the rest of the page -----
  // This is done here (instead of a <script> tag in index.html) so that a slow
  // or unreachable CDN can never delay the intro or the fallback list from
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
    // Hide the (now-empty) globe container and lean on the fallback list above.
    console.warn("Three.js failed to load; showing fallback repo list only.");
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
    const ORBIT_RADIUS = GLOBE_RADIUS * 1.6;
    const ORBIT_SPEED = 0.004; // radians per frame — faster than the globe's own spin

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

    // Repo nodes orbit in their own group, inside tiltGroup (so they tilt
    // with the globe) but outside spinGroup (so they orbit at their own speed,
    // independent of the globe's own spin).
    const repoOrbit = createRepoNodes(ORBIT_RADIUS, window.REPOS || [], NEON_COLOR);
    tiltGroup.add(repoOrbit.group);

    // ----- Track the pointer (mouse or finger) over the globe container -----
    // Position is stored as normalized values from -1 to 1.
    let pointerX = 0;
    let pointerY = 0;

    function setPointerFromClient(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      pointerX = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = ((clientY - rect.top) / rect.height) * 2 - 1;
    }

    container.addEventListener("mousemove", function (event) {
      setPointerFromClient(event.clientX, event.clientY);
    });

    container.addEventListener(
      "touchmove",
      function (event) {
        if (event.touches.length > 0) {
          setPointerFromClient(event.touches[0].clientX, event.touches[0].clientY);
        }
      },
      { passive: true }
    );

    // When the pointer leaves, ease the globe back to a neutral tilt.
    container.addEventListener("mouseleave", function () {
      pointerX = 0;
      pointerY = 0;
    });

    // ----- Clicking/tapping a repo node opens the detail panel -----
    // "click" fires for both a mouse click and a tap, so one listener
    // handles desktop and mobile.
    const raycaster = new THREE.Raycaster();
    const clickPoint = new THREE.Vector2();

    renderer.domElement.addEventListener("click", function (event) {
      const rect = renderer.domElement.getBoundingClientRect();
      clickPoint.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      clickPoint.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(clickPoint, camera);
      const hits = raycaster.intersectObjects(repoOrbit.nodes);
      if (hits.length > 0) {
        showRepoPanel(hits[0].object.userData.repo);
      }
    });

    // ----- Animation loop -----
    function animate() {
      requestAnimationFrame(animate);

      // Slow constant spin.
      spinGroup.rotation.y += AUTO_ROTATE_SPEED;
      repoOrbit.group.rotation.y += ORBIT_SPEED;

      // Ease the tilt toward the pointer position (instead of snapping to it).
      const targetTiltX = pointerY * TILT_STRENGTH;
      const targetTiltY = pointerX * TILT_STRENGTH;
      tiltGroup.rotation.x += (targetTiltX - tiltGroup.rotation.x) * TILT_EASE;
      tiltGroup.rotation.y += (targetTiltY - tiltGroup.rotation.y) * TILT_EASE;

      // Pulse the beacon's size and glow using a simple sine wave over time.
      const pulse = 0.6 + Math.sin(performance.now() * 0.004) * 0.4;
      beacon.scale.setScalar(0.7 + pulse * 0.6);
      beacon.material.opacity = 0.5 + pulse * 0.5;

      renderer.render(scene, camera);
    }
    animate();

    // ----- Keep the canvas sized to its container on window resize -----
    window.addEventListener("resize", function () {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  }
})();
