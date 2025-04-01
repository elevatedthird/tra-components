Drupal.behaviors.ariesComparisonCards = {
  attach(context) {
    // Get all comparison card containers
    const comparisonCards = context.querySelectorAll('.organism--comparison-cards');

    comparisonCards.forEach(card => {
      // Get the unique ID for the current card
      const uniqueId = card.id;

      const adjustFeatureHeights = () => {
      const isMobile = window.innerWidth <= 959;
      const featureContainers = card.querySelectorAll('.field--name-field-p-features');
      const headingContainers = card.querySelectorAll('.comparison-card-heading');

      if (featureContainers.length === 0) return;

      // Get the number of features (assuming they are the same in each container)
      const featureCount = featureContainers[0].querySelectorAll('.field__item').length;

      // Initialize an array to hold max heights for each feature index
      const maxHeights = new Array(featureCount).fill(0);

      // Calculate the max height for each feature across all containers
      featureContainers.forEach(container => {
        const features = container.querySelectorAll('.field__item');
        features.forEach((feature, index) => {
          // Reset the height for each feature before recalculating
          feature.style.minHeight = 'auto'; // Resetting to allow for recalculation
          const featureHeight = feature.offsetHeight;
          if (featureHeight > maxHeights[index]) {
            maxHeights[index] = featureHeight; // Update max height for this feature
          }
        });
      });

      // Set min-height for each feature in each container based on the max heights
      featureContainers.forEach(container => {
        const features = container.querySelectorAll('.field__item');

        features.forEach((feature, index) => {
          if (!isMobile) {
            feature.style.minHeight = `${maxHeights[index]}px`; // Apply max height for non-mobile
          } else {
            feature.style.minHeight = 'auto'; // Clear minHeight for mobile view
          }
        });
      });

        // Adjust min-height for heading containers
        let maxHeadingHeight = 0;
        headingContainers.forEach(heading => {
          heading.style.minHeight = 'auto'; // Resetting to allow for recalculation
          const headingHeight = heading.offsetHeight;
          if (headingHeight > maxHeadingHeight) {
            maxHeadingHeight = headingHeight; // Update max height for headings
          }
        });

        headingContainers.forEach(heading => {
          heading.style.minHeight = `${maxHeadingHeight}px`; // Apply max height for headings
        });
      };

      // Run the adjustment on DOMContentLoaded and on window resize
      document.addEventListener("DOMContentLoaded", adjustFeatureHeights);
      window.addEventListener("resize", adjustFeatureHeights);

      // Run the adjustment immediately
      adjustFeatureHeights();
    });
  },
};