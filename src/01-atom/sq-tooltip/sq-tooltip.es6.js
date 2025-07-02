/**
 * tooltip.js
 * Tooltip functionality.
 */

import { Tooltip } from 'foundation-sites/js/foundation.tooltip';


(function ($, Drupal, once) {
  Drupal.behaviors.ariesTooltip = {
    attach(context) {
      console.log('tip');
      once('ariesTooltip', context.querySelectorAll('.has-tip')).forEach((tooltip) => {
        // Find the closest parent element that has background color set.
        var bgClass = $(tooltip).closest("[class*='bg-color-']").attr('class').split(' ')
          .find((c) => c.startsWith('bg-color-'));
        if (!bgClass) {
          bgClass = $(tooltip).closest("[class*='sub-bg-color-']").attr('class').split(' ')
            .find((c) => c.startsWith('sub-bg-color-'));
          bgClass = bgClass.replace('sub-', '');
        }
        new Tooltip($(tooltip), {
          allowHtml: true,
          hoverDelay: 150,
          tooltipHeight: 8,
          templateClasses: bgClass,
        });
      });
    }
  };
})(jQuery, Drupal, once);
