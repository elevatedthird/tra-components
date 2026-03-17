import Glide from "@glidejs/glide";

Drupal.behaviors.ariesGlide = {
  setAriaAttributes(slides) {
    slides.forEach((slide, index) => {
      slide.setAttribute('aria-label', `Slide ${index + 1} of ${slides.length}`);
      const isActive = slide.classList.contains('glide__slide--active');
      const focusableElements = slide.querySelectorAll('a, button, [tabindex]');
      if (isActive) {
        slide.removeAttribute('aria-hidden');
        // Enable all focusable elements within active slides.
        focusableElements.forEach((el) => {
          el.removeAttribute('tabindex');
        });
      } else {
        slide.setAttribute('aria-hidden', 'true');
        // Disable all focusable elements within inactive slides.
        focusableElements.forEach((el) => {
          el.setAttribute('tabindex', '-1');
        });
      }
    });
  },
  attach(context) {
    const sliders = once("aries-glide", ".glide", context);
    sliders.forEach((element) => {
      const glide = new Glide(element);
      // Attach global events that affect all sliders.
      glide.on("mount.after", () => {
        element.classList.add("mounted");
        this.setAriaAttributes(glide.selector.querySelectorAll('.glide__slide'));
        // If prefers reduced motion is enabled, disable autoplay.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          glide.update({ autoplay: false });
        }
      });
      glide.on("run.after", () => {
        this.setAriaAttributes(glide.selector.querySelectorAll('.glide__slide'));
      });
      // Check if this component implements glide itself.
      if (!element.hasAttribute("data-behavior-name")) {
        glide.mount();
        return;
      }
      const { behaviorName } = element.dataset;
      if (behaviorName in Drupal.behaviors) {
        if ("options" in Drupal.behaviors[behaviorName]) {
          glide.update(Drupal.behaviors[behaviorName].options);
        } else {
          console.error(
            "ariesGlide: Expected Drupal.behaviors.%s.options, but it's undefined. Please add an options key containing Glide.js options",
          );
        }
        if (typeof Drupal.behaviors[behaviorName].init === "function") {
          Drupal.behaviors[behaviorName].init(glide, element);
        } else {
          console.error(
            "ariesGlide: Expected Drupal.behaviors.%s.init, but it's undefined. Please add an init function to your JS file.",
          );
        }
      } else {
        console.error(
          "ariesGlide: Expected Drupal.behaviors.%s, but it's undefined.",
          behaviorName,
        );
      }
    });
  },
};
