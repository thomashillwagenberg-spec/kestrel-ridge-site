/* krh-exit-warning.js — additive, non-conflicting accidental-exit guard.
 * Does NOT touch form submission (no preventDefault on submit, no fetch,
 * no state read from the hydrated React form). It only watches whether any
 * .field input/textarea on the page has unsaved text, and if so asks the
 * browser to confirm navigation away via the native beforeunload prompt.
 * The guard clears itself once the page's own success copy appears, so it
 * never nags after a real accepted submission or a real mailto handoff. */
(function () {
  "use strict";

  function fieldsHaveContent() {
    var fields = document.querySelectorAll(
      'form .field, form input[type="text"], form input[type="email"], form textarea'
    );
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      if (el && typeof el.value === "string" && el.value.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  function successAlreadyShown() {
    // The real contact/waitlist components render one of these exact
    // strings once the real fetch/mailto path completes. If either is
    // visible, the visitor's work is done — never warn after that.
    var markers = [
      "Received. We will reply by email.",
      "Your message was received.",
      "Your address was received.",
      "Your mail client should have opened",
      "You are on the list",
    ];
    var text = document.body ? document.body.innerText : "";
    for (var i = 0; i < markers.length; i++) {
      if (text.indexOf(markers[i]) !== -1) return true;
    }
    return false;
  }

  window.addEventListener("beforeunload", function (e) {
    if (successAlreadyShown()) return;
    if (!fieldsHaveContent()) return;
    e.preventDefault();
    e.returnValue = "";
    return "";
  });
})();
