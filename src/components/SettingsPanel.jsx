import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    concurrencySettings, 
    setConcurrencySettings,
    videoSettings,
    setVideoBackground,
    setCustomBackground,
    setVideoQuality
  } = useAppStore();

  const handleBackgroundChange = (background) => {
    setVideoBackground(background);
  };

  const handleCustomBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCustomBackground(file);
      setVideoBackground('custom');
    }
  };

  const handleQualityChange = (quality) => {
    setVideoQuality(quality);
  };

  const presetOptions = [
    {
      name: 'Conservative',
      description: 'Best for older systems or limited resources',
      settings: { small: 2, medium: 3, large: 4, xlarge: 5 },
      icon: '🐌'
    },
    {
      name: 'Balanced',
      description: 'Good performance for most modern systems',
      settings: { small: 3, medium: 5, large: 8, xlarge: 10 },
      icon: '⚖️'
    },
    {
      name: 'Aggressive',
      description: 'Maximum speed for powerful systems',
      settings: { small: 4, medium: 6, large: 12, xlarge: 16 },
      icon: '🚀'
    },
    {
      name: 'Custom',
      description: 'Set your own limits',
      settings: concurrencySettings,
      icon: '⚙️'
    }
  ];

  const [selectedPreset, setSelectedPreset] = useState('Balanced');
  const [customSettings, setCustomSettings] = useState(concurrencySettings);

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset.name);
    if (preset.name !== 'Custom') {
      setConcurrencySettings(preset.settings);
      setCustomSettings(preset.settings);
    }
  };

  const handleCustomChange = (key, value) => {
    const newSettings = { ...customSettings, [key]: parseInt(value) };
    setCustomSettings(newSettings);
    if (selectedPreset === 'Custom') {
      setConcurrencySettings(newSettings);
    }
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Settings Gear Icon */}
      <motion.button
        onClick={togglePanel}
        className="fixed top-6 right-6 p-3 bg-gradient-to-br from-space-navy to-space-dark rounded-full border border-neon-cyan/30 shadow-lg hover:shadow-neon-cyan/20 transition-all duration-300 z-50"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        style={{
          boxShadow: '0 0 20px rgba(0, 207, 255, 0.1)'
        }}
      >
        <svg className="w-6 h-6 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </motion.button>

      {/* Settings Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={togglePanel}
            />

            {/* Settings Panel */}
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-space-navy to-space-dark rounded-3xl border border-neon-cyan/30 p-8 shadow-2xl z-50 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              style={{
                boxShadow: '0 0 40px rgba(0, 207, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neon-cyan/10 rounded-xl">
                    <svg className="w-6 h-6 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <p className="text-gray-400 text-sm">Customize video generation and performance</p>
                  </div>
                </div>
                <button
                  onClick={togglePanel}
                  className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Video Generation Settings */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Video Settings</h3>
                
                {/* Background Options */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-white mb-3">Background</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {/* White Background */}
                    <motion.button
                      onClick={() => handleBackgroundChange('white')}
                      className={`aspect-video rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                        videoSettings.background === 'white'
                          ? 'border-neon-cyan bg-neon-cyan/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <span className="text-black font-medium text-sm">White</span>
                      </div>
                    </motion.button>

                    {/* Black Background */}
                    <motion.button
                      onClick={() => handleBackgroundChange('black')}
                      className={`aspect-video rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                        videoSettings.background === 'black'
                          ? 'border-neon-cyan bg-neon-cyan/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <span className="text-white font-medium text-sm">Black</span>
                      </div>
                    </motion.button>

                    {/* Custom Background */}
                    <motion.div
                      className={`aspect-video rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer ${
                        videoSettings.background === 'custom'
                          ? 'border-neon-cyan bg-neon-cyan/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <label className="w-full h-full cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomBackgroundUpload}
                          className="hidden"
                        />
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col items-center justify-center">
                          {videoSettings.customBackground ? (
                            <img
                              src={URL.createObjectURL(videoSettings.customBackground)}
                              alt="Custom background"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-gray-400 font-medium text-sm">Custom</span>
                            </>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  </div>
                </div>

                {/* Quality Options */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-white mb-3">Quality</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Full HD */}
                    <motion.button
                      onClick={() => handleQualityChange('fullhd')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        videoSettings.quality === 'fullhd'
                          ? 'border-neon-cyan bg-neon-cyan/10'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">HD</span>
                        </div>
                        <div className="text-left">
                          <div className="text-white font-medium">Full HD</div>
                          <div className="text-gray-400 text-sm">1920×1080</div>
                        </div>
                      </div>
                    </motion.button>

                    {/* 4K */}
                    <motion.button
                      onClick={() => handleQualityChange('4k')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        videoSettings.quality === '4k'
                          ? 'border-neon-cyan bg-neon-cyan/10'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">4K</span>
                        </div>
                        <div className="text-left">
                          <div className="text-white font-medium">4K Ultra</div>
                          <div className="text-gray-400 text-sm">3840×2160</div>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Performance Presets */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Performance Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presetOptions.map((preset) => (
                    <motion.button
                      key={preset.name}
                      onClick={() => handlePresetChange(preset)}
                      className={`p-4 rounded-2xl border transition-all duration-200 text-left ${
                        selectedPreset === preset.name
                          ? 'border-neon-cyan bg-neon-cyan/10'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-white font-medium">{preset.name}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{preset.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        1-5: {preset.settings.small} | 6-15: {preset.settings.medium} | 16-25: {preset.settings.large} | 25+: {preset.settings.xlarge}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Settings */}
              {selectedPreset === 'Custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Custom Limits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'small', label: '1-5 videos', max: 8 },
                      { key: 'medium', label: '6-15 videos', max: 12 },
                      { key: 'large', label: '16-25 videos', max: 20 },
                      { key: 'xlarge', label: '25+ videos', max: 25 }
                    ].map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <label className="text-white text-sm font-medium">{setting.label}</label>
                        <input
                          type="number"
                          min="1"
                          max={setting.max}
                          value={customSettings[setting.key]}
                          onChange={(e) => handleCustomChange(setting.key, e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:border-neon-cyan focus:outline-none transition-colors duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Performance Guide */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Performance Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-white font-medium mb-2">System Requirements</h4>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Conservative: Any system</li>
                      <li>• Balanced: 8GB+ RAM, 4+ cores</li>
                      <li>• Aggressive: 16GB+ RAM, 8+ cores</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Tips</h4>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Higher limits = faster batch processing</li>
                      <li>• Too high may slow individual videos</li>
                      <li>• Stop button works instantly regardless</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Settings Display */}
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-neon-cyan/5 rounded-xl border border-neon-cyan/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Video Settings:</span>
                    <span className="text-neon-cyan text-sm">
                      Background: {videoSettings.background === 'custom' ? 'Custom' : videoSettings.background.charAt(0).toUpperCase() + videoSettings.background.slice(1)} | 
                      Quality: {videoSettings.quality === 'fullhd' ? 'Full HD (1920×1080)' : '4K Ultra (3840×2160)'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Performance:</span>
                    <span className="text-gray-300 text-sm">
                      {selectedPreset} - Small: {customSettings.small} | Medium: {customSettings.medium} | Large: {customSettings.large} | XL: {customSettings.xlarge}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPanel;