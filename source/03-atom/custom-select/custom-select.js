/**
 * @file custom-select-list.js
 *
 * Custom select functionality for better display
 * @see https://codepen.io/sandrina-p/pen/YzyOYRr
 * @see https://css-tricks.com/striking-a-balance-between-native-and-custom-select-elements/
 */

/* eslint-disable no-use-before-define */

export default function CustomSelect(domNode) {
  this.domNode = domNode;
}

CustomSelect.prototype.init = function () {
  const activeClass = 'isActive';
  const item = this.domNode;
  const select = item.querySelector('select');

  // Create alt div for better select styles
  const list = document.createElement('div');
  list.classList.add(select.name);
  list.classList.add('selectCustom');
  list.setAttribute('aria-hidden', 'true');

  const options = document.createElement('div');
  options.classList.add('selectCustom-options');
  for (let i = 0; i < select.length; i += 1) {
    const option = document.createElement('div');
    option.classList.add('selectCustom-option');
    option.setAttribute('data-value', select[i].value.toString());
    option.innerText = select[i].innerText;
    options.appendChild(option);
  }

  const trigger = document.createElement('div');
  trigger.classList.add('selectCustom-trigger');
  trigger.innerText = '';
  // Toggle custom select visibility when clicking the box
  trigger.addEventListener('click', () => {
    const isClosed = !item.classList.contains(activeClass);

    if (isClosed) {
      openSelectCustom();
    } else {
      closeSelectCustom();
    }
  });

  list.appendChild(trigger);
  list.appendChild(options);
  item.insertBefore(list, select.nextSibling);

  const elSelectNative = select;
  const elSelectCustom = list;
  const elSelectCustomBox = elSelectCustom.children[0];
  const elSelectCustomOpts = elSelectCustom.children[1];
  const customOptsList = Array.from(elSelectCustomOpts.children);
  const optionsCount = customOptsList.length;

  let optionChecked = '';
  let optionHoveredIndex = -1;

  function updateCustomSelectHovered(newIndex) {
    const prevOption = elSelectCustomOpts.children[optionHoveredIndex];
    const option = elSelectCustomOpts.children[newIndex];

    if (prevOption) {
      prevOption.classList.remove('isHover');
    }
    if (option) {
      option.classList.add('isHover');
    }

    optionHoveredIndex = newIndex;
  }

  function updateCustomSelectChecked(value, text) {
    const prevValue = optionChecked;

    const elPrevOption = elSelectCustomOpts.querySelector(
      `[data-value="${prevValue}"`,
    );
    const elOption = elSelectCustomOpts.querySelector(`[data-value="${value}"`);

    if (elPrevOption) {
      elPrevOption.classList.remove(activeClass);
    }

    if (elOption) {
      elOption.classList.add(activeClass);
    }

    elSelectCustomBox.textContent = text;
    optionChecked = value;
  }

  function watchClickOutside(e) {
    const didClickedOutside = !elSelectCustom.contains(e.target);
    if (didClickedOutside) {
      closeSelectCustom();
    }
  }

  function openSelectCustom() {
    elSelectCustom.classList.add(activeClass);
    // Remove aria-hidden in case this was opened by a user
    // who uses AT (e.g. Screen Reader) and a mouse at the same time.
    elSelectCustom.setAttribute('aria-hidden', false);
    item.setAttribute('data-empty', false);
    item.setAttribute('data-focus', true);
    item.querySelector('select').focus();

    if (optionChecked) {
      const optionCheckedIndex = customOptsList.findIndex(
        (el) => el.getAttribute('data-value') === optionChecked,
      );
      updateCustomSelectHovered(optionCheckedIndex);
    }

    // Add related event listeners
    document.addEventListener('click', watchClickOutside);
    document.addEventListener('keydown', supportKeyboardNavigation);
  }

  function closeSelectCustom() {
    elSelectCustom.classList.remove(activeClass);

    elSelectCustom.setAttribute('aria-hidden', true);
    item.setAttribute('data-focus', false);

    if (!optionChecked) {
      item.setAttribute('data-empty', true);
    }

    updateCustomSelectHovered(-1);

    // Remove related event listeners
    document.removeEventListener('click', watchClickOutside);
    document.removeEventListener('keydown', supportKeyboardNavigation);
  }

  function supportKeyboardNavigation(e) {
    // press down -> go next
    if (e.keyCode === 40 && optionHoveredIndex < optionsCount - 1) {
      e.preventDefault(); // prevent page scrolling
      updateCustomSelectHovered(optionHoveredIndex + 1);
    }

    // press up -> go previous
    if (e.keyCode === 38 && optionHoveredIndex > 0) {
      e.preventDefault(); // prevent page scrolling
      updateCustomSelectHovered(optionHoveredIndex - 1);
    }

    // press Enter or space -> select the option
    if (e.keyCode === 13 || e.keyCode === 32) {
      // this was breaking typing and clicking enter after click
      // e.preventDefault();
      //
      // const option = elSelectCustomOpts.children[optionHoveredIndex];
      // const value = option && option.getAttribute('data-value');

      // if (value) {
      //   elSelectNative.value = 'Albania';
      //   console.log('test');
      //   updateCustomSelectChecked(elSelectNative.value, option.textContent);
      // }
      closeSelectCustom();
    }

    // press ESC -> close selectCustom
    if (e.keyCode === 27) {
      closeSelectCustom();
    }
  }
  // Update selectCustom value when selectNative is changed.
  elSelectNative.addEventListener('change', (e) => {
    const value = e.target.value; // eslint-disable-line prefer-destructuring
    // Only trigger custom option change if there is a value to update
    if (value) {
      const elRespectiveCustomOption = elSelectCustomOpts.querySelectorAll(`[data-value="${value}"]`)[0];
      if (value.length) {
        item.setAttribute('data-empty', false);
      } else {
        item.setAttribute('data-empty', true);
      }

      updateCustomSelectChecked(value, elRespectiveCustomOption.textContent);
    }
  });

  // Custom Event so when we programmatically update the native select,
  // it triggers a change event.
  let eventChange;
  if (typeof (Event) === 'function') {
    eventChange = new Event('change');
  } else {
    eventChange = document.createEvent('Event');
    eventChange.initEvent('change', true, true);
  }

  // Update selectCustom value when an option is clicked or hovered
  customOptsList.forEach((elOption, index) => {
    elOption.addEventListener('click', (e) => {
      const value = e.target.getAttribute('data-value');

      // Sync native select to have the same value
      elSelectNative.value = value;
      elSelectNative.dispatchEvent(eventChange);
      updateCustomSelectChecked(value, e.target.textContent);
      closeSelectCustom();
    });

    elOption.addEventListener('mouseenter', () => {
      updateCustomSelectHovered(index);
    });
  });

  // When navigating backward, display selected option
  if (elSelectNative.value) {
    elSelectNative.dispatchEvent(eventChange);
  }
};
