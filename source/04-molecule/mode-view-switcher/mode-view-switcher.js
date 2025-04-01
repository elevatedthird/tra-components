/**
 * view-mode-switch.js
 * Views Grid/List Switch functionality.
 */

Drupal.behaviors.ariesViewModeSwitch = {
  attach(context) {
    const activeButton = context.querySelector('.view-mode-switcher button.is-active');
    const buttons = context.querySelectorAll('.view-mode-switcher button');
    if (!buttons || !activeButton) return;
    const currentViewMode = activeButton.getAttribute('data-view');
    const url = new URL(window.location.href);
    const urlViewMode = url.searchParams.get('toggle');
    const cookie = this.getCookie('mode-view-switcher');
    if (urlViewMode && urlViewMode !== cookie) {
      this.editView(urlViewMode, buttons, this.submit);
    } else if (urlViewMode && (urlViewMode !== currentViewMode)) {
      buttons.forEach((button) => {
        button.classList.remove('is-active');
        if (button.getAttribute('data-view') == urlViewMode) {
          button.classList.add('is-active');
        }
      });
    } else if (!urlViewMode && cookie) {
      buttons.forEach((button) => {
        button.classList.remove('is-active');
        if (button.getAttribute('data-view') == cookie) {
          button.classList.add('is-active');
        }
      });
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!button.classList.contains('is-active')) {
          const viewMode = button.getAttribute('data-view');
          this.editView(viewMode, buttons, this.submit);
          this.handleParams(viewMode);
        }
      });
    });
  },
  handleParams(viewMode) {
    const url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    params.set("toggle", viewMode);
    params = '?' + params.toString()
    window.history.pushState(null, null, params);
  },
  editView(viewMode, buttons, callback) {
    document.cookie = "mode-view-switcher=" + viewMode + "; path=/;";
    buttons.forEach((button) => {
      button.classList.remove('is-active');
      if (button.getAttribute('data-view') == viewMode) {
        button.classList.add('is-active');
      }
    });
    if (callback) {
      callback();
    }
  },
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  },
  submit() {
    let submit =  document.querySelector('.view-filters form .form-submit');
    if (!submit) {
      submit =  document.querySelector('.view-filters .form-submit');
    }
    if (submit) {
      submit.click();
    } else {
      window.location.href = window.location.href;
    }
  }
};
