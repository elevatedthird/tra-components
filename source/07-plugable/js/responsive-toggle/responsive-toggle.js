/**
 * responsive-toggle.js
 * Menu toggle functionality.
 */

import { MediaQuery } from 'foundation-sites/js/foundation.util.mediaQuery';


Drupal.behaviors.ariesResponsiveToggle = {
  attach(context) {
    const menuToggle = (context.classList && context.classList.contains('menu-toggle')) ? context : context.querySelector('.menu-toggle');
    MediaQuery._init();

    // if has the data-once attribute, then it's already been initialised
    if (!menuToggle) return;
    if (menuToggle.getAttribute('data-once') !== null) return;
    // add data attribute to menu toggle to track initialisation
    menuToggle.setAttribute('data-once', '');
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('menu-active');
    });

    // on window resize
    $(window).on('resize', () => {
      if (MediaQuery.is('mobile_menu')) {
        document.body.classList.remove('menu-active');
      }
    });

    // Add the click event to the language selector and search buttons
    // Check if both buttons exist in the DOM
    if ($('.site-search-btn', context).length && $('.language-selector__flag-button', context).length) {

      $('.language-selector__flag-button', context).on('click', function() {
        // If the search box is open, close it
        if ($('.site-search-div').hasClass('is-active')) {
          $('.site-search-div').removeClass('is-active');
          $('#site-search').attr('aria-expanded', 'false');
        }
      });

      $('.site-search-btn', context).on('click', function() {
        // If the modal is displayed, close it
        if ($('.reveal-overlay').css('display') === 'block') {
          $('.reveal-overlay').css('display', 'none');
        }

        $('.is-reveal-open').removeClass('is-reveal-open');

      });

      $('.close-icon', context).on('click', function(event) {
        event.stopPropagation();

        // Find the closest .menu-item parent
        var menuItem = $(this).closest('.menu-item');

        // Check if the aria-expanded attribute is set to true and change it
        if (menuItem.attr('aria-expanded') === "true") {
          menuItem.attr('aria-expanded', "false");
        }
      });
    }
  },
};
