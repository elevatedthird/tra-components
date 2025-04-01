/**
 * accordion.js
 * Accordion functionality.
 */

import { Accordion } from 'foundation-sites/js/foundation.accordion';
import once from "@drupal/once";

Drupal.behaviors.ariesAccordion = {
  attach(context) {
    once('ariesAccordion', context.querySelectorAll('.accordion')).forEach((accordion) => {
      const accordionEl = new Accordion($(accordion), { multiExpand: true });

      if ($(accordion).closest('.view-financial-results').length > 0) {
        const firstContent = $(accordion).find('.accordion-content').first();
        if (firstContent.length > 0) {
          accordionEl.toggle(firstContent);
        }
      }
    });
  },
};
