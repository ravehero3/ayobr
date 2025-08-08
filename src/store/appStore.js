import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

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
  isModalOpen: false, // Track when modal is open for background blur

  // Container spacing
  containerSpacing: 4, // Default spacing in pixels between container pairs

  // Video generation settings
  videoSettings: {
    background: 'black', // 'white', 'black', or 'custom'
    customBackground: null, // File object for custom background
    quality: 'fullhd' // 'fullhd' or '4k'
  },

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

    // Priority order: videos > generation > files > upload
    if (hasVideos && !state.isGenerating) {
      return 'download';
    } else if (state.isGenerating) {
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

    console.log(`Setting video generation state for pair ${pairId}:`, state);
    console.log(`Current state:`, currentState);

    // Prevent unnecessary state updates that could trigger re-renders
    if (currentState && 
        currentState.isGenerating === state.isGenerating &&
        currentState.progress === state.progress &&
        currentState.isComplete === state.isComplete) {
      return store; // No change needed
    }

    return {
      videoGenerationStates: {
        ...store.videoGenerationStates,
        [pairId]: state
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
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

  // Video settings actions
  setVideoBackground: (background) => set(state => ({
    videoSettings: { ...state.videoSettings, background }
  })),

  setCustomBackground: (file) => set(state => ({
    videoSettings: { ...state.videoSettings, customBackground: file }
  })),

  setVideoQuality: (quality) => set(state => ({
    videoSettings: { ...state.videoSettings, quality }
  })),

  // Container spacing actions
  setContainerSpacing: (spacing) => set({ containerSpacing: spacing })
}));