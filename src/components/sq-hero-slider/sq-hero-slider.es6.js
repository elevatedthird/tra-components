/**
 * @file hero-carousel.js
 *
 * Add carousel functionality using Glide.js to Hero Carousel component.
 */
import { MediaQuery } from 'foundation-sites/js/foundation.util.mediaQuery';
/**
 * @file hero-carousel.js
 *
 * Add carousel functionality using Glide.js to Hero Carousel component.
 */
(function ($, Drupal, once) {
  Drupal.behaviors.sqHeroSlider = {
    options: {
      type: 'slider',
      perView: 1,
      gap: 0,
      rewind: true,
      dragThreshold: false,
      animationDuration: 1100,
      autoplay: drupalSettings?.aries?.hero_slider_interval ?? 7000,
    },
    init(glide, element) {
      MediaQuery._init();
      const heroSlider = element;
      glide.mount();
      glide.on('build.after', function () {
        glideHandleHeight();
        updateBackgroundColor();
      });


      const toggleButton = heroSlider.querySelector('.play-pause-icon');
      let isPlaying = true;
      toggleButton.addEventListener('click', () => {
        if (isPlaying) {
          glide.pause();
          glide.disable();
          toggleButton.classList.add('paused');
          toggleButton.classList.remove('playing');
          // set toggleButton aria label to say "pause slides"
          toggleButton.setAttribute('aria-label', 'pause slides');
        } else {
          glide.play();
          glide.enable();
          toggleButton.classList.add('playing');
          toggleButton.classList.remove('paused');
          // set toggleButton aria label to say "play slides"
          toggleButton.setAttribute('aria-label', 'play slides');
        }
        isPlaying = !isPlaying;
      });

      glide.on('run', () => {
        const live = heroSlider.querySelector('.liveregion');
        const glideIndex = glide.index;
        // if live div exists, update it with the current slide number
        if (live) {
          live.textContent = `Item ${glideIndex + 1}`;
        }
      });

      glide.on('run.before', (event) => {
        // get this slide and add pending class
        const slides = heroSlider.querySelectorAll('.glide__slide');

        const currentSlide = slides[glide.index];

        if (currentSlide) {
          currentSlide.classList.add('slide-transitioning');
        }
        let nextIndex = Number(event.steps);
        // event.direction is not '=' then get glide.index and add or remove one based on direction '<' or '>'.
        if (event.direction !== '=') {
          nextIndex = event.direction === '<' ? glide.index - 1 : glide.index + 1;
        }

        if (nextIndex > slides.length - 1) {
          nextIndex = 0;
        }

        if (nextIndex < 0) {
          nextIndex = slides.length - 1;
        }

        slides.forEach((slide, index) => {
          slide.classList.remove('pending');
          if (index === nextIndex) {
            slide.classList.add('pending');
          }
        });
      });

      glide.on('run.after', () => {
        // remove the pending class from all slides
        const slides = heroSlider.querySelectorAll('.glide__slide');
        slides.forEach((slide) => {
          slide.classList.remove('pending', 'slide-transitioning');
        });
        glideHandleHeight();
        updateBackgroundColor();
      });

      glide.on('resize', () => {
        // clear the heights altered in the glideHandleHeight function
        const glideTrack = heroSlider.querySelector('.glide__track');
        if (glideTrack) {
          glideTrack.style.height = '';
          // set the height of this to auto .organism--hero--grid
          const heroGrid = heroSlider.querySelectorAll('.molecule--sq-hero-slide--grid');
          heroGrid.forEach((grid) => {
            grid.style.height = '';
          });
        }
      });

      glide.mount();
      // Resize height
      function glideHandleHeight() {
        // must get the biggest slide height and set the height of the glide track to that height
        const slides = heroSlider.querySelectorAll('.glide__slide');
        const glideTrack = heroSlider.querySelector('.glide__track');
        // if (MediaQuery.atLeast('mobile_menu')) {
        let maxHeight = 0;
        slides.forEach((slide) => {
          const slideHeight = slide.offsetHeight;
          if (slideHeight > maxHeight) {
            maxHeight = slideHeight;
          }
        });
        // set the height of the glide track to the max height

        if (glideTrack) {
          glideTrack.style.height = `${maxHeight}px`;
          // set the height of this to the max height .organism--hero--grid
          const heroGrid = heroSlider.querySelectorAll('.molecule--sq-hero-slide--grid');
          heroGrid.forEach((grid) => {
            grid.style.height = `${maxHeight}px`;
          });
        }
        // }
      }

      function updateBackgroundColor() {
        // get the active slide .glide__slide--active
        const activeSlide = heroSlider.querySelector('.glide__slide--active');
        if (activeSlide) {
          // find the nested element with attr data-bg-color
          const bgColorElement = activeSlide.querySelector('[data-bg-color]');
          if (bgColorElement) {
            const bgColor = bgColorElement.getAttribute('data-bg-color');
            // get closest .glide
            const glideElement = heroSlider;
            // find .glide__arrows and add the bgColor as a class
            const arrows = glideElement.querySelector('.glide__arrows');
            if (arrows) {
              arrows.className = `glide__arrows ${bgColor}`;
              arrows.classList = `glide__arrows ${bgColor}`;
            }
          }
        }
      }
    },
  };
})(jQuery, Drupal, once);
