(() => {
  const form = document.querySelector('[data-article-feedback]');
  if (!form) return;
  const status = form.querySelector('[role="status"]');
  const button = form.querySelector('button[type="submit"]');
  const article = location.pathname;
  const storageKey = `krh-rating:${article}`;
  try {
    if (localStorage.getItem(storageKey)) {
      form.querySelector('fieldset').disabled = true;
      button.hidden = true;
      status.textContent = 'You’ve already rated this article in this browser. Thank you.';
    }
  } catch { /* Rating remains available when browser storage is blocked. */ }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    button.disabled = true;
    status.textContent = 'Sending your rating…';
    const fields = new FormData(form);
    let visitor;
    try {
      visitor = localStorage.getItem('krh-feedback-browser');
      if (!visitor) { visitor = crypto.randomUUID(); localStorage.setItem('krh-feedback-browser', visitor); }
    } catch { visitor = crypto.randomUUID(); }
    try {
      const reply = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article, visitor, rating: Number(fields.get('rating')), improvement: fields.get('improvement') || '' }),
      });
      const result = await reply.json();
      if (!reply.ok || !result.ok) throw new Error('Rating was not saved');
      try { localStorage.setItem(storageKey, 'submitted'); } catch { /* Server still checks duplicates. */ }
      form.querySelector('fieldset').disabled = true;
      button.hidden = true;
      status.textContent = result.recorded ? 'Thank you. Your rating was recorded.' : 'You’ve already rated this article in this browser. Thank you.';
    } catch {
      button.disabled = false;
      status.textContent = 'Your rating couldn’t be saved. Please try again later.';
    }
  });
})();
