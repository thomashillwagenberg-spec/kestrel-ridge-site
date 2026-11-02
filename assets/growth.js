const menu = document.querySelector('button[aria-controls="mobile-nav"]');
const navigation = document.getElementById('mobile-nav');
if (menu && navigation) {
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!expanded));
    navigation.hidden = expanded;
  });
}
