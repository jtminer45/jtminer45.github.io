/*
  contact.js
  Handles the contact form: basic validation, a spam-trap honeypot field,
  and submitting to Formspree — without ever putting the owner's raw email
  address in the page's HTML or JS. Formspree forwards messages to whatever
  email was used to create the form ID below.
*/

// EDIT ME: replace with your real Formspree form ID (get one free at formspree.io,
// then paste the ID from your form's endpoint URL here).
const FORMSPREE_ID = "YOUR_FORM_ID_HERE";

(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const nameField = document.getElementById("field-name");
  const emailField = document.getElementById("field-email");
  const messageField = document.getElementById("field-message");
  const statusEl = document.getElementById("form-status");
  const submitButton = form.querySelector(".submit-button");

  // ----- Very basic email format check -----
  // Not a full RFC-5322 validator — just enough to catch obvious typos.
  function looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // ----- Show a status message below the form -----
  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("form-status-error", Boolean(isError));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Spam trap: if the honeypot field has anything in it, a bot filled it
    // in. Silently pretend to succeed and do nothing further.
    const honeypot = form.querySelector('input[name="company"]');
    if (honeypot && honeypot.value) {
      setStatus("message sent_", false);
      form.reset();
      return;
    }

    // ----- Validation -----
    if (!nameField.value.trim()) {
      setStatus("error: please enter your name", true);
      nameField.focus();
      return;
    }

    if (!looksLikeEmail(emailField.value.trim())) {
      setStatus("error: please enter a valid email", true);
      emailField.focus();
      return;
    }

    if (!messageField.value.trim()) {
      setStatus("error: please enter a message", true);
      messageField.focus();
      return;
    }

    if (FORMSPREE_ID === "YOUR_FORM_ID_HERE") {
      setStatus(
        "error: contact form isn't set up yet — email me directly instead",
        true
      );
      return;
    }

    // ----- Submit to Formspree -----
    submitButton.disabled = true;
    setStatus("sending...", false);

    fetch("https://formspree.io/f/" + FORMSPREE_ID, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    })
      .then(function (response) {
        if (response.ok) {
          setStatus("message sent_", false);
          form.reset();
        } else {
          setStatus(
            "error: something went wrong — please email me directly instead",
            true
          );
        }
      })
      .catch(function () {
        setStatus(
          "error: something went wrong — please email me directly instead",
          true
        );
      })
      .finally(function () {
        submitButton.disabled = false;
      });
  });
})();
