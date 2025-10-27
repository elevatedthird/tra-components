/**
 * tooltip.js
 * Tooltip functionality.
 */

import { Tooltip } from 'foundation-sites/js/foundation.tooltip';


(function ($, Drupal, once) {
  Drupal.behaviors.ariesTooltip = {
    attach(context) {
      once('ariesTooltip', '.has-tip').forEach((tooltip) => {
        // Find the closest parent element that has background color set.
        var bgClass = $(tooltip).closest("[class*='bg-color-']").attr('class').split(' ')
          .find((c) => c.startsWith('bg-color-'));
        if (!bgClass) {
          bgClass = $(tooltip).closest("[class*='sub-bg-color-']").attr('class').split(' ')
            .find((c) => c.startsWith('sub-bg-color-'));
          bgClass = bgClass.replace('sub-', '');
        }
        const _tooltip = new Tooltip($(tooltip), {
          allowHtml: true,
          hoverDelay: 150,
          tooltipHeight: 8,
          templateClasses: bgClass,
        });
      });
    }
  };
})(jQuery, Drupal, once);
