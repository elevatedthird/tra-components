import once from "@drupal/once";

import MicroModal from 'micromodal';
// non jquery version
Drupal.behaviors.ariesPolicyExplorer = {
  attach(context) {
    MicroModal.init();
    once('policy-explorer', '.molecule--icon-card.capture-button-click button', context).forEach((el) => {
      const selectedInsuranceOptionEl = document.querySelector('input[data-drupal-selector="edit-selected-insurance-option"]', context);

      const submitButtonEl = el.closest('form').querySelector('.webform-button--next');
      // on click prevent default
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedInsuranceOptionEl && submitButtonEl) {
          selectedInsuranceOptionEl.value = e.target.value;
          document.cookie = `policy-type=${e.target.value};`;
          // trigger a click of the submit button
          submitButtonEl.click();
        }
      });
    });
  }
};
