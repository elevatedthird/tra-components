/**
 * dropdown-menu.js
 * Dropdown Menu functionality.
 */
import { DropdownMenu } from 'foundation-sites/js/foundation.dropdownMenu';

Drupal.behaviors.ariesDropdownMenu = {
  attach(context) {
    const dropdownMenus = context.querySelectorAll('[data-dropdown-menu]');
    if (!dropdownMenus) return;

    dropdownMenus.forEach((menu) => {
      new DropdownMenu($(menu));
      // find closest molecule--menu--main
      const mainMenu = menu.closest('.molecule--menu--main');
      // add class to main menu
      if (mainMenu) {
        mainMenu.classList.add('has-dropdown-menu');
      }

      // Once a dropdown menu is activated, the user can move from one nav item
      // category to the next, using hover.
      const topLevelMenuItems = menu.querySelectorAll(':scope > li.is-dropdown-submenu-parent > a');
      // Open dropdown on hover and close any other open submenu.
      topLevelMenuItems.forEach((item) => {
        item.addEventListener('mouseenter', (e) => {
          const openItem = menu.querySelector('li[data-is-click="true"] > a');
          if (!openItem) return;

          if (openItem !== e.target) {
            e.target.click();
          }
        });
      });
    });
    // const testMenu = document.querySelectorAll(".menu-level--1 > .is-dropdown-submenu-parent");
    // testMenu.forEach((menu) => {
    //   menu.classList.remove("is-dropdown-submenu-parent");
    // });
  },
};
