/**
 * tippy.js
 * Tooltip functionality.
 */
import tippy from 'tippy.js';
import { hideAll } from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling
import once from '@drupal/once';

Drupal.behaviors.ariesTippy = {
  attach(context) {
    const elements = $(once('tippy', '.tippy', context));
    const decodeHtml = (html) => {
      const txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    };
    elements
      .each((index, el) => {
        // tippy content is set via the previous template element
        const tippyContent = decodeHtml($(el).find('template')[0].innerHTML);
        tippy(el, {
          content: tippyContent,
          allowHTML: true,
          delay: [0, 1500], // ms
          duration: 0,
          interactive: true,
          onShow(instance) {
            hideAll({ exclude: instance });
          },
        });
      });
  },
};
