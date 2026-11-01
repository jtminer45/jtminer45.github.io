/*
  globe.js
  Builds the 3D rotating Earth (Three.js) and the repo orbit nodes, and
  renders the plain-list fallback for devices/browsers without 3D.

  Built out fully in Stage 2 (globe) and Stage 3 (repo nodes + fallback list).
  This is a placeholder for now — it only renders the fallback list so the
  page has no missing pieces yet.
*/

(function () {
  // ----- Render the plain fallback list from repos.js -----
  // This runs now so the list works even before the globe exists.
  function renderFallbackList() {
    const list = document.getElementById("repo-list");
    if (!list || !window.REPOS) return;

    window.REPOS.forEach(function (repo) {
      const item = document.createElement("li");
      item.textContent = repo.name + " — " + repo.brief;
      list.appendChild(item);
    });
  }

  renderFallbackList();

  // 3D globe setup will be added here in Stage 2.
})();
