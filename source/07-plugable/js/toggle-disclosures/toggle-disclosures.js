/**
 * @file toggle-disclosures.js
 *
 * Helpers for Admin Experience
 */

import { Tooltip } from 'foundation-sites/js/foundation.tooltip';


Drupal.behaviors.ariesToggleDisclosures = {
  attach(context) {
    const toggleDivs = document.getElementsByClassName('toolbar-tab--disclosures');
    if (toggleDivs.length) { return; }
    const tooltips = context.querySelectorAll('.has-tip');
    const accordions = context.querySelectorAll('.accordion-item > a');
    if (tooltips.length < 1 && accordions.length < 1) { return; }

    const toolbar = document.querySelector('#toolbar-administration nav');
    const newNode = document.createElement('div');
    const button = document.createElement('a');
    newNode.classList.add('toolbar-tab');
    newNode.classList.add('toolbar-tab--disclosures');
    button.innerHTML = 'Toggle Hidden';
    button.classList.add('toolbar-item');
    button.addEventListener('click', () => {
      accordions.forEach((accordion) => {
        accordion.click();
      });
    });
    newNode.appendChild(button);
    toolbar.appendChild(newNode);
    $(once('toolbar-tab--disclosures', '.toolbar-tab--disclosures', context)).on( "click", function() {
      $('.tooltip-admin').toggleClass('tooltip-admin-hidden');
    });
  },
};
