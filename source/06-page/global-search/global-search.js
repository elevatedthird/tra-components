import once from "@drupal/once";

Drupal.behaviors.ariesMoveViewsControls = {
  attach() {
    const elements = $(once('ariesMoveViewsControls', '.view-display-id-page_1 .view-controls', document));

    elements
      .each((index, el) => {
        const controls = $(el);
        // take the inner html of the controls;
        const controlsHeader = $(controls).find('.view-header');
        let controlsInputs = $(controls).find('form');
        controlsInputs = controlsInputs.html();

        // find dom with id of filterModal
        const filterModal = $('#filterModal');
        const viewControlBucket = filterModal.find('.view-controls');

        //need to prevent emptying and recreating the view controls if it's already been processed
        //this behavior runs after ajax, but the other behavior doesn't for some reason?
        //or at least doesn't re-attach the event listeners
        if($(viewControlBucket).hasClass('view-controls-processed')){
          //but we still need the new ids
          const submitButton = $(viewControlBucket).find('.search-button.form-submit');
          const bottomSubmitButton = $(filterModal).find('.bottom-submit-wrapper .search-button.form-submit');
          const searchIcon = $(viewControlBucket).find('.search-icon-button');

          const newSubmitButton = $(controlsInputs).find('.search-button.form-submit');
          $(searchIcon).attr('id', $(newSubmitButton).attr('id'));
          $(submitButton).attr('id', $(newSubmitButton).attr('id'));
          $(bottomSubmitButton).attr('id', $(newSubmitButton).attr('id'));


          //and the new search results counter
          $(viewControlBucket).find('.results-count').html($(controlsHeader).find('.results-count').html() ?? '');

          //and also the reset button
          const resetButton = $(controlsInputs).find('.reset-button');
          $(viewControlBucket).find('.reset-button').attr('id', $(resetButton).attr('id'));
          return;
        }

        //the following only gets run on the first load
        $(viewControlBucket).addClass('view-controls-processed');
        $(viewControlBucket).addClass('theme--vibrant color-vibrant-white');
        // remove the inner html from viewControlBucket.
        viewControlBucket.empty();
        // append the controls to the viewControlBucket
        viewControlBucket.prepend(controlsInputs);
        viewControlBucket.prepend(controlsHeader);
        //copy the ids
        const submitButton = $(viewControlBucket).find('.search-button.form-submit');
        const searchIcon = $(viewControlBucket).find('.search-icon-button');
        $(searchIcon).attr('id', $(submitButton).attr('id'));

        //create the "Filters" header and add the reset button
        const resetButton = $(controlsInputs).find('.reset-button');
        $(viewControlBucket).parent().find('.facet-container').append('<div class="facets-filters-label">Filters</div>')


        $(viewControlBucket).parent().append(resetButton);

        // search input has value or if the url has a query string, then show the reset button.

        // $(resetButton).text("Clear all filters!");

        //for wave, change the id and for attributes of the search input and label
        //id and label don't really matter afterward so this only needs to be done once?
        const searchInput = $(viewControlBucket).find('.form-text');
        const searchLabel = $(searchInput).prev();
        searchInput.attr('id', searchInput.attr('id') + '-facade');
        searchLabel.attr('for', searchLabel.attr('for') + '-facade');

        // const searchInput = $(viewControlBucket).find('.form-text');
        // const searchInputValue = $(searchInput).val();
        // const url = new URL(window.location.href);
        // // are there any query parameters
        // const hasSearchParam = url.searchParams.size > 0;
        // if (hasSearchParam) {
        //   $(resetButton).show();
        // } else {
        //   $(resetButton).hide();
        // }


        //duplicate submit button at the bottom, to be shown if viewport exceeds a certain height?
        const bottomSubmitButton = $(submitButton).clone();
        const bottomSubmitWrapper = document.createElement('div');
        bottomSubmitWrapper.classList = 'theme--vibrant color-vibrant-white bottom-submit-wrapper';
        $(bottomSubmitWrapper).append(bottomSubmitButton);
        $(bottomSubmitButton).find('span').text('Apply Filters');
        $(viewControlBucket).parent().find('.facet-container').append(bottomSubmitWrapper);

        //empty element on global search page
        $(viewControlBucket).parent().find('.form-filters').remove();

        //need to hide the submit button if the filters element exceeds the screen height
        //doesn't currently listen for screen height changes - if we need to handle that too, can probably add another observer?
        const heightObserver = new MutationObserver((mutations, observer) => {
          const filterHeight = $(viewControlBucket).parent().find('.facet-container')[0].offsetHeight;
          const screenHeight = $(window).height();
          filterHeight < screenHeight ? $(bottomSubmitWrapper).hide() : $(bottomSubmitWrapper).show();
        });
        heightObserver.observe($(viewControlBucket).parent()[0], {attributes: true, attributeFilter: ['style'], childList: true, subtree: true});
      });
  },
};

