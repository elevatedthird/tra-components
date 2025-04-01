/**
 * sticky.js
 * Sticky functionality.
 */
import { Sticky } from 'foundation-sites/js/foundation.sticky';
import once from "@drupal/once";

Drupal.behaviors.ariesSticky = {
  attach(context) {
    const elements = $(once('sticky', '[data-sticky]', context));

    elements
      .each((index, el) => {
        // eslint-disable-next-line no-unused-vars
        const sticky = new Sticky($(el));
      });
  },
};
