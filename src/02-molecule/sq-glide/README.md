## Example include usage, see that you can pass controls to the controls slot.

```html
{% set controls %}
  <div role="region" aria-label="<ComponentName> Navigation" class="controls">
    <div class="">
      <div class="glide-controls">
        {{ include('<theme-name>:sq-glide-bullets', {
            item_count,
            classes: {
              bullets: '',
            }
        }, with_context = false) }}
        {{ include('<theme-name>:sq-glide-arrows', {
          classes: {
            arrows: '',
            arrow_prev: '',
            arrow_next: '',
          }
        }, with_context = false) }}
      </div>
    </div>
  </div>
{% endset %}
<div role="region" aria-label="<ComponentName> Carousel">
  {{ include('<theme-name>:sq-glide', {
    classes: {
      wrapper: '',
    },
    behavior_name: 'NameOfYourBehavior',
    items: items,
    controls
  }, with_context: false) }}
</div>
```

## Example JS Behavior when using the glide component. This would be a js file located with your component calling in the glide component.

```js
Drupal.behaviors.<behaviorName> = {
  options: {
    type: 'carousel',
    perView: 3,
    rewind: false,
    autoplay: 10000,
    hoverpause: false,
    animationDuration: 300,
    gap: 24,
    breakpoints: {
      768: { perView: 1 },
    }
  },
  init(glide, element) {

    glide.mount();

  },
};
```
