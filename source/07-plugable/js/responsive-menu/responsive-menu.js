/**
 * header.js
 * Header functionality.
 */
import { ResponsiveMenu } from 'foundation-sites/js/foundation.responsiveMenu';
import { MediaQuery } from 'foundation-sites/js/foundation.util.mediaQuery';
import once from '@drupal/once';

Drupal.behaviors.ariesResponsiveMenu = {
  attach(context) {
    const elements = $(once('responsive-menu', '[data-responsive-menu]', context));
    MediaQuery._init();
    elements
      .each((index, el) => {
        // eslint-disable-next-line no-unused-vars
        const responsiveMenu = new ResponsiveMenu(el);

        $(el).on('show.zf.dropdownMenu', () => {
          document.body.classList.add('dropdown-menu-active');
        });

        $(el).on('hide.zf.dropdownMenu', () => {
          document.body.classList.remove('dropdown-menu-active');
        });

        $(el).removeAttr('aria-multiselectable');
        // set correct role
        $(el).find('a').removeAttr('role');
        const width = window.innerWidth || document.documentElement.clientWidth
          || document.body.clientWidth;
        if (width > 767 && $(el).hasClass('accordion-menu')) {
          $(el).find('ul').removeAttr('aria-hidden').attr('role', 'menubar');
        }

        $(el).find('> li > a').filter(function () {
          return $(this).siblings('ul').length > 0;
        }).on('click', (e) => {
          if (MediaQuery.is('medium down')) {
            // prevent default
            e.preventDefault();
          }
        });

        this.handleHrefs($(el));
        // on window resize
        $(window).on('resize', () => {
          this.handleHrefs($(el));
        });
      });

    // use the Foundation Media library to detect screen size changes
  },
  handleHrefs(el) {
    $(el).find('li.is-accordion-submenu-parent > a, li.is-dropdown-submenu-parent > a').each((index, el) => {
      // get the href
      const href = $(el).attr('href');
      // store href in data attribute
      // if data-href is empty then set it to href
      if (!$(el).attr('data-href')) {
        $(el).attr('data-href', href);
      }

      if (MediaQuery.is('medium down')) {
        // change href to #
        $(el).attr('href', '#');
      } else {
        // change href to data-href
        $(el).attr('href', $(el).attr('data-href'));
      }
    });
  }
};
