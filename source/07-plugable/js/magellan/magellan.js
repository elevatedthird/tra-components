/**
 * magellan.js
 * Magellan functionality.
 */
import { Magellan } from 'foundation-sites/js/foundation.magellan';
import once from '@drupal/once';

Drupal.behaviors.ariesMagellan = {
  attach(context) {
    const elements = $(once('magellan', '[data-magellan]', context));

    elements
      .each((index, el) => {
        // eslint-disable-next-line no-unused-vars
        const magellan = new Magellan($(el));
      });
  },
};
