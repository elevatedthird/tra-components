/**
 * Javascript for handling Interstitial message features.
 * 01 - Helper Functions
 * 02 - Link
 * 03 - Page
 */

import MicroModal from 'micromodal';
import once from '@drupal/once';

/**
 * 01 - Helper Functions
 */

function initMicroModal(context) {
  const modals = context.classList && context.classList.contains('modal')
    ? [context] : context.querySelectorAll('.modal');

  modals.forEach((modal) => {
    // Move modal content to end of layout container for better z-index control
    const layoutContainer = document.querySelector('.layout-container');
    if (context.querySelectorAll('.plan-explorer-container').length === 0) {
      layoutContainer.append(modal);
    }
  });

  MicroModal.init();
}

// Return true if all the checkboxes are true.
function allCheckedCheckbox(modal) {
  const checkedCount = modal.querySelectorAll('input[type=checkbox]:checked').length;
  const checkboxCount = modal.querySelectorAll('input[type=checkbox]').length;
  return checkedCount === checkboxCount;
}

// Return true if password is equal with the correct given value.
function allPasswordCheck(modal) {
  const passwords = modal.querySelectorAll('input[type=password]');
  return (passwords.length === 0) || [...passwords].filter((element) => element.getAttribute('data-password') === element.value).length > 0;
}

// Enable the submit button if all the checkboxes are checked and the passwords are correct.
function handleModalForm(interstitialId) {
  const modal = document.querySelector(`#${interstitialId}`);
  const submitBtn = modal.querySelector('.submit');
  const checkboxes = modal.querySelectorAll('input[type=checkbox]');
  const passwords = modal.querySelectorAll('input[type=password]');

  function getDisabled() {
    return !allCheckedCheckbox(modal) || !allPasswordCheck(modal);
  }

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('click', () => {
      submitBtn.disabled = getDisabled();
    });
  });
  passwords.forEach((password) => {
    password.addEventListener('keyup', () => {
      submitBtn.disabled = getDisabled();
    });
  });
}

function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires =${date.toUTCString()}`;
  }
  document.cookie = `${name}=${(value || '')}${expires}; path=/`;
}

function getCookie(name) {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

/**
 * 02 - Link
 *
 * Prevent links with interstitial messages from redirecting
 * until a user agrees to the defined conditions.
 */

Drupal.behaviors.LinkInterstitialMessage = {
  attach(context) {
    once('LinkInterstitialMessage', context === document ? 'html' : context).forEach(() => {
      // Get the links containing an interstitial messsage.
      const links = context.querySelectorAll('.paragraph.interstitial, .node__content.interstitial');

      if (links && links.length > 0) {
        initMicroModal(context);

        links.forEach((el) => {
          const link = el.querySelector('a, button');
          const interstitialId = `interstitial-${el.getAttribute('data-interstitial-message')}`;

          if (!getCookie(interstitialId)) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              const submitBtn = document.querySelector(`#${interstitialId} .submit`);
              const closeBtn = document.querySelector(`#${interstitialId} .close`);

              // If submitted, take user to link.
              submitBtn.addEventListener('click', (submitEvent) => {
                submitEvent.preventDefault();
                if (link.href !== undefined) {
                  location.href = link.href; // eslint-disable-line no-restricted-globals
                } else {
                  MicroModal.close(interstitialId);
                }
                setCookie(interstitialId, true, 365);
              });

              // If passed, close the modal.
              closeBtn.addEventListener('click', (closeEvent) => {
                closeEvent.preventDefault();
                MicroModal.close(interstitialId);

                // Close Video Modals.
                const tempLinks = document.querySelectorAll('a, button');
                tempLinks.forEach((linkElement) => {
                  if (linkElement.hasAttribute('data-micromodal-trigger')) {
                    MicroModal.close(linkElement.getAttribute('data-micromodal-trigger'));
                  }
                });
              });

              // Enable the button if all the checkboxes are checked.
              handleModalForm(interstitialId);

              // Show modal.
              MicroModal.show(interstitialId, {
                disableScroll: true,
              });
            });
          }
        });
      }
    });
  },
};

/**
 * 03 - Page
 *
 * Handles visitors arriving at a page with an interstitial message.
 */

Drupal.behaviors.PageInterstitialMessage = {
  attach(context) {
    once('PageInterstitialMessage', context === document ? 'html' : context).forEach(() => {
      const interstitialNodes = context.querySelectorAll('.node.display-interstitial');

      if (interstitialNodes && interstitialNodes.length > 0) {
        initMicroModal(context);

        interstitialNodes.forEach((interstitialNode) => {
          const interstitialId = `interstitial-${interstitialNode.getAttribute('data-interstitial-message')}`;

          // If the interstitial hasn't been accepted before, display it.
          if (!getCookie(interstitialId)) {
            const submitBtn = document.querySelector(`#${interstitialId} .submit`);
            const closeBtn = document.querySelector(`#${interstitialId} .close`);

            // If submitted, set a cookie and close modal.
            submitBtn.addEventListener('click', (submitEvent) => {
              submitEvent.preventDefault();
              MicroModal.close(interstitialId);
              setCookie(interstitialId, true, 365);
            });

            // If passed, take the user back a page.
            closeBtn.addEventListener('click', (closeEvent) => {
              closeEvent.preventDefault();
              window.history.back();
            });

            // Enable the button if all the checkboxes are checked.
            handleModalForm(interstitialId);

            // Show modal.
            MicroModal.show(interstitialId, {
              disableScroll: true,
            });
          }
        });
      }
    });
  },
};
