/*
  intro.js
  Runs the one-time typing intro screen: types "> welcome to my world_",
  holds for a second, glitches, then reveals the main site.
  Also wires up the "enter" button (skips straight to the main site), and
  remembers (via localStorage) that the visitor has already seen the intro
  so it doesn't replay on repeat visits.
*/

(function () {
  // EDIT ME: change this line if you want the intro to type something else
  const INTRO_LINE = "> welcome to my world_";

  const STORAGE_KEY = "introSeen"; // localStorage flag name

  const introScreen = document.getElementById("intro-screen");
  const introText = document.getElementById("intro-text");
  const introSkip = document.getElementById("intro-skip");
  const mainContent = document.getElementById("main-content");

  // ----- Skip straight to the main site, no animation -----
  function showMainContentImmediately() {
    introScreen.hidden = true;
    mainContent.hidden = false;
  }

  // ----- Reveal the main site with the glitch transition -----
  function finishIntro() {
    introScreen.classList.add("glitching");
    // Wait for the glitch animation to play before swapping content.
    setTimeout(function () {
      introScreen.hidden = true;
      mainContent.hidden = false;
      localStorage.setItem(STORAGE_KEY, "true");
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
      } else {
        // Hold the finished line for ~1s, then glitch into the main page.
        setTimeout(finishIntro, 1000);
      }
    }

    typeNextChar();
  }

  // ----- Entry point -----
  // If the visitor has already seen the intro this browser before, skip it entirely.
  if (localStorage.getItem(STORAGE_KEY) === "true") {
    showMainContentImmediately();
  } else {
    typeIntro();
    introSkip.addEventListener("click", function () {
      localStorage.setItem(STORAGE_KEY, "true");
      showMainContentImmediately();
    });
  }

  // Footer year, set here since it has nothing else to live in yet.
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
