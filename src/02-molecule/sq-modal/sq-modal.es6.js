// @todo this js for the most part should be specific to this site and not part of the component.
(function ($, Drupal, once) {
  Drupal.behaviors.modalAlert = {
    attach: function (context, settings) {
      once('modalAlert', '.molecule--sq-modal--trigger a', context).forEach(function (element) {
        $(element).click(function () {
          var modalId = $(this).attr('data-open');
          var video = $('#' + modalId).find('.bf-videojs-container video');
          if (video.length) {
            video[0].pause();
          }
        });
      });

      // Function to pause and reset brandfolder Video and remote iframes
      function pauseAndResetVideo(modal) {
        var video = modal.find('.bf-videojs-container video');
        if (video.length) {
          video[0].pause();
          var iframe = modal.find('iframe');
          if (iframe.length) {
            iframe.each(function () {
              var src = $(this).attr('src');
              if (src) {
                $(this).attr('src', src);
              }
            });
          }
        }
      }

      // Function to reload the form
      function reloadForm() {
        var formWrapper = $('#webform-submission-email-selected-form-wizard-items-block-content-16731-form-ajax');
        if (formWrapper.length) {
          $.ajax({
            url: formWrapper.data('ajax-url'),
            type: 'GET',
            success: function (response) {
              var newForm = $(response).find('#webform-submission-email-selected-form-wizard-items-block-content-16731-form-ajax').html();
              Drupal.detachBehaviors(formWrapper.get(0), Drupal.settings);
              formWrapper.html(newForm);
              Drupal.attachBehaviors(formWrapper.get(0), Drupal.settings);
            },
            error: function() {
              console.error('Form reload failed');
            }
          });
        }
      }

      $(document).on('click', '.close-button, .okay-button', function (event) {
        var modal = $(this).closest('.reveal');
        pauseAndResetVideo(modal);

        var formSelectors = [
          '#webform-submission-email-selected-form-wizard-items-block-content-16731-form-ajax',
          '#webform-submission-email-selected-form-wizard-items-block-content-18316-form-ajax'
        ];

        formSelectors.forEach(function (selector) {
          if (modal.find(selector).length) {
            event.preventDefault();
            event.stopPropagation();
            Drupal.detachBehaviors(modal.get(0), Drupal.settings);
            location.reload();
          }
        });
      });

      $(document).on('closed.zf.reveal', function (event) {
        var modal = $(event.target);
        pauseAndResetVideo(modal);
        reloadForm();
      });

      const elements = once('reveal-init-once', '.reveal[data-reveal]', context);
      elements.forEach(function (element) {
        $(element).on('open.zf.reveal', function (event) {
          var modal = $(event.target);
          Drupal.attachBehaviors(modal.get(0), Drupal.settings);
        });
      });
    }
  };
})(jQuery, Drupal, once);
