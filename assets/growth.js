// Mobile primary navigation for plain (non-Next) pages.
// Toggle opens/closes #mobile-nav, Escape closes and returns focus to the
// toggle, opening moves focus to the first link, a click outside closes it.
// Without JavaScript a <noscript> style keeps the links visible instead.
(function () {
  var menu = document.querySelector('button[aria-controls="mobile-nav"]');
  var navigation = document.getElementById('mobile-nav');
  if (!menu || !navigation) return;
  function setOpen(open, returnFocus) {
    menu.setAttribute('aria-expanded', String(open));
    navigation.hidden = !open;
    if (open) {
      var first = navigation.querySelector('a');
      if (first) first.focus();
    } else if (returnFocus) {
      menu.focus();
    }
  }
  menu.addEventListener('click', function () {
    setOpen(menu.getAttribute('aria-expanded') !== 'true', false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  document.addEventListener('click', function (event) {
    if (menu.getAttribute('aria-expanded') !== 'true') return;
    if (menu.contains(event.target) || navigation.contains(event.target)) return;
    setOpen(false, false);
  });
  navigation.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false, false);
  });
})();
