/**
 * @file hero-carousel.js
 *
 * Add carousel functionality using Glide.js to Hero Carousel component.
 */

import Glide from '@glidejs/glide';

Drupal.behaviors.ariesTabSlider = {
  attach(context) {
    const tabSliders = context.querySelectorAll('.paragraph--type--tab-teaser-slider');
    if (!tabSliders || tabSliders.length === 0) return;
    once('aries_tab_slider', tabSliders).forEach((tabSlider) => {
      // See docs at https://glidejs.com/docs/options
      const glide = new Glide(tabSlider, {
        type: 'slider',
        perView: 3,
        gap: 24,
        peek: {
          before: 0,
          after: 120,
        },
        breakpoints: {
          9999: {
            perView: 3,
          },
          1440: {
            perView: 2,
          },
          959: {
            perView: 1,
            peek: {
              before: 0,
              after: 40,
            },
          },
          600: {
            perView: 1,
            gap: 24,
            peek: {
              before: 0,
              after: 40,
            },
          },
        },
        rewind: false,
        dragThreshold: false,
        animationDuration: 300,
      }).mount();

      glide.on('run', () => {
        const live = tabSlider.querySelector('.liveregion');
        const glideIndex = glide.index;
        // if live div exists, update it with the current slide number
        if (live) {
          live.textContent = `Item ${glideIndex + 1}`;
        }

        const slideCount = tabSlider.querySelectorAll('.glide__slide').length;
        // get breakpoint perView value
        // eslint-disable-next-line prefer-destructuring
        const perView = glide.settings.perView;

        // if the current slide is the last slide
        if (glideIndex + perView === slideCount) {
          // add the is-last-slide class
          tabSlider.classList.add('is-last-slide');
          tabSlider.classList.remove('is-first-slide');
        } else if (glideIndex === 0) {
          // if the current slide is the first slide
          // add the is-first-slide class
          tabSlider.classList.add('is-first-slide');
          tabSlider.classList.remove('is-last-slide');
        } else {
          // otherwise remove both classes
          tabSlider.classList.remove('is-first-slide');
          tabSlider.classList.remove('is-last-slide');
        }
      });

      // get the closest js-tab-panel
      const tabPanel = tabSlider.closest('.js-tab-panel');
      // use a mutation observer to detect when the tabPanel is visible
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'aria-hidden') {
            // when the tab panel is visible, update the glide
            if (mutation.target.getAttribute('aria-hidden') === 'false') {
              if (!tabPanel.hasAttribute('data-glide-initialized')) {
                glide.update();
              }
            }
          }
        });
      });
      // start observing the tab panel
      observer.observe(tabPanel, {
        attributes: true,
      });
    });
  },
};
