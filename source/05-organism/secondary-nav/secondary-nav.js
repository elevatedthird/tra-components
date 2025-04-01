/**
 * @file secondary-nav.js
 *
 * Secondary nav
 */

Drupal.behaviors.ariesSecondaryNav = {
  attach(context) {
    // If there is no secondary nav, or the page is under 960 keep the header stickied full height.
    const secondaryNav = (context.classList && context.classList.contains('secondary-nav')) ? context : context.querySelector('.secondary-nav');
    if (!secondaryNav || window.innerWidth < 960) return;

    // Check if the secondary nav is inside an element with the class 'page--fund-center'
    if (secondaryNav.closest('.page--fund-center')) return;

    // Set bottom anchor on header sticky so only the secondary nav stickies beyond a point.
    const headerContent = document.querySelector('.header-content');
    headerContent.setAttribute('data-btm-anchor', 'sec-nav-anchor');
  },
};
