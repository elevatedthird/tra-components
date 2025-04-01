import once from "@drupal/once";
import NiceSelect2 from "nice-select2/dist/js/nice-select2";

Drupal.behaviors.ariesNiceSelect2 = {
  attach(context) {
    once('ariesNiceSelect2', context.querySelectorAll('form:not(.layout-builder-form):not([class*="layout-builder-"]) select, .fake-form select, form.webform-submission-form select, .view-controls select, .search-controls select')).forEach((select) => {
      const niceSelect = new NiceSelect2(select, {});
      // Scroll into view when dropdown opens.
      niceSelect.dropdown.addEventListener('transitionend', () => {
        if (niceSelect.dropdown.classList.contains('open')) {
          const focus = niceSelect.dropdown.querySelector('.focus');
          if (focus) {
            focus.scrollIntoView({ block: 'nearest' });
          }
        }
      });

      // Type-to-jump functionality.
      let typingBuffer = '';
      let typingTimeout;

      niceSelect.dropdown.addEventListener('keydown', (e) => {
        const options = Array.from(
          niceSelect.dropdown.querySelectorAll('.option')
        );

        if (e.key.length === 1) {
          // Append typed character to buffer.
          typingBuffer += e.key.toLowerCase();

          clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            typingBuffer = '';
          }, 500); // Reset buffer after 500ms of no typing.

          // Find the first option that starts with the buffer text.
          const matchedOption = options.find((option) =>
            option.textContent.trim().toLowerCase().startsWith(typingBuffer)
          );

          if (matchedOption) {
            // Remove focus from all options.
            options.forEach((opt) => opt.classList.remove('focus'));

            // Add focus to matched option.
            matchedOption.classList.add('focus');

            // Scroll the matched option into view.
            matchedOption.scrollIntoView({ block: 'nearest' });
          }
        }
      });

    });
  },
};
