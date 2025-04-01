Drupal.behaviors.ariesMoveArticleTypeFilter = {
  attach(context) {

    once('ariesSidebarFilters', context.querySelectorAll('.organism--view-sidebar-grid .form-filters .details-wrapper .form-wrapper')).forEach((el) => {
      //default props
      const limit = 8; //how many lis there can be before we start moving them into a "show more" section
      const numToShow = 5; //how many lis to show by default if over the limit

      const organism = $(el).closest('.organism--view-sidebar-grid');
      const propLimit = $(organism).data('filter-limit');
      const propNumToShow = $(organism).data('filter-show-init');

      const localLimit = propLimit ?? limit;
      const localNumToShow = propNumToShow ?? numToShow;


      let listContainer = $(el).find('.form-checkboxes .form-checkboxes ul').length ? $(el).find('.form-checkboxes .form-checkboxes ul') :
        $(el).find('.form-checkboxes .form-checkboxes').length ? $(el).find('.form-checkboxes .form-checkboxes') :
          $(el).find('.form-radios .form-radios');
      let elements = $(listContainer).find('> li, > .js-form-item');
      if (elements.length > localLimit) {
        const labelElement = $(el).find('summary');
        const label = $(labelElement).text();
        if(!label) return;
        const encodedLabel = label.toLowerCase();

        //@TODO might need a pluralization library if we want to match what's on the figma exactly
        //or manually set it on the view somehow?
        const closedLabel = `Show more`;
        const openedLabel = `Show less`

        const showMoreButton = document.createElement('button');
        showMoreButton.className = 'show-more';
        $(listContainer).parent().append(showMoreButton);

        //sort before doing initial hide
        const listItems = $(listContainer).find('> li, > .js-form-item').get();
        listItems.sort(function (a, b) {
          const aChecked = $(a).find('input').prop('checked');
          const bChecked = $(b).find('input').prop('checked');
          return aChecked && !bChecked ? -1 : bChecked && !aChecked ? 1 : 0;
        });
        $.each(listItems, function (idx, element) {
          listContainer.append(element);
        });

        const lisAfterLimit = $(listContainer).find(`> li:gt(${localNumToShow - 1}), > .js-form-item:gt(${localNumToShow - 1})`);

        //since ajax reruns this behavior every time a filter is changed, check the search param to decide whether the filters should be hidden or shown initially
        let searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has(encodedLabel) && searchParams.get(encodedLabel) == '1') {
          //means it should stay open
          showMoreButton.textContent = openedLabel;
          showMoreButton.value = openedLabel;
          $(showMoreButton).attr("aria-expanded", "true");
        } else {
          showMoreButton.textContent = closedLabel;
          showMoreButton.value = closedLabel;
          $(showMoreButton).attr("aria-expanded", "false");
          $(lisAfterLimit).hide();
        }


        $(showMoreButton).click((event) => {
          event.preventDefault();
          //@TODO possibly change this to skip ALL elements that are checked instead of just the first localNumToShow elements?
          $(listContainer).find(`> li:gt(${localNumToShow - 1}), > .js-form-item:gt(${localNumToShow - 1})`).toggle();
          if ($(event.target).text() === closedLabel) {
            //toggling hidden filters ON
            $(event.target).text(openedLabel);
            $(event.target).attr('value', openedLabel);
            toggleUrlQuery(encodedLabel, '1');
            //focus on the first previously-hidden element
            $(listContainer).find(`> li:nth-child(${localNumToShow + 1}) input, > .js-form-item:nth-child(${localNumToShow + 1}) input`).focus();
            $(showMoreButton).attr("aria-expanded", "true");
          } else {
            //toggling hidden filters OFF
            toggleUrlQuery(encodedLabel, '0');
            $(event.target).text(closedLabel);
            $(event.target).attr('value', closedLabel)
            $(labelElement)[0].scrollIntoView();
            $(showMoreButton).attr("aria-expanded", "false");
            //we probably want the focus to stay on the 'Show More' button in this case?
          }
        });
        // function toggleUrlQuery(param, value) {
        //   const url = new URL(window.location.href);
        //   url.searchParams.set(param, value);
        //   window.history.pushState(null, null, url); // or pushState
        // }
      }
    });


    // const articleTypeFilterWrapper = context.querySelector('[id*="edit-article-type-collapsible"]');
    // const TypeFilterWrapper = context.querySelector('[id*="edit-type-collapsible"]');
    // if (!articleTypeFilterWrapper && !TypeFilterWrapper) {
    //   return;
    // }
    // // use the once method to ensure this behavior is only attached once
    // $(articleTypeFilterWrapper).once('ariesMoveArticleTypeFilter').each((i, wrapper) => {
    //   // move the article type filters .form-item inside the .bef-checkboxes of TypeFilterWrapper.
    //   let articleTypeFilter = wrapper.querySelectorAll('.form-item');
    //   // add the article type filters to TypeFilterWrapper.querySelector('.bef-checkboxes') but at the second position.
    //   const typeFilter = TypeFilterWrapper.querySelector('.bef-checkboxes');
    //   // reverse articleTypeFilter order to match the order of the article type filter in the sidebar.
    //   articleTypeFilter = [].slice.call(articleTypeFilter, 0).reverse()
    //   articleTypeFilter.forEach((element) => {
    //     typeFilter.insertBefore(element, typeFilter.children[2]);
    //   });
    // });
  },
};

// add a new behavior called ariesClearFiltersHandler
Drupal.behaviors.ariesClearFiltersHandler = {
  attach(context) {

    // use the once method to ensure this behavior is only attached once
    once('ariesClearFiltersHandler', context.querySelectorAll('.reset-button-exposed')).forEach((wrapper) => {
      // on click, find the closest form and uncheck all the checkboxes and radios.
      $(wrapper).click((event) => {
        // prevent the default behavior of the button.
        event.preventDefault();
        // find the closest form.
        const filterModal = $(event.target).closest('#filterModal');
        if (!filterModal) {
          return;
        }
        // uncheck all the checkboxes and radios.
        $(filterModal).find('input[type="checkbox"], input[type="radio"]').prop('checked', false);
        // submit the form.
        // find submit-button-exposed and click it.
        const submitButton = $(filterModal).find('.submit-button-exposed');

        if (submitButton) {
          $(submitButton).click();
        }
      });
    });
  }
}

// add another behavior that checks for inputs with labels that contain "(0)" and set the input to disabled
Drupal.behaviors.ariesDisableEmptyFilters = {
  attach() {
    // use the once method to ensure this behavior is only attached once
    once('ariesDisableEmptyFilters', document.querySelectorAll('.item-list__checkbox.js-facets-widget, .js-form-type-checkbox')).forEach((wrapper) => {
      // on click, find the closest form and uncheck all the checkboxes and radios.
      const labels = $(wrapper).find('label');
      // loop through each label and check if it contains "(0)"
      labels.each((index, label) => {
        // if closest .js-facets-widget then find facet-item__count
        if ($(wrapper).hasClass('js-facets-widget')) {
          const count = $(label).find('.facet-item__count');
          if (count.length > 0 && count.text().includes('(0)')) {
            // find cooresponding input and set it to disabled
            const input = $(label).closest('.facet-item').find('input');
            $(input).prop('disabled', true);
          }
        }
        if ($(wrapper).hasClass('js-form-type-checkbox')) {
          if (label.innerHTML.includes('(0)')) {
            // find cooresponding input and set it to disabled
            const input = $(label).closest('.form-item').find('input');
            $(input).prop('disabled', true);
          }
        }
      });
    });
  }
}
