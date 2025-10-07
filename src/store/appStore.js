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
  
  // Pair preparation state (new optimization feature)
  pairPreparationStates: {}, // Track preparation status for each pair: { pairId: { status, progress, error } }
  preparedAssets: {}, // Cache prepared data for each pair: { pairId: { audioBuffer, imageBuffer, audioDuration, etc } }
  displayIndices: {}, // Stable display numbers for containers: { pairId: displayIndex }
  nextDisplayIndex: 1, // Counter for assigning display indices
  preparationQueue: [], // Queue of pair IDs waiting to be prepared
  isPreparingPairs: false, // Flag to track if preparation is in progress
  
  // Page tracking
  currentPage: null, // null means auto-detect, otherwise explicit page
  isFilesBeingDropped: false, // Track when files are being processed
  
  // Navigation state machine
  navigation: {
    current: null, // Current page override (null means use auto-detection)
    stack: [], // Navigation history (max 5 entries)
    intent: null, // User intent: null | 'reset' | 'back'
    mode: 'auto' // 'auto' | 'manual' - determines if we use auto-detection or manual navigation
  },
  
  // User profile
  userProfileImage: null, // Store base64 image data
  username: loadFromLocalStorage('username', 'Producer'), // Store username with persistence

  // Container spacing
  containerSpacing: 4, // Default spacing in pixels between container pairs



  // Video generation settings - Load from localStorage
  videoSettings: loadFromLocalStorage('videoSettings', {
    background: 'black', // 'white', 'black', or 'custom'
    customBackground: null, // Base64 string for custom background
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

    // Clean up preparation states for the removed pair
    const newPairPreparationStates = { ...state.pairPreparationStates };
    delete newPairPreparationStates[pairId];

    const newPreparedAssets = { ...state.preparedAssets };
    delete newPreparedAssets[pairId];

    const newDisplayIndices = { ...state.displayIndices };
    delete newDisplayIndices[pairId];

    // Remove from preparation queue
    const newPreparationQueue = state.preparationQueue.filter(id => id !== pairId);

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
      pairPreparationStates: newPairPreparationStates,
      preparedAssets: newPreparedAssets,
      displayIndices: newDisplayIndices,
      preparationQueue: newPreparationQueue,
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

    // More robust completion detection
    const hasCompletedVideos = hasVideos || Object.values(state.videoGenerationStates).some(
      genState => genState?.isComplete
    );

    // Check if all videos have reached 100% progress (even without video object)
    const allVideosAt100Percent = Object.values(state.videoGenerationStates).length > 0 && 
      Object.values(state.videoGenerationStates).every(genState => 
        genState && (genState.progress === 100 || genState.isComplete)
      );

    console.log('Page detection debug:', {
      hasFiles,
      hasVideos,
      isGenerating,
      hasCompletedVideos,
      allVideosAt100Percent,
      videoStatesCount: Object.keys(state.videoGenerationStates).length,
      generatedVideosCount: state.generatedVideos.length
    });

    // Priority order: generation (including completed) > files > upload
    // Stay on generation page when videos are complete (no more download page)
    if (isGenerating || hasCompletedVideos || allVideosAt100Percent) {
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

  // Navigation state machine actions
  navigateTo: (page, options = {}) => set(state => {
    const { mode = 'manual', pushToHistory = true } = options;
    const newStack = pushToHistory && state.navigation.current 
      ? [...state.navigation.stack, state.navigation.current].slice(-5) // Keep last 5 entries
      : state.navigation.stack;
    
    return {
      navigation: {
        ...state.navigation,
        current: page,
        stack: newStack,
        mode
      }
    };
  }),

  pushPage: (page) => set(state => ({
    navigation: {
      ...state.navigation,
      current: page,
      stack: [...state.navigation.stack, state.navigation.current || 'upload'].slice(-5),
      mode: 'manual'
    }
  })),

  popPage: (defaultPage = 'fileManagement') => set(state => {
    const stack = [...state.navigation.stack];
    const previousPage = stack.pop() || defaultPage;
    
    return {
      navigation: {
        ...state.navigation,
        current: previousPage,
        stack,
        mode: 'manual',
        intent: 'back'
      }
    };
  }),

  setNavigationIntent: (intent) => set(state => ({
    navigation: {
      ...state.navigation,
      intent
    }
  })),

  ensureAutoNavigation: () => set(state => ({
    navigation: {
      ...state.navigation,
      mode: 'auto',
      intent: null
    }
  })),

  // Get current page respecting navigation mode
  selectCurrentPage: () => {
    const state = get();
    
    // If in manual mode, use the explicit navigation current page
    if (state.navigation.mode === 'manual' && state.navigation.current) {
      return state.navigation.current;
    }
    
    // Otherwise fall back to auto-detection
    return state.getCurrentPage();
  },

  // Clear stuck generation states
  clearStuckGenerationStates: () => set((state) => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    const updatedStates = { ...state.videoGenerationStates };
    let hasChanges = false;
    
    Object.keys(updatedStates).forEach(pairId => {
      const genState = updatedStates[pairId];
      
      // Clear stuck generation states (long running)
      if (genState.isGenerating && genState.startTime && (now - genState.startTime > timeout)) {
        console.log(`Clearing stuck generation state for pair ${pairId} (timeout)`);
        updatedStates[pairId] = {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: 'Generation timed out and was reset'
        };
        hasChanges = true;
      }
      
      // Clear broken completion states (marked complete but no video in store)
      if (genState.isComplete && genState.progress === 100 && genState.video === null) {
        const existingVideo = state.generatedVideos.find(v => v.pairId === pairId);
        if (!existingVideo) {
          console.log(`Clearing broken completion state for pair ${pairId} (no video in store)`);
          updatedStates[pairId] = {
            isGenerating: false,
            progress: 0,
            isComplete: false,
            video: null,
            error: null
          };
          hasChanges = true;
        }
      }
    });
    
    return hasChanges ? {
      ...state,
      videoGenerationStates: updatedStates
    } : state;
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

  // Complete app reset - fresh start (for X button)
  resetApp: () => {
    console.log('Complete app reset initiated');
    
    // Signal cancellation first (FFmpeg hook will handle actual process termination)
    const state = get();
    if (state.isGenerating) {
      console.log('App reset: Signaling generation cancellation');
      set({ isCancelling: true });
    }
    
    // Create fresh pair IDs
    const freshPairs = [
      { id: uuidv4(), audio: null, image: null },
      { id: uuidv4(), audio: null, image: null }
    ];
    
    return set({
      // Reset all pairs and videos
      pairs: freshPairs,
      generatedVideos: [],
      
      // Reset generation state
      isGenerating: false,
      isCancelling: false,
      currentProgress: 0,
      videoGenerationStates: {},
      
      // Reset preparation state
      pairPreparationStates: {},
      preparedAssets: {},
      displayIndices: {},
      nextDisplayIndex: 1,
      preparationQueue: [],
      isPreparingPairs: false,
      
      // Reset page tracking
      currentPage: null,
      isFilesBeingDropped: false,
      
      // Reset navigation to auto mode on upload page
      navigation: {
        current: null,
        stack: [],
        intent: 'reset',
        mode: 'auto'
      }
    });
  },

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
  
  setUsername: (username) => {
    saveToLocalStorage('username', username);
    set({ username });
  },

  // Video settings actions
  setVideoBackground: (background) => set(state => {
    const newVideoSettings = { ...state.videoSettings, background };
    saveToLocalStorage('videoSettings', newVideoSettings);
    return { videoSettings: newVideoSettings };
  }),

  setCustomBackground: (file) => set(state => {
    const newVideoSettings = { ...state.videoSettings, customBackground: file };
    saveToLocalStorage('videoSettings', newVideoSettings);
    return { videoSettings: newVideoSettings };
  }),

  setVideoQuality: (quality) => set(state => {
    const newVideoSettings = { ...state.videoSettings, quality };
    saveToLocalStorage('videoSettings', newVideoSettings);
    return { videoSettings: newVideoSettings };
  }),

  // Container spacing actions
  setContainerSpacing: (spacing) => set({ containerSpacing: spacing }),

  // Pair preparation actions
  getDisplayIndex: (pairId) => {
    const { displayIndices } = get();
    return displayIndices[pairId] || null;
  },

  assignDisplayIndex: (pairId) => set(state => {
    // If already has an index, return unchanged
    if (state.displayIndices[pairId]) {
      return state;
    }
    
    return {
      displayIndices: {
        ...state.displayIndices,
        [pairId]: state.nextDisplayIndex
      },
      nextDisplayIndex: state.nextDisplayIndex + 1
    };
  }),

  reassignDisplayIndices: () => set(state => {
    const newIndices = {};
    let counter = 1;
    
    state.pairs.forEach(pair => {
      newIndices[pair.id] = counter++;
    });
    
    return {
      displayIndices: newIndices,
      nextDisplayIndex: counter
    };
  }),

  setPairPreparationState: (pairId, preparationState) => set(state => ({
    pairPreparationStates: {
      ...state.pairPreparationStates,
      [pairId]: {
        ...state.pairPreparationStates[pairId],
        ...preparationState
      }
    }
  })),

  getPairPreparationState: (pairId) => {
    const { pairPreparationStates } = get();
    return pairPreparationStates[pairId] || { status: 'idle', progress: 0, error: null };
  },

  setPreparedAssets: (pairId, assets) => set(state => ({
    preparedAssets: {
      ...state.preparedAssets,
      [pairId]: assets
    }
  })),

  getPreparedAssets: (pairId) => {
    const { preparedAssets } = get();
    return preparedAssets[pairId] || null;
  },

  clearPreparedAssets: (pairId) => set(state => {
    const newPreparedAssets = { ...state.preparedAssets };
    delete newPreparedAssets[pairId];
    
    // Also clear the preparation state to ensure consistency
    const newPairPreparationStates = { ...state.pairPreparationStates };
    delete newPairPreparationStates[pairId];
    
    console.log(`Cleared prepared assets and preparation state for pair ${pairId}`);
    
    return { 
      preparedAssets: newPreparedAssets,
      pairPreparationStates: newPairPreparationStates
    };
  }),

  clearAllPreparedAssets: () => {
    console.log('Clearing all prepared assets and preparation states');
    return set({
      preparedAssets: {},
      pairPreparationStates: {},
      preparationQueue: []
    });
  },

  addToPreparationQueue: (pairId) => set(state => {
    if (state.preparationQueue.includes(pairId)) {
      return state;
    }
    return {
      preparationQueue: [...state.preparationQueue, pairId]
    };
  }),

  removeFromPreparationQueue: (pairId) => set(state => ({
    preparationQueue: state.preparationQueue.filter(id => id !== pairId)
  })),

  setIsPreparingPairs: (isPreparing) => set({ isPreparingPairs: isPreparing }),

  // Get total memory usage of prepared assets
  getPreparationMemoryUsage: () => {
    const { preparedAssets } = get();
    let totalBytes = 0;
    
    Object.values(preparedAssets).forEach(asset => {
      if (asset.audioBuffer) totalBytes += asset.audioBuffer.byteLength;
      if (asset.imageBuffer) totalBytes += asset.imageBuffer.byteLength;
      if (asset.backgroundBuffer) totalBytes += asset.backgroundBuffer.byteLength;
    });
    
    return totalBytes;
  },

  // Get preparation statistics
  getPreparationStats: () => {
    const { pairs, pairPreparationStates } = get();
    const completePairs = pairs.filter(p => p.audio && p.image);
    const preparedCount = Object.values(pairPreparationStates).filter(s => s.status === 'ready').length;
    const preparingCount = Object.values(pairPreparationStates).filter(s => s.status === 'preparing').length;
    const failedCount = Object.values(pairPreparationStates).filter(s => s.status === 'failed').length;
    
    return {
      total: completePairs.length,
      prepared: preparedCount,
      preparing: preparingCount,
      failed: failedCount,
      pending: completePairs.length - preparedCount - preparingCount - failedCount
    };
  },

}));