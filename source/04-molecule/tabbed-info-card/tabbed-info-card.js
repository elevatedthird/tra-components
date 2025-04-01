import once from "@drupal/once";

// non jquery version
Drupal.behaviors.ariesTabbedInfoCard = {
  attach(context) {
    once('tabbed-info-card', context.querySelector('.molecule--tabbed-info-card')).forEach((el) => {
      // do things!
    });
  }
};

// jquery version
Drupal.behaviors.ariesTabbedInfoCard = {
  attach(context) {
    // $(context)
    //   .find('.molecule--tabbed-info-card')
    //   .once('tabbed-info-card')
    //   .each((index, el) => {
    //     // do stuffs
    //   });
  },
};
