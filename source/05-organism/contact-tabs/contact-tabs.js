import moment from 'moment-timezone';
import CustomSelect from '../../03-atom/custom-select/custom-select';
/* eslint-disable */
Drupal.behaviors.ariesContactTabsTimeZoneSelect = {
  selectedTimezone: 'America/New_York',
  attach() {
    const rootTimeZoneSelect = document.getElementById('root-timezone-selector');
    // eslint-disable-line
    once('aries_rootTimeZoneSelect', rootTimeZoneSelect).forEach((rootTimeZoneSelect) => {
      const block = rootTimeZoneSelect.closest('.block--contact-tabs');
      const select = rootTimeZoneSelect.querySelector('.js-form-type-select');
      const facades = block.querySelectorAll('.timezone-facade');
      const that = this;
      this.setInitialTimeslotState(block);
      this.handleTimeslotChange(block);
      facades.forEach((facade) => {
        const copy = select.cloneNode(true);
        copy.setAttribute('data-empty', false);
        $(copy).find('select').first().val(this.selectedTimezone);
        const customselect = new CustomSelect(copy);
        customselect.init();
        const copySelect = copy.querySelector('select');
        const label = copy.querySelector('label');
        const copyId = copySelect.id + '--' + this.makeid(10);
        copySelect.id = copyId;
        label.setAttribute('for', copyId);
        facade.appendChild(copy);
        facade.querySelector('select').addEventListener('change', (e) => {
          that.selectedTimezone = e.target.value;
          // set all the selects to the selected timezone
          facades.forEach((facade) => {
            if (facade.querySelector('select').value !== that.selectedTimezone) {
              facade.querySelector('select').value = that.selectedTimezone;
              facade.querySelector('select').dispatchEvent(new Event('change'));
            }
          });

          this.handleTimeslotChange(block);
        });
      });
    });
  },
  makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  },
  setInitialTimeslotState(block) {
    // alter all the timeslots to reflect the new timezone
    const timeSlots = block.querySelectorAll('.office-hours__item-slots');
    timeSlots.forEach((timeSlot) => {
      const [startTime, endTime] = timeSlot.innerHTML.split(' - ');
      const initialStartTime = moment('2013-03-01T' + startTime + '-05:00').tz(this.selectedTimezone).format();
      const initialEndTime = moment('2013-03-01T' + endTime + '-05:00').tz(this.selectedTimezone).format();
      timeSlot.setAttribute('startTime', initialStartTime);
      timeSlot.setAttribute('endTime', initialEndTime);
    });
  },
  handleTimeslotChange(block) {
    // alter all the timeslots to reflect the new timezone
    const timeSlots = block.querySelectorAll('.office-hours__item-slots');
    timeSlots.forEach((timeSlot) => {
      const startTime = moment(timeSlot.getAttribute('startTime')).tz(this.selectedTimezone);
      let startHour = startTime.format('h');
      let startMinutes = '';
      if (startTime.format('mm') !== '00') {
        startMinutes = ':' + startTime.format('mm'); // Display both hour and minutes
      }
      let startMeridiem = startTime.format('a');
      const endTime = moment(timeSlot.getAttribute('endTime')).tz(this.selectedTimezone);
      let endHour = endTime.format('h');
      let endMinutes = '';
      if (endTime.format('mm') !== '00') {
        endMinutes = ':' + endTime.format('mm'); // Display both hour and minutes
      }
      let endMeridiem = endTime.format('a');
      let timezone = endTime.format('z');
      switch (this.selectedTimezone) {
        case 'America/New_York':
          timezone = 'ET'
          break;
        case 'America/Chicago':
          timezone = 'CT'
          break;
        case 'America/Denver':
          timezone = 'MT'
          break;
        case 'America/Phoenix':
          timezone = 'MST'
          break;
        case 'America/Los_Angeles':
          timezone = 'PT'
          break;

      }
      startMeridiem = startMeridiem.split('').join('.') + '.';
      endMeridiem = endMeridiem.split('').join('.') + '.';
      timeSlot.innerHTML = `${startHour}${startMinutes} ${startMeridiem} – ${endHour}${endMinutes} ${endMeridiem}<span class="timezone"> ${timezone}</span>`;
    });
  },
};

