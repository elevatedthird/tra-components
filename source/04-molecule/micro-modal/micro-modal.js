/**
 * @file modal.js
 *
 * Trigger modal open
 */

import MicroModal from 'micromodal';

Drupal.behaviors.ariesMicrodal = {
  attach(context) {
    // Initiate
    const modalTriggers = (context.classList && context.classList.contains('modal-trigger')) ? context : context.querySelectorAll('.modal-trigger');
    const modals = context.classList && context.classList.contains('modal')
      ? [context] : context.querySelectorAll('.modal');
    if (!modalTriggers || modalTriggers.length < 0) { return; }

    let lastActiveElement;

    // Move modal content to end of layout container for better z-index control
    modals.forEach((modal) => {
      const layoutContainer = document.querySelector('.layout-container');
      if (context.querySelectorAll('.plan-explorer-container').length === 0) {
        layoutContainer.append(modal);
      }

      // If there are any modal triggers on the page, init.
      MicroModal.init({
        onShow: () => {
          lastActiveElement = document.activeElement;
          const modalVideo = modal.querySelector('.field--name-field-media-oembed-video');
          if (modalVideo) {
            const videoIframe = modalVideo.querySelector('iframe');
            videoIframe.setAttribute('src', videoIframe.src += '&autoplay=1');
          }

          const modalVideoJS = modal.querySelector('.bf-videojs-container');
          if (modalVideoJS) {
            const video = modalVideoJS.querySelector('.video-js');
            video.player.pause();
          }
          document.querySelector('body', context).classList.add('modal-open');

          // Move focus to the first focusable element within the modal
          const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          const firstFocusableElement = focusableElements.length > 0 ? focusableElements[0] : null;
          if (firstFocusableElement) {
            // wrap in setTimeout to prevent focus from being lost
            setTimeout(() => {
              firstFocusableElement.focus();
            }, 100);
          }
        },
        onClose: () => {
          const modalVideo = modal.querySelector('.field--name-field-media-oembed-video, .field--name-field-media-qumu');
          if (modalVideo) {
            const videoIframe = modalVideo.querySelector('iframe');
            videoIframe.contentWindow.location.reload();
          }

          const modalVideoJS = modal.querySelector('.bf-videojs-container');
          if (modalVideoJS) {
            const video = modalVideoJS.querySelector('.video-js');
            video.player.pause();
          }
          document.querySelector('body', context).classList.remove('modal-open');

          // Restore focus to the last active element
          if (lastActiveElement) {
            lastActiveElement.focus();
          }
        },
      });
    });
  },
};
