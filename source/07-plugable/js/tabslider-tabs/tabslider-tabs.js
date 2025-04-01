/**
 * @file accordion.js
 *
 * Add accordion functionality
 */

Drupal.behaviors.themekitTabs = {
  attach(context) {
    const tabs = (context.classList && context.classList.contains('aries-tabs-wrapper')) ? context : context.querySelectorAll('.aries-tabs-wrapper');
    let abort = new AbortController();
    if (!tabs || tabs.length === 0) return;
    function debounce(callback, delay) {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(callback, delay);
      };
    }

    function checkSize(tabListNested, tabList) {
      // Check if the list is wider then the available space
      if (tabListNested.scrollWidth > (tabList.offsetWidth + 5) && window.innerWidth > tabList.getAttribute('data-no-scroll-breakpoint')) {
        tabList.classList.add('has-scroll');
      } else {
        tabList.classList.remove('has-scroll');
      }
    }
    function checkDropdown(tabList) {
      // check for data-dropwdown-breakpopint attribute
      if (tabList.getAttribute('data-dropdown-breakpoint')) {
        // if window.innerWidth is smaller then the data-dropdown-breakpoint attribute
        if (window.innerWidth < tabList.getAttribute('data-dropdown-breakpoint')) {
          abort = new AbortController();
          // add the dropdown class
          tabList.classList.add('is-dropdown');
          // if button with .dropdown-button class doesn't exist
          if (!tabList.querySelector('.dropdown-button')) {
            // also add a div with the class dropdown-button right before the tab list
            const dropdownButton = document.createElement('button');
            dropdownButton.classList.add('dropdown-button');
            // add appropriate wcag attributes
            dropdownButton.setAttribute('aria-haspopup', 'true');
            dropdownButton.setAttribute('aria-expanded', 'false');
            dropdownButton.setAttribute('aria-label', 'Select a tab');
            // generate an id with the words tab-list and a hash and
            // set the aria controls attribute to that id
            const hash = `tab-list-${Math.random().toString(36).substr(2, 9)}`;
            dropdownButton.setAttribute('id', hash);
            // set the id on the tablist
            tabList.setAttribute('id', hash);
            dropdownButton.innerHTML = '<span class="dropdown-button__text"></span>';
            tabList.prepend(dropdownButton);
            // dropdown-button__text should contain the text of the selected tab
            const selectedTab = tabList.querySelector('.is-selected');
            dropdownButton.querySelector('.dropdown-button__text').textContent = selectedTab.textContent;
            // add event listener to the dropdown button
            dropdownButton.addEventListener('click', () => {
              // toggle the aria-expanded attribute
              const expanded = dropdownButton.getAttribute('aria-expanded') === 'true' || false;
              dropdownButton.setAttribute('aria-expanded', !expanded);
              // toggle the is-open class
              dropdownButton.classList.toggle('is-open');
            }, { signal: abort.signal });
          }
        } else {
          // remove the dropdown class
          tabList.classList.remove('is-dropdown');
          // remove the dropdown button
          if (tabList.querySelector('.dropdown-button')) {
            tabList.querySelector('.dropdown-button').remove();
          }
          // Abort the event listeners
          abort.abort();
        }
      }
    }
    tabs.forEach((tab) => {
      new TabWidget(tab);

      const tabList = tab.querySelector('.tab-list');
      const tabsElements = tabList.querySelectorAll('li');
      const tabListNested = tab.querySelector('.tabs__tab-list');
      const moveBtns = tab.querySelectorAll('.move-list');
      const prevBtn = tab.querySelector('[data-direction="left"]');
      const nextBtn = tab.querySelector('[data-direction="right"]');

      // Button to move the tab list left/right on smaller windows
      moveBtns.forEach((btn) => {
        // if the button already has an event listener, don't add another one
        if (btn.getAttribute('data-event-listener') === 'added') return;
        // add a data attr to mark event listenr as added
        btn.setAttribute('data-event-listener', 'added');

        btn.addEventListener('click', (e) => {
          const selected = tabList.querySelector('.is-selected').parentElement;
          const prev = selected.previousElementSibling ? selected.previousElementSibling.querySelector('a') : null;
          const next = selected.nextElementSibling ? selected.nextElementSibling.querySelector('a') : null;
          if (next && e.target.dataset.direction === 'right') {
            next.click();
          } else if (prev) {
            prev.click();
          }
        });
      });

      // Scroll to the item clicked
      const tabItems = tabListNested.querySelectorAll('a');
      tabItems.forEach((item) => {
        item.addEventListener('click', () => {
          document.querySelector('.dropdown-button__text').textContent = item.innerHTML;
          // also check for the .tabs__tab-list ul.
          document.querySelector('button.dropdown-button').setAttribute('aria-expanded', 'false');
          document.querySelector('button.dropdown-button').classList.remove('is-open');
          tabListNested.scrollLeft = item.parentElement.offsetLeft;
          // get the data-center-tabs attribute.
          if (tabListNested.getAttribute('data-center-tabs')) {
            // try to center the item clicked
            // eslint-disable-next-line max-len
            tabListNested.scrollLeft = item.parentElement.offsetLeft - (tabList.offsetWidth / 2) + (item.parentElement.offsetWidth / 2);
          }
        });
      });

      tabsElements.forEach((item, index) => {
        const itemTotal = tabsElements.length - 1;
        const disabledClass = 'disabled';

        item.addEventListener(('click'), (e) => {
          if (index === 0) {
            prevBtn.classList.add(disabledClass);
            nextBtn.classList.remove(disabledClass);
          } else if (index === itemTotal) {
            nextBtn.classList.add(disabledClass);
            prevBtn.classList.remove(disabledClass);
          } else {
            moveBtns.forEach((button) => {
              button.classList.remove(disabledClass);
            });
          }
          e.stopPropagation();
        });

        nextBtn.addEventListener('click', (event) => {
          const selected = item.querySelector('a').classList.contains('is-selected');
          if (index === itemTotal && selected) {
            event.target.classList.add(disabledClass);
          } else {
            prevBtn.classList.remove(disabledClass);
          }
        });

        prevBtn.addEventListener('click', (event) => {
          const selected = item.querySelector('a').classList.contains('is-selected');
          if (index === 0 && selected) {
            event.target.classList.add(disabledClass);
          } else {
            nextBtn.classList.remove(disabledClass);
          }
        });
      });

      // Check if the the list needs to scroll
      checkSize(tabListNested, tabList);
      checkDropdown(tabList);
      window.addEventListener('resize', debounce(() => {
        checkSize(tabListNested, tabList);
        checkDropdown(tabList);
      }, 100));
    });
  },
};

