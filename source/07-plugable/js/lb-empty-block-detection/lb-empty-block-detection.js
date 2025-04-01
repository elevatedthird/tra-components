import once from "@drupal/once";

Drupal.behaviors.ariesLbEmptyBlockDetection = {
  attach(context) {
    const elements = $(once('ariesLbEmptyBlockDetection', '.block', context));

    elements.each((index, el) => {
      // eslint-disable-next-line no-unused-vars
      const block = $(el);
      if (block.hasClass('block--fund-center')
        || block.hasClass('block--angular-application')
        || block.hasClass('block--resource-explorer')
        || block.hasClass('block--form-wizard')) {
        return;
      }
      const blockHeight = block.height();
      if (blockHeight === 0) {
        block.css({ backgroundColor: '#eee' });
        block.html('<div style="padding: 25px">Empty Block, Please remove me or enter content into the fields.</div>');
      }
    });
  },
};
