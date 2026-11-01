/*
  intro.js
  Runs the typing intro screen on every visit: types "> welcome to my world_",
  then waits for the visitor to click "enter" before glitching into the main
  site. The homepage never appears automatically — a click is required.
*/

(function () {
  // EDIT ME: change this line if you want the intro to type something else
  const INTRO_LINE = "> welcome to my world_";

  const introScreen = document.getElementById("intro-screen");
  const introText = document.getElementById("intro-text");
  const introSkip = document.getElementById("intro-skip");
  const mainContent = document.getElementById("main-content");

  // ----- Reveal the main site with the glitch transition -----
  // This only ever runs in response to the visitor clicking "enter".
  function enterSite() {
    introScreen.classList.add("glitching");
    // Wait for the glitch animation to play before swapping content.
    setTimeout(function () {
      introScreen.hidden = true;
      mainContent.hidden = false;
    }, 500);
  }

  // ----- Type INTRO_LINE into #intro-text one character at a time -----
  function typeIntro() {
    let charIndex = 0;

    // Blinking cursor element, appended after the typed characters.
    const cursor = document.createElement("span");
    cursor.className = "intro-cursor";

    function typeNextChar() {
      if (charIndex < INTRO_LINE.length) {
        introText.textContent = INTRO_LINE.slice(0, charIndex + 1);
        introText.appendChild(cursor);
        charIndex++;
        setTimeout(typeNextChar, 60); // typing speed
      }
      // When typing finishes, the line just sits there (cursor still
      // blinking) — the visitor clicks "enter" when they're ready.
    }

    typeNextChar();
  }

  // ----- Entry point -----
  // Always play the intro — it is not skipped on repeat visits, and the
  // main site only shows once "enter" is clicked.
  typeIntro();
  introSkip.addEventListener("click", enterSite);

  // Footer year, set here since it has nothing else to live in yet.
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