Drupal.behaviors.ariesContactTabsemailConfirmation = {
  attach() {
    const ajaxBeforeSubmitOriginal = Drupal.Ajax.prototype.beforeSubmit;
    const contactTabs = document.querySelectorAll('.block--contact-tabs');
    let dontSubmit = true;
    let formIdToSubmit;
    if (!contactTabs || contactTabs.length === 0) return;    // eslint-disable-line
    contactTabs.forEach((contactTabBlock) => {
      // find closest .layout and add class .layout--contact-tabs
      const layout = contactTabBlock.closest('.layout');
      if (layout) {
        $(layout).addClass('layout--contact-tabs');
      }
      const submitButtonsFacades = document.querySelectorAll('div.contact-tabs--submit-button-facade');

      const handleFormSubmitFacade = (e) => {
        formIdToSubmit = e.target.closest('form').getAttribute('id');
        const form = document.getElementById(formIdToSubmit);
        if ($(form).valid()) {
        // if (true) {
          const confirmationOpenModalButton = document.querySelector('[data-micromodal-trigger="contact-tabs--confirmation-modal"]');
          $(confirmationOpenModalButton).trigger('click');

          const confirmationContentText = document.getElementById('contact-tabs--confirmation-modal-content');
          const submitFormButton = confirmationContentText.querySelector('button.submit-form');
          const emailWrapper = document.createElement('strong');
          const email = form.querySelector('.form-type-email input').value;
          emailWrapper.classList.add('email-wrapper');
          emailWrapper.append(email);

          // confirmationContentText contains $email$.
          if (confirmationContentText.innerHTML.indexOf('$email$') >= 0) {
            confirmationContentText.innerHTML = confirmationContentText.innerHTML.replace('$email$', emailWrapper.outerHTML);
          } else {
            // replace the text of .email-wrapper with the email
            confirmationContentText.querySelector('.email-wrapper').innerHTML = email;
          }

          // console.log(confirmationOpenModalButton);
          // confirmationOpenModalButton.dispatchEvent(new Event('click'));

          const confirmationModalInnerButton = document.getElementById('contact-tabs--confirmation-modal-content').querySelector('.submit-form');
          const confirmationContentClose = confirmationContentText.querySelector('button[data-micromodal-close]');
          // confirmationContentClose.focus();
          const handleConfirmationModalSubmitButton = (e) => {
            const closeButton = e.target.closest('[data-micromodal-close]');
            const successButton = document.querySelector('[data-micromodal-trigger="contact-tabs--success-modal"]');
            $(closeButton).trigger('click');
            const form = document.getElementById(formIdToSubmit);
            if ($(form).valid()) {
              $(successButton).trigger('click');
              const submit = form.querySelector('.form-actions [type="submit"]');
              dontSubmit = false;
              $(submit).trigger('click');
              // get all paragraph--type--contact-tab-item
              const contactTabItems = document.querySelectorAll('.paragraph--type--contact-tab-item');
              contactTabItems.forEach((tab) => {
                // if tab.querySelector('.contact-tab-item__header select') exists
                if (tab.querySelector('.contact-tab-item__header select')) {
                  tab.querySelector('.contact-tab-item__header select').value = 'left'
                  tab.querySelector('.contact-tab-item__header select').dispatchEvent(new Event('change'));
                }
                $(tab).removeClass('active-side--left');
                $(tab).removeClass('active-side--right');
                $(tab).removeClass('active-side--form-panel');
                $(tab).addClass('active-side--left');
              });
            }
          }

          confirmationModalInnerButton.addEventListener('click', (e) => {
            handleConfirmationModalSubmitButton(e);
          });

          confirmationModalInnerButton.addEventListener('keydown', (e) => {
            if (e.type === 'keydown' && e.which === 13) {
              handleConfirmationModalSubmitButton(e);
            }
          });
        }
      }
      submitButtonsFacades.forEach((submitButtonFacade) => {
        submitButtonFacade.addEventListener('click', (e) => {
          handleFormSubmitFacade(e);
        });
        submitButtonFacade.addEventListener('keydown', (e) => {
          if (e.type === 'keydown' && e.which === 13) {
            handleFormSubmitFacade(e);
          }
        });
      });
    });
  },

};

