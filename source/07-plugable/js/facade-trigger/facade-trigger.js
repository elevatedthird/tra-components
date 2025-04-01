/**
 * facade-trigger.js
 * Facade trigger functionality.
 * Finds any instances of links outside a form with the class 'bef-link'
 * and triggers a click on the real visually hidden input inside the form.
 * Also triggers the whole wrapper so pseudo elements can be triggered.
 */

import once from "@drupal/once";

Drupal.behaviors.ariesFacadeTrigger = {
  attach(context) {
    const facadeFormWrapper = document.querySelectorAll('.facade-form-wrapper');
    const facadeFormWrapperArray = [...facadeFormWrapper]; // converts NodeList to Array
    once('facet-checkbox', facadeFormWrapper).forEach((wrapper) => {
      if (wrapper.querySelector('a.bef-link')) {
        this.linkFacadeTrigger(wrapper);
      }
    });
    once('facet-inputs', facadeFormWrapper).forEach((wrapper) => {
      if (wrapper.querySelector('form input.facade-trigger, button.facade-trigger')) {
        this.inputFacadeTrigger(wrapper);
      }
    });
    this.removeDuplicateIds();
  },

  removeDuplicateIds() {
    // search for duplicate ids that arent in a form and change them
    const duplicateIds = document.querySelectorAll('[id]');
    const duplicateIdsArray = [...duplicateIds]; // converts NodeList to Array
    const duplicateIdsArrayFiltered = duplicateIdsArray.filter((element) => {
      return !element.closest('form');
    });
    const duplicateIdsArrayFilteredIds = duplicateIdsArrayFiltered.map((element) => {
      return element.getAttribute('id');
    });
    const duplicateIdsArrayFilteredIdsUnique = [...new Set(duplicateIdsArrayFilteredIds)];
    duplicateIdsArrayFilteredIdsUnique.forEach((id) => {
      if(!id.includes('edit-reset--')){
        const elements = document.querySelectorAll(`[id="${id}"]`);
        const elementsArray = [...elements];
        elementsArray.forEach((element, index) => {
          if (index > 0) {
            const newId = `${id}-${index}`;
            element.setAttribute('id', newId);
          }
        });
      }
    });
  },

  linkFacadeTrigger(wrapper) {
    const formLink = wrapper.querySelectorAll('form a.bef-link');
    const facadeLink = wrapper.querySelectorAll('a.bef-link:not(form a.bef-link)');
    facadeLink.forEach((element, index) => {
      element.addEventListener('click', (event) => {

        const financialCalendar = document.querySelector('.block--views-blockcalendar-item-financial-calendar');
        if (financialCalendar) {
          this.handleFinancialCalendarException(element, formLink[index]);
        } else {
          // need to change the formLink to have a unique id and the for attribute to match
          const id = element.getAttribute('id');
          $(formLink[index]).attr('id', `${id}-facade`);
          $(formLink[index]).attr('for', `${id}-facade`);
          // trigger click on the real link
          // $(formLink[0]).trigger('click');
          $(formLink[index]).click();
          return;
        }
        event.preventDefault();
      });
    });
  },

  inputFacadeTrigger(wrapper) {
    const formInput = wrapper.querySelectorAll('form input.facade-trigger, form button.facade-trigger');
    const facadeInputs = wrapper.querySelectorAll('input.facade-trigger:not(form > input.facade-trigger), button.facade-trigger:not(form > button.facade-trigger)');
    const actualForm = document.querySelector('[data-drupal-selector="views-exposed-form-content-search-page-1"]');
    facadeInputs.forEach((element, index) => {
      element.addEventListener('click', (event) => {
        let parent = element.closest('.view-filters');
        if(parent){
          const filterParent = parent.closest('.filters-active');
          if(filterParent){
            filterParent.classList.remove('filters-active');
          }
          if(element.className.includes('search-button') && actualForm){ //only needs to run on content search page
            //if we want checkboxes to not apply automatically and instead only apply on submit
            //this is copied from a patch to the checkbox-widget.js file
            // const $widget = $(element).closest('.view-filters').find('.js-facets-widget');
            // const $widgetLinks = $widget.find('.facet-item > a');
            //
            // Drupal.facets.disableFacet($widget);
            //
            // // Build the url based on the selected checkboxes.
            // const queryString = $.parseParams(window.location.href);
            // let currentFacetValues = [];
            // if (typeof queryString['global-s'] == 'object') {
            //   currentFacetValues = queryString['global-s'];
            // }
            //
            // $widgetLinks.each(function () {
            //   var $link = $(this);
            //   var value = $widget.data('drupal-facet-alias') + ':' + $link.data('drupal-facet-item-value');
            //   var setted_index = $.inArray(value, currentFacetValues);
            //   // Add the facet, if it is not already set.
            //   if ($link.siblings('.facets-checkbox').is(':checked') && setted_index === -1) {
            //     currentFacetValues.push(value);
            //     // Remove the facet if set.
            //   } else if ($link.siblings('.facets-checkbox').is(':checked') === false && $link.siblings('.facets-checkbox').is(':indeterminate') === false && setted_index !== -1) {
            //     currentFacetValues.splice(setted_index, 1);
            //   }
            // });
            //
            // if (currentFacetValues.length > 0) {
            //   queryString['global-s'] = $.extend({}, currentFacetValues);
            // }
            // else {
            //   queryString['global-s'] = null;
            // }
            // var path = window.location.href.split('?')[0];
            // var queryStringObj = $.extend({}, queryString);
            //
            // // Remove pager parameter as the current page could not exist with
            // // the new facets.
            // if (typeof queryStringObj.page !== 'undefined') {
            //   queryStringObj.page = null;
            // }
            //
            // var href = path + '?' + $.param(queryStringObj);
            //
            // // Trigger the facet based on the built url.
            // $widget.trigger('facets_filter', [ href ]);

            //and now the non-facet stuff
            const searchInput = parent.querySelector('.form-text');
            copySearchInput(searchInput);
            return;
          }
        }

        // get the id of the clicked element.
        const id = element.getAttribute('id');
        // change this elements id
        element.setAttribute('id', `${id}-facade`);
        // find the input with the same id
        const input = document.querySelector(`#${id}`);
        if (!input) {
          return;
        }
        input.click();

      });
      if (element.className.includes('search-button') && actualForm) { //only needs to run on content search page
        const formText = element.parentElement.querySelector('.form-text');
        if (formText) {
          element.parentElement.querySelector('.form-text').addEventListener('keypress', function (e) {
            // copySearchInput(e.target);
            if (e.key === 'Enter') {
              copySearchInput(e.target);
              // $(element).click();
            }
          });
        }
      }
      function copySearchInput(inputSourceElement){
        //first copy over the text to the corresponding form
        //@TODO need a better way to figure out the original input
        //currently hardcoded to work for the search page
        const actualForm = document.querySelector('[data-drupal-selector="views-exposed-form-content-search-page-1"]');
          const actualSearchInput = actualForm.querySelector('input.form-text');
          const actualSubmitButton = actualForm.querySelector('.search-button');
          actualSearchInput.value = inputSourceElement.value;
          actualSubmitButton.click();
      }
    });
  },
  handleFinancialCalendarException(element, submit) {
    if (element.getAttribute('name') === 'date[1]') {
      const yearCheckboxes = document.querySelectorAll('[id^="edit-year"] .form-checkbox');
      yearCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      submit.click();
    } else {
      submit.click();
    }
  }
};
