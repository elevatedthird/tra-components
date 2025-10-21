import { Accordion } from 'foundation-sites/js/foundation.accordion';


Drupal.behaviors.ariesdisclaimer= {
  attach(context) {
    // @todo should probably only target disclaimer accordions.
    once('ariesdisclaimer', context.querySelectorAll('.accordion')).forEach((accordion) => {
      const accordionEl = new Accordion($(accordion), { multiExpand: true });

      if ($(accordion).closest('.disclaimer-expand-1').length > 0) {
        const firstContent = $(accordion).find('.accordion-content').first();
        if (firstContent.length > 0) {
          accordionEl.toggle(firstContent);
        }
      }

      const isMobileDevice = () => window.innerWidth <= 480;

      if (isMobileDevice()) {
        const handleScroll = () => {
          document.querySelectorAll('.accordion').forEach(accordion => {
            const rect = accordion.getBoundingClientRect();
            const content = accordion.querySelector('.molecule--accordion-item');
            if (content) {
              const isActive = content.classList.contains('is-active');
              const accordionHeader = content.closest('.molecule--accordion-item').querySelector('.molecule--accordion-item--header');
              const accordionsContent = content.closest('.molecule--accordion-item').querySelector('.accordion-content');

              if (isActive) {
                if (rect.top <= 0 && rect.bottom > 100) {
                  accordionHeader.classList.add('is-sticky');
                } else {
                  accordionHeader.classList.remove('is-sticky');
                  accordionsContent.style.paddingTop = '0px';
                }
              } else {
                accordionHeader.classList.remove('is-sticky');
                accordionsContent.style.paddingTop = '0px';
              }
            }
          });
        };

        document.addEventListener('scroll', handleScroll);

        accordion.querySelectorAll('.accordion-content').forEach(content => {
          content.addEventListener('scroll', function() {
            if (content.scrollTop + content.clientHeight >= content.scrollHeight - 70) {
              const accordionHeader = content.closest('.molecule--accordion-item').querySelector('.molecule--accordion-item--header');
              accordionHeader.classList.remove('is-sticky');
              content.style.paddingTop = '0px';

              const nextSection = accordionHeader.nextElementSibling;
              if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          });
        });

        $(accordion).on('toggle.zf.accordion', function(event, target) {
          const accordionHeader = $(target).closest('.molecule--accordion-item').find('.molecule--accordion-item--header');
          if (!$(target).hasClass('is-active')) {
            accordionHeader.removeClass('is-sticky');
            content.style.paddingTop = '0px';
          }
        });
      }
    });
  },
};
