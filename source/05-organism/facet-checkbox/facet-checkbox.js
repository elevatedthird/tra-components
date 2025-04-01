import once from "@drupal/once";

// jquery version
Drupal.behaviors.ariesFacetCheckbox = {
  attach(context) {
    const elements = $(once('facet-checkbox', '.organism--facet-checkbox', context));

    elements
      .each((index, el) => {

        //make sure anything with a checked input stays open
        if ($(el).find('input:checked').length > 0) {
          $(el).find('.organism--facet-checkbox--header:not(.is-active)').click();
        }
        //make sure the first element is always opened
        // @TODO hacky workaround
        if (index === 0) {
          const filterModal = $('#filterModal');
          const firstFilterGroup = $(filterModal).find('.view-filters .block-facet__wrapper:first');
          const firstHeader = $(firstFilterGroup.find('.organism--facet-checkbox--accordion-item:first'));
          if (!($(firstHeader).hasClass('is-active'))) {
            // @TODO very hacky/specific workaround for the content search page
            // 'Type' category gets loaded in after everything's run, so manually ignore the previous first category
            // if (!($(firstHeader).find('.organism--facet-checkbox--title').html().includes('Business Topic'))) {
            //   $(firstFilterGroup.find('.organism--facet-checkbox--accordion-item a')).click();
            // }
          }
        }
        //default props
        const limit = 8; //how many lis there can be before we start moving them into a "show more" section
        const numToShow = 5; //how many lis to show by default if over the limit

        //@TODO figure out where to put the prop for facets
        const organism = $(el).closest('.organism--view-sidebar-grid');
        const propLimit = $(organism).data('filter-limit');
        const propNumToShow = $(organism).data('filter-show-init');

        const localLimit = propLimit ?? limit;
        const localNumToShow = propNumToShow ?? numToShow;


        let listContainer = $(el).find('ul');
        let elements = $(listContainer).find('> li.facet-item');
        if (elements.length > localLimit) {
          const labelElement = $(el).find('.organism--facet-checkbox--title');
          const label = $(labelElement).text().trim();
          const encodedLabel = label.toLowerCase().replaceAll(' ', '');

          const closedLabel = `Show more`;
          const openedLabel = `Show less`

          const showMoreButton = document.createElement('button');
          showMoreButton.className = 'show-more';
          $(listContainer).parent().append(showMoreButton);

          const lisAfterLimit = $(listContainer).find(`> li.facet-item:gt(${localNumToShow - 1})`);

          //since ajax reruns this behavior every time a filter is changed, check the search param to decide whether the additional filters should be hidden or shown initially
          //@TODO currently facets completely reset the url parameters, so this doesn't currently work after ajax refreshes (it will always "show less" on every ajax call)
          //possibly apply this patch and disable that behavior: https://www.drupal.org/project/drupal/issues/2681953#comment-15014681
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
            $(listContainer).find(`> li.facet-item:gt(${localNumToShow - 1})`).toggle();
            if ($(event.target).text() === closedLabel) {
              //toggling hidden filters ON
              $(event.target).text(openedLabel);
              $(event.target).attr('value', openedLabel);
              toggleUrlQuery(encodedLabel, '1');
              //focus on the first previously-hidden element
              $(listContainer).find(`> li.facet-item:nth-child(${localNumToShow + 1}) input`).focus();
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
          })
        }
      });

    function toggleUrlQuery(param, value) {
      const url = new URL(window.location.href);
      url.searchParams.set(param, value);
      window.history.pushState(null, null, url); // or pushState
    }
  },
};