Drupal.behaviors.ariesContactPanelSwitcher = {
  attach(context) {
    const contactTabs = (context.classList && context.classList.contains('block--contact-tabs')) ? context : context.querySelectorAll('.block--contact-tabs');
    if (!contactTabs || contactTabs.length === 0) return;    // eslint-disable-line
    once('theme_kit_ContactPanelSwitcher', contactTabs).forEach((contactTabBlock) => {
      this.handleSelectSwitcher(contactTabBlock);
      this.handleAnchorSwitcher(contactTabBlock);
      this.handleFormBackSwitcher(contactTabBlock);
      this.handleFormPanelSwitcher(contactTabBlock);
    });
  },
  handleSelectSwitcher(block) {
    const selectors = block.querySelectorAll('.contact-tab-item__header select');
    selectors.forEach((selector) => {
      selector.addEventListener('change', (e) => {
        const tab = e.target.closest('.paragraph--type--contact-tab-item');
        this.handleSideSwitching(tab, e.target.value);
      });
    });
  },
  handleAnchorSwitcher(block) {
    const selectors = block.querySelectorAll('.field--name-field-subhead-mobile-info a, .back-button a');
    const switcher = (e) => {
      const tab = e.target.closest('.paragraph--type--contact-tab-item');
      let side = $(e.target).closest('div').hasClass('back-button') ? 'left' : 'right';

      if ($(e.target).closest('div').hasClass('form-panel-back')) {
        side = 'right';
        if (tab.querySelector('.contact-tab-item__header select')) {
          tab.querySelector('.contact-tab-item__header select').value = 'left'
          tab.querySelector('.contact-tab-item__header select').dispatchEvent(new Event('change'));
        }
      } else {
        this.handleSideSwitching(tab, side);
      }

      e.preventDefault();
    }
    selectors.forEach((selector) => {
      selector.addEventListener('click', (e) => {
       switcher(e);
      });
      selector.addEventListener('keydown', (e) => {
        if (e.type === 'keydown' && e.which === 13) {
          switcher(e);
        }
      });
    });
  },
  handleFormBackSwitcher(block) {
    const selectors = block.querySelectorAll('.back-button a');
    const switcher = (e) => {
      const tab = e.target.closest('.active-side--form-panel');
      $(tab).removeClass('active-side--form-panel');
      e.preventDefault();
    }
    selectors.forEach((selector) => {
      selector.addEventListener('click', (e) => {
        switcher(e);
      });
      selector.addEventListener('keydown', (e) => {
        if (e.type === 'keydown' && e.which === 13) {
          switcher(e);
        }
      });
    });
  },
  handleFormPanelSwitcher(block) {
    const selectors = block.querySelectorAll('.contact-form-button-open a');
    const switcher = (e) => {
      const tab = e.target.closest('.paragraph--type--contact-tab-item');
      // this.handleSideSwitching(tab, 'form-panel');
      const wrapper = e.target.closest('.contact-tabs-info-form-wrapper');
      const formWrapper = wrapper.querySelector('.contact-form-page');
      if (window.contactTabFormMoved !== true) {
        window.contactTabFormMoved = true;
        const panelContentWrapper = e.target.closest('.contact-tab-item__content');
        const newPanel = document.createElement('div');
        newPanel.classList.add('contact-tab-item__content--form-panel');
        newPanel.classList.add('contact-tab-item__content--panel');
        newPanel.classList.add('cell');
        newPanel.append(formWrapper);
        // find form-panel-back
        const formPanelBack = newPanel.querySelector('.form-panel-back');
        // if exists then move to be element before field--name-field-form
        panelContentWrapper.append(newPanel);
      }
      this.handleSideSwitching(tab, 'form-panel');
      tab.querySelector('.form-panel-back').focus();
      e.preventDefault();
    }
    selectors.forEach((selector) => {
      selector.addEventListener('click', (e) => {
        switcher(e);
      });
      selector.addEventListener('keydown', (e) => {
        if (e.type === 'keydown' && e.which === 13) {
          switcher(e);
        }
      });
    });
  },
  handleSideSwitching(tab, side) {
    $(tab).removeClass('active-side--left');
    $(tab).removeClass('active-side--right');
    $(tab).removeClass('active-side--form-panel');
    if (side === 'left') {
      $(tab).addClass('active-side--left');
    } else if (side === 'right') {
      $(tab).addClass('active-side--right');
    } else if (side === 'form-panel') {
      $(tab).addClass('active-side--form-panel');
    }
  },
};
