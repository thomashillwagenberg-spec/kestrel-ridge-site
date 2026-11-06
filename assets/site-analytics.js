(() => {
  const ID = 'G-7X0ZX70KQK';
  const KEY = 'krh-analytics-choice-v1';
  const DAYS = 180 * 24 * 60 * 60;
  const production = ['kestrelridgehealth.com', 'www.kestrelridgehealth.com'].includes(location.hostname);
  let loaded = false;
  let consent = false;
  let panel;
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet'; sheet.href = '/assets/site-analytics.css'; document.head.appendChild(sheet);
  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      return value && ['yes', 'no'].includes(value.value) && value.expires > Date.now() ? value.value : null;
    } catch { return null; }
  }
  function clearCookies() {
    for (const item of document.cookie.split(';')) {
      const name = item.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', ';domain=' + location.hostname, ';domain=.kestrelridgehealth.com']) {
        document.cookie = name + '=;Max-Age=0;path=/' + domain + ';SameSite=Lax;Secure';
      }
    }
  }
  function enable() {
    consent = true;
    window['ga-disable-' + ID] = false;
    if (!production || loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    let referrer = '';
    try { if (document.referrer) referrer = new URL(document.referrer).origin; } catch {}
    window.gtag('config', ID, {
      send_page_view: true, page_location: location.origin + location.pathname, page_referrer: referrer,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: DAYS, cookie_update: false,
    });
    const tag = document.createElement('script');
    tag.async = true; tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(tag);
  }
  function disable() {
    consent = false;
    window['ga-disable-' + ID] = true;
    clearCookies();
  }
  function save(value) {
    try { localStorage.setItem(KEY, JSON.stringify({ value, expires: Date.now() + DAYS * 1000 })); } catch {}
    if (value === 'yes') enable(); else disable();
    panel.hidden = true;
    settings.textContent = value === 'yes' ? 'Analytics settings (allowed)' : 'Analytics settings (off)';
    settings.focus();
  }
  const settings = document.createElement('button');
  settings.type = 'button'; settings.className = 'krh-analytics-settings'; settings.textContent = 'Analytics settings';
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  document.body.appendChild(settings);
  panel = document.createElement('section');
  panel.className = 'krh-analytics-panel'; panel.setAttribute('aria-label', 'Optional Google Analytics');
  panel.innerHTML = '<div><h2>May we measure your visit?</h2><p>With your permission, Google Analytics records page views and consultation-link clicks to help us improve KRH. No form contents are sent. Your choice is remembered for 180 days. <a href="/privacy/#google-analytics">Privacy details</a>.</p></div><div class="krh-analytics-actions"><button type="button" data-choice="yes">Allow analytics</button><button type="button" data-choice="no">No thanks</button></div>';
  panel.addEventListener('click', event => { const value = event.target?.dataset?.choice; if (['yes', 'no'].includes(value)) save(value); });
  document.body.appendChild(panel);
  const initial = readChoice();
  if (initial === 'yes') enable(); else disable();
  panel.hidden = initial !== null;
  if (initial) settings.textContent = initial === 'yes' ? 'Analytics settings (allowed)' : 'Analytics settings (off)';
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    const choice = readChoice();
    if (choice === 'yes') enable(); else disable();
    panel.hidden = choice !== null;
    settings.textContent = choice === 'yes' ? 'Analytics settings (allowed)' : 'Analytics settings (off)';
  });
  document.addEventListener('click', event => {
    if (!consent || !production || !window.gtag) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    let target;
    try { target = new URL(link.href, location.origin); } catch { return; }
    if (target.origin === location.origin && target.pathname === '/contact/') {
      window.gtag('event', 'consultation_link_click', { source_page: location.pathname, link_path: '/contact/' });
    }
  });
})();
