import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Helper function to load from localStorage
const loadFromLocalStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

// Helper function to save to localStorage
const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Handle localStorage errors silently
  }
};

export const useAppStore = create((set, get) => ({
  // State
  pairs: [
    { id: uuidv4(), audio: null, image: null },
    { id: uuidv4(), audio: null, image: null }
  ],
  generatedVideos: [],
  isGenerating: false,
  isCancelling: false,
  currentProgress: 0,
  videoGenerationStates: {}, // Track generation progress for each pair
  
  // Page tracking
  currentPage: null, // null means auto-detect, otherwise explicit page
  isFilesBeingDropped: false, // Track when files are being processed
  
  // User profile
  userProfileImage: null, // Store base64 image data

  // Container spacing
  containerSpacing: 4, // Default spacing in pixels between container pairs

  // Logo settings - Load from localStorage
  logoSettings: loadFromLocalStorage('logoSettings', {
    logoFile: null, // Store the uploaded logo file as base64
    logoFileName: null, // Store the original filename
    useLogoInVideos: false // Checkbox to enable/disable logo in video generation
  }),

  // Video generation settings - Load from localStorage
  videoSettings: loadFromLocalStorage('videoSettings', {
    background: 'black', // 'white', 'black', or 'custom'
    customBackground: null, // File object for custom background
    quality: 'fullhd' // 'fullhd' or '4k'
  }),

  // Concurrency settings optimized for up to 100 files
  concurrencySettings: {
    small: 4,     // 1-10 videos
    medium: 6,    // 11-25 videos
    large: 8,     // 26-50 videos
    xlarge: 10,   // 51-75 videos
    massive: 12   // 76-100 videos
  },

  // Batch processing settings
  batchSettings: {
    maxConcurrentPairs: 100,
    chunkSize: 20,  // Process in chunks of 20
    memoryThreshold: 500 * 1024 * 1024, // 500MB memory threshold
  },

  // Actions
  addPair: (pair) => set(state => ({
    pairs: [...state.pairs, { ...pair, id: pair.id || uuidv4() }]
  })),

  updatePair: (pairId, updates) => set(state => ({
    pairs: state.pairs.map(pair => 
      pair.id === pairId ? { ...pair, ...updates } : pair
    )
  })),

  removePair: (pairId) => set(state => {
    const filteredPairs = state.pairs.filter(pair => pair.id !== pairId);

    // Clean up video generation states for the removed pair
    const newVideoGenerationStates = { ...state.videoGenerationStates };
    delete newVideoGenerationStates[pairId];

    // Remove associated generated videos
    const filteredVideos = state.generatedVideos.filter(video => video.pairId !== pairId);

    // Always ensure we have at least one empty pair after deletion
    // This allows users to continue dropping files
    if (filteredPairs.length === 0) {
      filteredPairs.push({ id: uuidv4(), audio: null, image: null });
    }

    return {
      pairs: filteredPairs,
      videoGenerationStates: newVideoGenerationStates,
      generatedVideos: filteredVideos
    };
  }),

  setPairs: (pairs) => set({ pairs }),

  clearAllPairs: () => set({
    pairs: []
  }),

  // Generated videos storage
  addGeneratedVideo: (video) => set(state => {
    console.log('Store: Adding video to generatedVideos:', video.filename);
    console.log('Store: Current video count:', state.generatedVideos.length);

    const newVideos = [...state.generatedVideos, video];
    console.log('Store: New video count:', newVideos.length);

    return {
      generatedVideos: newVideos
    };
  }),

  removeGeneratedVideo: (videoId) => set(state => ({
    generatedVideos: state.generatedVideos.filter(video => video.id !== videoId)
  })),

  setGeneratedVideos: (videos) => set({ generatedVideos: videos }),

  clearGeneratedVideos: () => set({ generatedVideos: [] }),
    removeVideo: (videoId) => set((state) => ({
      generatedVideos: state.generatedVideos.filter(video => video.id !== videoId)
    })),

  // Page management actions
  getCurrentPage: () => {
    const state = get();

    // Return explicit page if set
    if (state.currentPage) {
      return state.currentPage;
    }

    // Fallback to automatic detection with improved logic
    const hasFiles = state.pairs.some(pair => pair.audio || pair.image);
    const hasVideos = state.generatedVideos.length > 0;
    
    // Check if any pair is generating
    const isGenerating = state.isGenerating || Object.values(state.videoGenerationStates).some(genState => genState?.isGenerating);

    // Priority order: videos > generation > files > upload
    if (hasVideos && !isGenerating) {
      return 'download';
    } else if (isGenerating) {
      return 'generation';
    } else if (hasFiles) {
      return 'fileManagement';
    } else if (state.isFilesBeingDropped) {
      // Still processing files, stay on current page to avoid flickering
      return hasFiles ? 'fileManagement' : 'upload';
    } else {
      return 'upload';
    }
  },

  setIsFilesBeingDropped: (isDropping) => set({ isFilesBeingDropped: isDropping }),

  setCurrentPage: (page) => set({ currentPage: page }),

  // Force page navigation
  navigateToPage: (page) => set({ currentPage: page }),

  // Reset page state to auto-detect (useful for recovery)
  resetPageState: () => set({ currentPage: null, isFilesBeingDropped: false }),

  // Clear stuck generation states
  clearStuckGenerationStates: () => set((state) => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    const updatedStates = { ...state.videoGenerationStates };
    
    Object.keys(updatedStates).forEach(pairId => {
      const genState = updatedStates[pairId];
      if (genState.isGenerating && genState.startTime && (now - genState.startTime > timeout)) {
        console.log(`Clearing stuck generation state for pair ${pairId}`);
        updatedStates[pairId] = {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: 'Generation timed out and was reset'
        };
      }
    });
    
    return {
      ...state,
      videoGenerationStates: updatedStates
    };
  }),

  // Clear stuck generation states (fallback method)
  clearStuckGenerationStatesFallback: () => set(store => {
    const clearedStates = {};
    Object.keys(store.videoGenerationStates).forEach(pairId => {
      const state = store.videoGenerationStates[pairId];
      if (state.isGenerating && !state.isComplete && state.progress > 0) {
        clearedStates[pairId] = {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: state.video || null,
          error: null
        };
      } else {
        clearedStates[pairId] = state;
      }
    });
    return {
      videoGenerationStates: clearedStates,
      isGenerating: false
    };
  }),

  // Generation state
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setIsCancelling: (isCancelling) => set({ isCancelling }),

  cancelGeneration: () => set({ 
    isCancelling: true
  }),

  resetCancellation: () => set({ isCancelling: false }),

  setProgress: (progress) => set({ currentProgress: progress }),

  // Video generation state management for individual pairs
  setVideoGenerationState: (pairId, state) => set(store => {
    const currentState = store.videoGenerationStates[pairId];

    // Only log important state changes to reduce noise
    if (!currentState || currentState.progress !== state.progress || currentState.isComplete !== state.isComplete) {
      console.log(`Setting video generation state for pair ${pairId}:`, state);
    }

    // More careful state comparison to prevent loops
    if (currentState && 
        currentState.isGenerating === state.isGenerating &&
        currentState.progress === state.progress &&
        currentState.isComplete === state.isComplete &&
        currentState.error === state.error &&
        ((currentState.video === null && state.video === null) || 
         (currentState.video && state.video && currentState.video.id === state.video.id))) {
      return store; // No change needed
    }

    return {
      videoGenerationStates: {
        ...store.videoGenerationStates,
        [pairId]: {
          ...state,
          // Ensure we don't lose the video reference
          video: state.video || currentState?.video || null
        }
      }
    };
  }),

  getVideoGenerationState: (pairId) => {
    const { videoGenerationStates } = get();
    return videoGenerationStates[pairId] || { 
      isGenerating: false, 
      progress: 0, 
      isComplete: false, 
      video: null 
    };
  },

  // Utility actions
  getCompletePairs: () => {
    const { pairs } = get();
    return pairs.filter(pair => pair.audio && pair.image);
  },

  hasIncompleteData: () => {
    const { pairs } = get();
    return pairs.some(pair => (pair.audio && !pair.image) || (!pair.audio && pair.image));
  },

  // Settings actions
  setConcurrencySettings: (settings) => set(state => ({
    concurrencySettings: { ...state.concurrencySettings, ...settings }
  })),

  // Cleanup function for resetting app state
  resetAppState: () => set({
    isGenerating: false,
    isCancelling: false,
    currentProgress: 0,
    videoGenerationStates: {}
  }),

  // Clear all video generation states
  clearAllVideoGenerationStates: () => set({
    videoGenerationStates: {}
  }),

  // Complete reset for clean state after stopping generation
  resetGenerationState: () => set({
    isGenerating: false,
    isCancelling: false,
    currentProgress: 0,
    videoGenerationStates: {}
  }),

  // Cancel video generation
  cancelVideoGeneration: () => set({
    isGenerating: false,
    isCancelling: true,
    currentProgress: 0,
    videoGenerationStates: {}
  }),

  // User profile actions
  setUserProfileImage: (imageData) => set({ userProfileImage: imageData }),

  // Video settings actions
  setVideoBackground: (background) => set(state => ({
    videoSettings: { ...state.videoSettings, background }
  })),

  setCustomBackground: (file) => set(state => {
    const newVideoSettings = { ...state.videoSettings, customBackground: file };
    saveToLocalStorage('videoSettings', newVideoSettings);
    return { videoSettings: newVideoSettings };
  }),

  setVideoQuality: (quality) => set(state => ({
    videoSettings: { ...state.videoSettings, quality }
  })),

  // Container spacing actions
  setContainerSpacing: (spacing) => set({ containerSpacing: spacing }),

  // Logo settings actions
  setLogoFile: (file, fileName) => set(state => {
    const newLogoSettings = { 
      ...state.logoSettings, 
      logoFile: file, 
      logoFileName: fileName 
    };
    saveToLocalStorage('logoSettings', newLogoSettings);
    return { logoSettings: newLogoSettings };
  }),

  setUseLogoInVideos: (useLogoInVideos) => set(state => {
    const newLogoSettings = { 
      ...state.logoSettings, 
      useLogoInVideos 
    };
    saveToLocalStorage('logoSettings', newLogoSettings);
    return { logoSettings: newLogoSettings };
  }),

  clearLogo: () => set(state => ({
    logoSettings: { 
      ...state.logoSettings, 
      logoFile: null, 
      logoFileName: null,
      useLogoInVideos: false
    }
  }))
}));