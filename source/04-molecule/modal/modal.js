(function ($, Drupal, once) {
  Drupal.behaviors.modalAlert = {
    attach: function (context, settings) {
      once('modalAlert', '.molecule--modal--trigger a', context).forEach(function (element) {
        $(element).click(function () {
          var modalId = $(this).attr('data-open');
          var video = $('#' + modalId).find('.bf-videojs-container video');
          if (video.length) {
            video[0].pause();
          }
        });
      });

      // Function to pause and reset brandfolder Video
      function pauseAndResetVideo(modal) {
        var video = modal.find('.bf-videojs-container video');
        if (video.length) {
          video[0].pause();
        }
      }

      // Function to reload the form
      function reloadForm() {
        var formWrapper = $('#webform-submission-email-selected-form-wizard-items-block-content-16731-form-ajax');
        if (formWrapper.length) {
          $.ajax({
            url: formWrapper.data('ajax-url'),
            type: 'GET',
            success: function(response) {
              formWrapper.html($(response).find('#webform-submission-email-selected-form-wizard-items-block-content-16731-form-ajax').html());
              Drupal.attachBehaviors(formWrapper[0], Drupal.settings);
            },
            error: function() {
              console.error('Form reload failed');
            }
          });
        }
      }

      once('modalCloseAlert', '.close-button, .okay-button', context).forEach(function (element) {
        $(element).click(function (event) {
          var modal = $(this).closest('.reveal');
          pauseAndResetVideo(modal);

          var formSelectors = [
            '#webform-submission-email-selected-form-wizard-items-block-content-16731-form-ajax',
            '#webform-submission-email-selected-form-wizard-items-block-content-18316-form-ajax'
          ];

          formSelectors.forEach(function (selector) {
            if ($(this).closest('#modal--form-explorer-app').find(selector).length) {
              event.preventDefault(); // Prevent default action
              event.stopPropagation();
              Drupal.detachBehaviors(modal[0], Drupal.settings);
              location.reload();
            }
          }.bind(this));
        });
      });

      once('modalCloseOutside', '.reveal', context).forEach(function (element) {
        $(element).on('closed.zf.reveal', function () {
          pauseAndResetVideo($(this));
          reloadForm();
        });
      });
    }
  };
})(jQuery, Drupal, once);
