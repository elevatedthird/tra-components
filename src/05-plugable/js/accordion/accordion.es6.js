/**
 * accordion.js
 * Accordion functionality.
 */

import { Accordion } from 'foundation-sites/js/foundation.accordion';


Drupal.behaviors.ariesAccordion = {
  attach(context) {
    once('ariesAccordion', context.querySelectorAll('.accordion')).forEach((accordion) => {
      const accordionEl = new Accordion($(accordion), { multiExpand: true });

      // @todo i think this can be removed.
      if ($(accordion).closest('.view-financial-results').length > 0) {
        const firstContent = $(accordion).find('.accordion-content').first();
        if (firstContent.length > 0) {
          accordionEl.toggle(firstContent);
        }
      }
    });
  },
};
