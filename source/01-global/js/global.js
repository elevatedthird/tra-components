/**
 * theme.js
 * Entry point for all theme related js.
 */
require('./skip-link');
require('./smoothscroll');

// using this as its smaller, but can implement the sr link icon script if need.
for (let links = document.links, i = 0, a; a = links[i]; i++) {
  if (a.host !== location.host || a.href.includes('sites/default/files') ) {
    a.target = '_blank';
  }
  a.setAttribute('rel', 'nofollow');
}

// Let the document know when the mouse is being used
document.body.addEventListener('mousedown', function() {
  document.body.classList.add('using-mouse');
  document.body.classList.remove('using-tab');
});

// Re-enable focus styling when Tab is pressed
document.body.addEventListener('keydown', function(event) {
  if (event.keyCode === 9) {
    document.body.classList.remove('using-mouse');
    document.body.classList.add('using-tab');
  }
});
