/**
 * @file footer.js
 *
 * Footer functionality
 */

Drupal.behaviors.regionalSelect = {
  attach(context) {
    const regionalSelects = (context.classList && context.classList.contains('layout--footer')) ? context : context.querySelector('.layout--footer');
    if (!regionalSelects) return;
    once('aries_regional_select', regionalSelects).forEach((regionalSelect) => {
      const menu = regionalSelect.querySelector('.molecule--menu--footer-regional-select > .menu');
      if (menu) {
        const expandedItem = menu.querySelector('.menu-item--expanded');

        // Click to open hidden menu items.
        expandedItem.addEventListener('click', (ev) => {
          ev.preventDefault();
          menu.classList.toggle('show-dropdown');
        });

        // Set keystrokes for accessibility.
        expandedItem.addEventListener('keydown', (ev) => {
          // Enter or space will open the dropdown.
          if (ev.keyCode === 13 || ev.keyCode === 32) {
            ev.preventDefault();
            menu.classList.toggle('show-dropdown');
          }
        });

        // Close dropdown if clicking off of menu.
        document.addEventListener('click', (ev) => {
          const isInside = menu.contains(ev.target);
          if (!isInside && menu.classList.contains('show-dropdown')) {
            menu.classList.remove('show-dropdown');
          }
        });
      }
    });
  },
};
