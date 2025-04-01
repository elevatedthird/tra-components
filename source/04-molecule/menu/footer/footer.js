import { Foundation } from 'foundation-sites/js/foundation.core';
import { AccordionMenu } from 'foundation-sites/js/foundation.accordionMenu';
import { MediaQuery } from 'foundation-sites/js/foundation.util.mediaQuery';
import once from '@drupal/once';

Drupal.behaviors.ariesMoleculeMenuFooter = {
  attach(context) {
    // Apply the AccordionMenu plugin to footer menus on Mobile.
    const elements = $(once('ariesMoleculeMenuFooter', '.molecule--menu--footer > ul.menu, .molecule--menu--footer-legal-links > ul.menu', context));

    MediaQuery._init();
    Foundation.addToJquery($);

    elements.each((index, el) => {
      // Activate the AccordionMenu plugin.
      if (MediaQuery.upTo('medium')) {
        $(el).addClass('accordion-menu');
        new AccordionMenu($(el), {
          multiOpen: false,
        });
      }

      // Prevent clicks on Submenu titles on Desktop.
      $(el).find('> .menu-item > a').on('click', (event) => {
        if (MediaQuery.atLeast('large')) {
          event.preventDefault();
        }
      });

      $(window).on('changed.zf.mediaquery', () => {
        if (MediaQuery.atLeast('large')) {
          // Disable the AccordionMenu plugin on Desktop view.
          if ($(el).hasClass('accordion-menu')) {
            $(el).removeClass('accordion-menu');
            $(el).foundation('_destroy');
          }
        } else if (!$(el).hasClass('accordion-menu')) {
          // Activate the AccordionMenu plugin on Mobile view.
          $(el).addClass('accordion-menu');
          new AccordionMenu($(el), {
            multiOpen: false,
          });
        }
      });
    });
  },
};
