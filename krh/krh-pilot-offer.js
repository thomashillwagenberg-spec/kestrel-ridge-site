(function () {
  'use strict';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // ---------------------------------------------------------------
  // 1. Phase Zero's 3-step scope, placed right after the phase overview.
  //    Privacy-scoped handoff -> forecast-vs-baseline comparison ->
  //    stop-or-continue decision. No price, no fixed timeline.
  // ---------------------------------------------------------------
  var overview = document.querySelector('.kr-story.kr-pilot');
  if (overview) {
    var steps = el('div', 'kr-p0-steps');
    steps.setAttribute('aria-label', 'Phase Zero, three steps');
    steps.innerHTML =
      '<div class="kr-p0-step"><span class="kr-p0-step-num">Step 1</span>' +
      '<h4>Privacy-scoped data handoff</h4>' +
      '<p>You export an approved slice of your own historical session data \u2014 ' +
      'no patient identifiers requested, no new software, agreed with your privacy office before anything moves.</p></div>' +
      '<div class="kr-p0-step"><span class="kr-p0-step-num">Step 2</span>' +
      '<h4>Forecast vs. baseline comparison</h4>' +
      '<p>Together with you, we fit a forecast to that export and score its error against your current method and a historical average, on your own data, not a demo dataset.</p></div>' +
      '<div class="kr-p0-step"><span class="kr-p0-step-num">Step 3</span>' +
      '<h4>Stop-or-continue decision</h4>' +
      '<p>If the forecast does not beat both comparisons by the margin agreed in writing beforehand, with its range near 80 percent coverage, the engagement ends. ' +
      'That finding is yours either way. If it does, we agree in writing what happens next.</p></div>';
    overview.parentNode.insertBefore(steps, overview.nextSibling);
  }

  // ---------------------------------------------------------------
  // 2. Hormozi value-equation CTA, placed near the stopping-rules
  //    section: dream outcome, credibility, speed, low effort \u2014
  //    no price, no urgency, no fabricated proof.
  // ---------------------------------------------------------------
  var stopSection = document.getElementById('any-one-of-these-stops-the-pilot-and-reverts-to-the-fixed-ratio');
  var anchor = stopSection ? stopSection.closest('section') : null;
  if (anchor) {
    var cta = el('div', 'kr-value-cta');
    cta.innerHTML =
      '<div>' +
      '<h3>Know where you\u2019ll be short \u2014 before it\u2019s a crisis</h3>' +
      '<div class="kr-value-row"><span class="kr-value-icon">\u2713</span>' +
      '<p><strong>The outcome:</strong> a clear read on technician coverage gaps weeks out, ' +
      'scored against your own history, not a sales pitch.</p></div>' +
      '<div class="kr-value-row"><span class="kr-value-icon">\u2713</span>' +
      '<p><strong>Why you can trust the read:</strong> the scoring method is written down ' +
      'and public \u2014 see the methodology link \u2014 and this is explicitly synthetic-stage, ' +
      'no real-clinic validation claimed yet.</p></div>' +
      '<div class="kr-value-row"><span class="kr-value-icon">\u2713</span>' +
      '<p><strong>How fast the first step is:</strong> one scoped data export, no platform-wide ' +
      'commitment, no calendar to clear.</p></div>' +
      '<div class="kr-value-row"><span class="kr-value-icon">\u2713</span>' +
      '<p><strong>What it costs you to find out:</strong> approved historical data you already ' +
      'have, with no patient identifiers requested and nothing new to learn \u2014 yet.</p></div>' +
      '</div>' +
      '<div class="kr-value-cta-actions">' +
      '<a class="btn-primary inline-flex min-h-11 items-center justify-center px-6 py-3 text-[0.9375rem] font-semibold" href="/contact/">Ask about Phase Zero</a>' +
      '<a class="inline-flex min-h-11 items-center justify-center px-6 py-3 text-[0.9375rem] font-semibold underline underline-offset-4" href="/methodology/">Read the methodology</a>' +
      '</div>';
    anchor.parentNode.insertBefore(cta, anchor.nextSibling);

    var callout = el('p', 'kr-stop-rule-callout',
      '<strong>The stop rule.</strong> The forecast must beat both your current method and a historical average, with its range close to 80 percent coverage, by a margin we agree in writing before we see your data. If it does not, the engagement stops there and you keep the findings.');
    anchor.insertBefore(callout, anchor.firstElementChild ? anchor.firstElementChild.nextSibling : null);
  }

  // ---------------------------------------------------------------
  // 3. Low-effort persistent mobile CTA (mirrors the one on /contact/).
  // ---------------------------------------------------------------
  var sticky = el('div', 'kr-mobile-sticky',
    '<a href="/contact/">Ask about Phase Zero</a>');
  document.body.appendChild(sticky);
})();
