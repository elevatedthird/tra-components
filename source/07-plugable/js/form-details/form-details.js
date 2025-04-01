/**
 * form-details.js
 * Form details functionality.
 * Sets first details element in a form to be open and the rest closed when there are multiple.
 * - add class 'open-first-details' to same element as 'filters-wrapper' to use
 */

Drupal.behaviors.ariesFormDetails = {
  attach(context) {
    const formDetails = (context.classList && context.classList.contains('details-wrapper')) ? context : context.querySelector('form .details-wrapper');
    if (!formDetails) {
      return;
    }

    // Open outer details wrapper
    const formDetailsWrapper = context.querySelector('form details:not(.form-item)');
    formDetailsWrapper.setAttribute('open', true);
    formDetailsWrapper.querySelector('summary').setAttribute('aria-expanded', true);

    // Open first details
    const openFirstDetails = document.querySelector('.filters-wrapper.open-first-details');
    // if (openFirstDetails) {
    //   this.openFirstDetails(formDetails);
    // }

    // Close all inner details after any click for forms without openFirstDetails.
    if (!openFirstDetails) {
      document.addEventListener('click', (e) => {
        const allDetails = formDetailsWrapper.querySelectorAll('.details-wrapper details');
        allDetails.forEach((details) => {
          const summary = details.querySelector('summary');
          if (e.target !== summary) {
            summary.setAttribute('aria-expanded', false);
            details.removeAttribute('open');
          }
        });
      });
    }
  },

  openFirstDetails(formDetails) {
    formDetails.children[0].setAttribute('open', true);
    formDetails.children[0].querySelector('summary').setAttribute('aria-expanded', true);
  },
};
