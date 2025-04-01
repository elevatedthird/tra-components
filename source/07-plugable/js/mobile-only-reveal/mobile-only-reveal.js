/**
 * mobile-only-reveal.js
 * Used for views with a modal of filters on mobile.
 * Show the view without the modal for desktop.
 * HOW TO USE:
 * - add the class "mobile-only-reveal--wrapper" to a wrapper tag containing the reveal elements.
 */

import { MediaQuery } from 'foundation-sites/js/foundation.util.mediaQuery';
import once from "@drupal/once";

Drupal.behaviors.ariesMobileOnlyReveal = {
  attach(context) {
    const modal = $(context).find('#filterModal');
    if (modal) {
      // make open modal by js, because foundation reveal broke page position after ajax reload
      $(context).find('.open-filter-modal').click(() => {
        modal.show();
        modal.parent().show();
      });

      modal.find('.close-button').click(() => {
        modal.hide();
        modal.parent().hide();
      });
    }

    const mainFilters = $(once('view-grid-with-filters', '.main-filters', context));

    mainFilters.each((index, el) => {
        $(document).find('html').removeClass('zf-has-scroll');
        $(document).find('html').removeClass('is-reveal-open');
        // eslint-disable-next-line no-underscore-dangle
        MediaQuery._init();
        this.handleRevealClass(el);

        $(window).resize(() => {
          this.handleRevealClass(el);
        });
      });

    const advancedBanner = document.querySelector('.advanced_banner');
    if (advancedBanner) {
      const sidebarGrid = advancedBanner.querySelector('.composition--view-sidebar-grid');
      if (sidebarGrid) {
        const header = advancedBanner.querySelector('.header');
        header.classList.add('has-top-mobile-trigger');
      }
    }
  },

  handleRevealClass(el) {
    if (MediaQuery.is('medium down')) {
      $(el).closest('.cell .reveal-wrapper').addClass('reveal-overlay');
      $(el).addClass('reveal');
    } else {
      $(el).closest('.cell .reveal-wrapper').removeClass('reveal-overlay');
      $(el).removeClass('reveal');
    }
  },
  
};
