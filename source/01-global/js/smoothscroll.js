/**
 * @file
 * Smooth scrolling.
 */

import smoothscroll from 'smoothscroll-polyfill';

Drupal.behaviors.themekitSmoothScroll = {
  attach(context) {
    const links = context.querySelectorAll('a[href^="#"]');
    const header = document.querySelector('header');
    const locationHash = window.location.hash;
    const distanceToTop = (el) => Math.floor(el.getBoundingClientRect().top);
    smoothscroll.polyfill();

    function calcOffsetAmount() {
      // Calculate the offset amount based header / secondary nav.
      let offsetAmount = header ? header.offsetHeight : 0;
      if (document.querySelector('.secondary-nav')) {
        const secondaryNav = document.querySelector('.secondary-nav');
        offsetAmount = secondaryNav.offsetHeight;
        const messages = header.querySelector('.region-messages');
        if (messages) {
          offsetAmount = secondaryNav.offsetHeight + messages.offsetHeight;
        }
      }
      return offsetAmount;
    }

    function clickHandler(e, respond = null) {
      const href = this.getAttribute('href');
      // Skip smooth scroll on tab items
      if (!href.startsWith('#tab--') && !href.startsWith('#acc--') && href !== '#') {
        e.preventDefault();
        const targetID = (respond) ? respond.getAttribute('href') : this.getAttribute('href');
        const targetAnchor = document.querySelector(targetID);
        if (!targetAnchor) return;
        const originalTop = distanceToTop(targetAnchor);
        const offsetAmount = calcOffsetAmount();

        window.scrollBy({ top: originalTop - offsetAmount, left: 0, behavior: 'smooth' });
        const checkIfDone = setInterval(() => {
          // check if the element has reached the top.
          const reachedTop = distanceToTop(targetAnchor) < 200;
          const atBottom = window.innerHeight + window.pageYOffset
            >= document.body.offsetHeight - 2;
          if (reachedTop || atBottom) {
            targetAnchor.tabIndex = '-1';
            targetAnchor.focus();
            clearInterval(checkIfDone);
          }
        }, 100);
      }
    }

    function windowLoadHandler() {
      if (!locationHash) return;

      const targetAnchor = document.querySelector(locationHash);
      if (!targetAnchor) return;

      const originalTop = distanceToTop(targetAnchor);
      const offsetAmount = calcOffsetAmount();
      window.scrollBy({ top: originalTop - offsetAmount });
    }

    links.forEach((link) => {
      link.addEventListener('click', clickHandler);
    });

    if (window.location.hash) {
      window.addEventListener('load', windowLoadHandler);
    }
  },
};
