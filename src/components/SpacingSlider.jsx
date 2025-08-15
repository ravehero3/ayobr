import React from 'react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';

const SpacingSlider = () => {
  const { containerSpacing, setContainerSpacing, pairs, isGenerating, generatedVideos } = useAppStore();
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Don't render if no files are present or if videos are being generated/completed
  if (!hasFiles || isGenerating || generatedVideos.length > 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="spacing-slider-container"
      >
        <div className="spacing-slider-title">Spacing</div>
        
        <input
          type="range"
          min="-200"
          max="80"
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