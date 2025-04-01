/**
 * sticky.js
 * Sticky functionality.
 */
import { Sticky } from 'foundation-sites/js/foundation.sticky';
import once from "@drupal/once";

Drupal.behaviors.ariesDataStyle = {
  attach(context) {
    const elements = $(once('data-style', '[data-style]', context));

    elements.each((index, el) => {
        const style = $(el).attr('data-style');
        $(el).attr('style', style);
      });
  },
};
