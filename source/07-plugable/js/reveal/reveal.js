/**
 * reveal.js
 * Reveal (modal) functionality.
 */
import { Reveal } from 'foundation-sites/js/foundation.reveal';
import once from '@drupal/once';

Drupal.behaviors.ariesReveal = {
  attach(context) {
    const elements = $(once('reveal', '[data-reveal]', context));
    elements.each((index, el) => {
      // eslint-disable-next-line no-unused-vars
      const reveal = new Reveal($(el));
    });
  },
};
