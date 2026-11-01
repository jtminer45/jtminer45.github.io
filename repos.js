/*
  repos.js
  The single source of truth for the repo list shown on the site.
  Both the 3D globe (globe.js, as orbiting nodes) and the plain fallback
  list read from this same REPOS array, so you only ever add a repo here.
*/

// EDIT ME: add/remove repo entries here. Each one looks like:
// { name: "repo-name", brief: "short description", url: "https://github.com/...", lang: "Python" }
window.REPOS = [
  {
    name: "longon-capital",
    brief: "NGX analytics platform",
    url: "https://github.com/jtminer45/longon-capital",
    lang: "Python",
  },
  {
    name: "ml-sandbox",
    brief: "Experiments with small machine learning models",
    url: "https://github.com/jtminer45/ml-sandbox",
    lang: "Python",
  },
  {
    name: "shop-automation",
    brief: "Automation tools for small businesses",
    url: "https://github.com/jtminer45/shop-automation",
    lang: "JavaScript",
  },
];
