import once from "@drupal/once";
/**
 * tabs lins.js
 * Hide and show filter for calendar_item - financial calendar view
 * Tabs links functionality.
 */
import {DropdownMenu} from 'foundation-sites/js/foundation.dropdownMenu';

Drupal.behaviors.ariesTabsLinks = {
  attach(context) {
    once('tablinks', context.querySelector('.bef-links')).forEach((el) => {
      this.init(el);
    });
  },
  init(tabLinkGroup, reset = false) {
    const ul = tabLinkGroup.querySelector('ul');
    const numLi = ($(ul).find("li").length);
    if(numLi > 4){
      $(ul).addClass("show-more-mobile");
      if(numLi > 10){
        $(ul).addClass("show-more-desktop");
      }
      const moreCaptureGroup = this.trimLinkGroup(ul, [], numLi);
      ul.appendChild(this.createMoreDropdown(moreCaptureGroup));
      new DropdownMenu($(ul));
    }

  },
  trimLinkGroup(linkGroup, moreCaptureGroup = [], numLi) {
    const overflown = numLi > 4;
    if (overflown) {
      const lis = $(linkGroup).find("li");
      const sliceIndex = 10; //elements after this index will be put into the "More" dropdown
      for (let liIdx = 2; liIdx < sliceIndex && liIdx < numLi; liIdx++) {
        const li = $(lis[liIdx]).clone(true)[0];
        if(liIdx < (sliceIndex - 1)){
          $(li).addClass("submenu-item-hidden-desktop");
        }
        moreCaptureGroup.push(li);
      }
      //slice everything past the sliceIndex off as we don't need them
      const remainingElements = ($(linkGroup).children().slice(sliceIndex, numLi).detach());
      for(let li of remainingElements){
        moreCaptureGroup.push(li);
      }
    }
    return moreCaptureGroup;
  },
  createMoreDropdown(moreCaptureGroup) {
    const li = document.createElement("li");
    const anchor = document.createElement("a");
    const icon = document.createElement("span");
    const submenu = document.createElement("ul");

    icon.innerText = 'expand_more';
    icon.classList.add('material-symbols-outlined');

    const anchorSpan = document.createElement("span");
    anchorSpan.classList.add("bef-link-text");
    anchorSpan.innerText = Drupal.t('More');
    anchor.append(anchorSpan);
    anchor.classList.add('bef-link');
    // add tabindex to make it focusable
    anchor.setAttribute('tabindex', '0');
    // set aria label to make it accessible
    anchor.appendChild(icon);

    submenu.classList.add('more-submenu');
    // set the id to make it accessible
    submenu.style.display = "none";
    submenu.classList.add('dropdown');
    submenu.classList.add('menu');
    submenu.classList.add('vertical');

    moreCaptureGroup.forEach((group) => {
      submenu.append(group);
    });

    li.classList.add('more-link');
    li.appendChild(anchor);

    li.appendChild(submenu);

    $(anchor).click(function () {
      //@TODO do $(this).find
      $(submenu).toggle();
      $(anchor).toggleClass("is-active");
    })

    // also on enter key
    $(anchor).keydown(function (e) {
      if (e.which === 13) {
        $(submenu).toggle();
        $(anchor).toggleClass("is-active");
      }
    });

    return li;
  },
};
