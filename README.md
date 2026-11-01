# Welcome to My World

Jonathan Miner's one-page portfolio site. Plain HTML, CSS, and JavaScript
only — no frameworks, no build step. The only outside library is
[Three.js](https://threejs.org/), loaded from a CDN for the background globe.

## Previewing it locally

Because the page loads its own `.js` files, some browsers (notably Chrome)
block that when you just double-click `index.html` and open it as a
`file://` URL. The easiest fix is to serve the folder over a tiny local
server instead:

```bash
cd zee
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. (Any other static
server — `npx serve`, VS Code's "Live Server" extension, etc. — works too.)

## Adding or editing repos

Open `repos.js`. It's a single array — add, remove, or edit entries there
and the repo list updates automatically. Each entry looks like:

```js
{
  name: "repo-name",
  brief: "short description",
  url: "https://github.com/jtminer45/repo-name",
  lang: "Python",
}
```

## Setting up the contact form

The contact form sends messages through [Formspree](https://formspree.io/)
so your email address never has to appear in the page's code.

1. Create a free account at formspree.io and make a new form pointed at
   your email address.
2. Copy the form ID from the endpoint URL Formspree gives you (the part
   after `/f/`).
3. Open `contact.js` and replace the placeholder on the `FORMSPREE_ID` line
   near the top of the file:
   ```js
   const FORMSPREE_ID = "YOUR_FORM_ID_HERE";
   ```
4. Submit a test message from the live site to confirm it arrives.

Until a real ID is set, the form will show an error message telling
visitors to email you directly instead of silently failing.

## Publishing on GitHub Pages

1. Create a repository named exactly `jtminer45.github.io` on GitHub.
2. Push this folder's contents to that repository's `main` branch:
   ```bash
   git remote add origin https://github.com/jtminer45/jtminer45.github.io.git
   git branch -M main
   git push -u origin main
   ```
3. In the repository's Settings → Pages, set the source to deploy from the
   `main` branch (a repo named `<username>.github.io` is usually published
   automatically at `https://jtminer45.github.io` within a minute or two).
4. Visit `https://jtminer45.github.io` to see it live.

Any time you push new changes to `main`, GitHub Pages redeploys the site
automatically — no extra steps needed.