/*
*  @file TabWidget.js
*  Based on @see https://codepen.io/stowball/pen/xVWwWe
*
*  Adds keyboard functionality for main nav menu.
*/

export default function TabWidget(el, selectedIndex) {
  if (!el) {
    return;
  }
  this.el = el;
  this.tabTriggers = this.el.getElementsByClassName('js-tab-trigger');
  this.tabPanels = this.el.getElementsByClassName('js-tab-panel');

  if (this.tabTriggers.length === 0 || this.tabTriggers.length !== this.tabPanels.length) {
    return;
  }

  this.init(selectedIndex);
}

TabWidget.prototype.init = function (selectedIndex) {
  this.tabTriggersLength = this.tabTriggers.length;
  this.selectedTab = 0;
  this.prevSelectedTab = null;
  this.clickListener = this.clickEvent.bind(this);
  this.keydownListener = this.keydownEvent.bind(this);
  this.keys = {
    prev: 37,
    next: 39,
  };

  for (let i = 0; i < this.tabTriggersLength; i += 1) {
    this.tabTriggers[i].index = i;
    this.tabTriggers[i].addEventListener('click', this.clickListener, false);
    this.tabTriggers[i].addEventListener('keydown', this.keydownListener, false);

    if (this.tabTriggers[i].classList.contains('is-selected')) {
      this.selectedTab = i;
    }
  }

  if (!isNaN(selectedIndex)) { // eslint-disable-line no-restricted-globals
    this.selectedTab = selectedIndex < this.tabTriggersLength
      ? selectedIndex : this.tabTriggersLength - 1;
  }

  this.selectTab(this.selectedTab);
  this.el.classList.add('is-initialized');
};

// Handle Click events
TabWidget.prototype.clickEvent = function (e) {
  e.preventDefault();
  if (e.target.index === this.selectedTab) {
    return;
  }
  this.selectTab(e.target.index, true);
};

// Handle keyboard events next and prev
TabWidget.prototype.keydownEvent = function (e) {
  let targetIndex;

  if (e.keyCode === this.keys.prev || e.keyCode === this.keys.next) {
    e.preventDefault();
  } else {
    return;
  }

  if (e.keyCode === this.keys.prev && e.target.index > 0) {
    targetIndex = e.target.index - 1;
  } else if (e.keyCode === this.keys.next && e.target.index < this.tabTriggersLength - 1) {
    targetIndex = e.target.index + 1;
  } else {
    return;
  }

  this.selectTab(targetIndex, true);
};

// Show tab content
TabWidget.prototype.show = function (index, userInvoked) {
  this.tabTriggers[index].classList.add('is-selected');
  this.tabTriggers[index].setAttribute('aria-selected', true);
  this.tabTriggers[index].setAttribute('tabindex', 0);

  this.tabPanels[index].classList.remove('is-hidden');
  this.tabPanels[index].setAttribute('aria-hidden', false);
  this.tabPanels[index].setAttribute('tabindex', 0);

  if (userInvoked) {
    this.tabTriggers[index].focus();
  }
};

// Hide tab content
TabWidget.prototype.hide = function (index) {
  this.tabTriggers[index].classList.remove('is-selected');
  this.tabTriggers[index].setAttribute('aria-selected', false);
  this.tabTriggers[index].setAttribute('tabindex', -1);

  this.tabPanels[index].classList.add('is-hidden');
  this.tabPanels[index].setAttribute('aria-hidden', true);
  this.tabPanels[index].setAttribute('tabindex', -1);
};

// Activate a selected tab
TabWidget.prototype.selectTab = function (index, userInvoked) {
  if (this.prevSelectedTab === null) {
    for (let i = 0; i < this.tabTriggersLength; i += 1) {
      if (i !== index) {
        this.hide(i);
      }
    }
  } else {
    this.hide(this.selectedTab);
  }

  this.prevSelectedTab = this.selectedTab;
  this.selectedTab = index;

  this.show(this.selectedTab, userInvoked);
};

// Destroy tabs
TabWidget.prototype.destroy = function () {
  for (let i = 0; i < this.tabTriggersLength; i += 1) {
    this.tabTriggers[i].classList.remove('is-selected');
    this.tabTriggers[i].removeAttribute('aria-selected');
    this.tabTriggers[i].removeAttribute('tabindex');

    this.tabPanels[i].classList.remove('is-hidden');
    this.tabPanels[i].removeAttribute('aria-hidden');
    this.tabPanels[i].removeAttribute('tabindex');

    this.tabTriggers[i].removeEventListener('click', this.clickListener, false);
    this.tabTriggers[i].removeEventListener('keydown', this.keydownListener, false);

    delete this.tabTriggers[i].index;
  }

  this.el.classList.remove('is-initialized');
};

