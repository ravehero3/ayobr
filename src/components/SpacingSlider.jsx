import React from 'react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const SpacingSlider = () => {
  const { containerSpacing, setContainerSpacing, pairs, isGenerating, generatedVideos, spacingSliderVisible } = useAppStore();
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Don't render if not visible, no files, or generating/completed
  if (!spacingSliderVisible || !hasFiles || isGenerating || generatedVideos.length > 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="spacing-slider-container hidden md:flex"
      >
        <div className="spacing-slider-title">Spacing</div>
        
        <input
          type="range"
          min="0"
          max="400"
          step="10"
          value={containerSpacing}
          onChange={(e) => setContainerSpacing(parseInt(e.target.value))}
          className="spacing-slider"
        />
        
        <div className="spacing-value-display">{containerSpacing}px</div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpacingSlider;