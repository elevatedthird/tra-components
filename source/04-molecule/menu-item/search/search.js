import once from '@drupal/once';

// non jquery version
Drupal.behaviors.ariesMenuItemSearch = {
  attach(context) {
    once('menu-item--search', context.querySelector('.molecule--menu-item--search')).forEach((el) => {
      // do things!
      document.querySelector('#site-search').click(function() {
        document.querySelector('.site-search-div').classList.toggle('is-active');
      });
      document.querySelector('.site-search-bar__close').click(function() {
        document.querySelector('.site-search-div').classList.toggle('is-active');
      });
      document.querySelector('.site-search-bar-overlay').click(function () {
        document.querySelector('.site-search-div').classList.toggle('is-active');
      });
    });
  },
};

// jquery version
Drupal.behaviors.ariesMenuItemSearch = {
  attach(context) {
    const elements = $(once('menu-item--search', '.molecule--menu-item--search', context));
    // eslint-disable-next-line no-unused-vars
    elements.each((index, el) => {
      $('#site-search').click(function() {
        $('.site-search-div').toggleClass('is-active');
        if ($('.site-search-div').hasClass('is-active')) {
          // add aria-expanded to the clicked element
          $(this).attr('aria-expanded', 'true');
          $('.site-search-div').find('.form-text[type="text"]').focus();
        } else {
          $(this).attr('aria-expanded', 'false');
        }
      });
    });

    const menuItemSearch = $(once('menu-item--search', '.atom--form--exposed-filters, .form-item-keyword', document));
    menuItemSearch
      .each((index, el) => {
        $(el).find('.site-search-bar__close').click(function() {
          $('.site-search-div').removeClass('is-active');
          // get closest .molecule--menu-item--search and remove aria-expanded from #site-search
          $(this).closest('.molecule--menu-item--search').find('#site-search').attr('aria-expanded', 'false');
          $(this).prev().val('');
          // For search page.
          const actualForm = document.querySelector('#block-aries-content .view-id-acquia_search.view-display-id-page_aries form.views-exposed-form');
          if (actualForm) {
            const actualSearchInput = actualForm.querySelector('input.form-text');
            actualSearchInput.value = '';
          } else {
            // For all other pages.
            const submit = $(this).closest('.atom--form--exposed-filters').find('.search-button[type="submit"]');
            if (submit.length) {
              $(submit).trigger('click');
            }
          }
        });
      });
    $(context)
      .find('.site-search-bar-overlay').click(function () {
        $('.site-search-div').removeClass('is-active');
        const menuItem = $('.site-search-div').closest('.molecule--menu-item--search').find('#site-search');
        if (menuItem.length > 0 && menuItem.attr('aria-expanded') === 'true') {
          menuItem.attr('aria-expanded', 'false');
        }
      });
  },
};
