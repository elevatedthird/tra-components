import { MediaQuery } from 'foundation-sites/js/foundation.util.mediaQuery';

Drupal.behaviors.ariesHeroAutoHeight = {
  attach(context) {
    const heros = once('aries_hero', '.organism--hero:has(.height_auto)', context);
    MediaQuery._init();
    heros.forEach((hero) => {
      const media = hero.querySelector('.organism--hero--grid--media');
      const contentWrapper = hero.querySelector('.organism--hero--content-wrapper');
      // get .content-wrapper.
      const contentOuterWrapper = hero.querySelector('.content-wrapper .text-bg-color');
      // get organism--hero--grid
      const grid = hero.querySelector('.organism--hero--grid');

      if (media && contentWrapper && grid && contentOuterWrapper) {
        const updateHeightClass = () => {
          // if (MediaQuery.is('medium down')) {
          //   grid.style.height = '';
          //   return;
          // }
          // remove grid inline height
          grid.style.height = '';
          contentOuterWrapper.style.height = '';
          contentOuterWrapper.style.paddingBottom = '';

          const scrollHeight = contentWrapper.scrollHeight;
          const contentWrapperIsOverflowing = scrollHeight > contentWrapper.clientHeight;
          if (contentWrapperIsOverflowing) {
            // set the grid height to scrollHeight
            if (MediaQuery.is('medium down')) {
              // increase height until the contentWrapper is not overflowing
              let height = 0;
              while (contentWrapper.scrollHeight > contentWrapper.clientHeight) {
                height += 1;
                // grid.style.height = `calc(${scrollHeight}px + ${height}rem)`;
                contentOuterWrapper.style.height = `${height}px`;
              }
              // remove bottom padding contentOuterWrapper
              contentOuterWrapper.style.paddingBottom = '0';
            } else {
              grid.style.height = `calc(${scrollHeight}px + 10rem)`;
            }
          }
        };

        // Initial check in case of pre-existing sizes
        updateHeightClass();

        // Set up the observer for window resizing
        window.addEventListener('resize', updateHeightClass);
      }
    });
  },
};