Drupal.behaviors.ariesFacetCheckboxesDisable = {
  attach(context) {
    $(context)
      .find('.organism--facet-checkbox')
      .each((index, el) => {
        // if this item has a element with [data-drupal-facet-alias="type"].
        const typeFacet = $(el).find('[data-drupal-facet-alias="type"]');
        if (typeFacet.length > 0) {
          // check if any of the checkboxes are checked.
          const checked = $(typeFacet).find('input:checked');
          if (checked.length > 0) {
            // if so, disable the other checkboxes.
            $(typeFacet).find('input:not(:checked)').attr('disabled', true);
            // find sibling label and set the innerText of the facet-item__count to (0).
            $(typeFacet).find('input:not(:checked)').siblings('label').find('.facet-item__count').text('(0)');
            // also find the closest accordion and open it.
            // facet-checkbox.js should handle this?
            // Drupal.behaviors.ariesHandleArticleTypeMove.handleAccordion();
          }
        }
      });
  },
};

// on mobile, prevent checkboxes from applying immediately
// Drupal.behaviors.ariesFacetCheckboxesMobile = {
//   attach(context) {
//     $(context)
//       .find('.organism--facet-checkbox li.facet-item input')
//       .each((index, el) => {
//         $(el).on('click', (event) => {
//           event.stopImmediatePropagation();
//           event.preventDefault();
//           setTimeout(() => {
//             $(el).prop('checked', !($(el).prop('checked')));
//           }, 50);
//         });
//       });
//   },
// };

// create a new behavior for handling a combined facet filter
Drupal.behaviors.ariesHandleArticleTypeMove = {
  attach() {
    const that = this;
    $(document)
      .find('.page--global-search .sidebars--sidebar-left .facet-container')
      .each((index, el) => {
        const config = {
          childList: true,
        };
        // create a mutation observer to watch for changes to the DOM.
        const observer = new MutationObserver(function(mutationsList, observer) {
          for (const mutation of mutationsList) {

            if (mutation.type === 'childList') {
              that.handleMove();
            }
          }
        });

        that.handleMove();

        observer.observe(el, config);

        $(document).ajaxComplete(function(event, xhr, settings) {
          //can't seem to get this working reliably - seems like it does the same thing as the code in facet-checkbox.js, so using that instead?
          // that.handleAccordion();
        });
      });

  },
  handleMove() {
    const typeArticle = $(document).find('#type-article').closest('.facet-item');
    if (typeArticle.length) {
      // find #article-type-106
      const articleType106 = $(document).find('#article-type-106').closest('.facet-item');
      if (articleType106.length) {
        $(typeArticle).after(articleType106);
      }
    }
    Drupal.behaviors.ariesFacetCheckboxesDisable.attach(document);
  },
  handleAccordion() {
    const accordions = $(document).find('.accordion');
    if (accordions.length) {
      // if there are any checkboxes checked, open the accordion.
      const checked = $(accordions).find('input:checked');
      if (checked.length) {
        checked.each((i, el) => {
          const accordion = $(el).closest('.accordion');
          const trigger = $(accordion).find('.organism--facet-checkbox--header');
          if (trigger.length && trigger.attr('aria-expanded') === 'false') {
            $(trigger).click();
          }
        });
      }
    }
  }
}
