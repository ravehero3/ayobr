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

  // Generated videos
  addGeneratedVideo: (video) => set(state => ({
    generatedVideos: [...state.generatedVideos, video]
  })),

  removeGeneratedVideo: (videoId) => set(state => ({
    generatedVideos: state.generatedVideos.filter(video => video.id !== videoId)
  })),

  setGeneratedVideos: (videos) => set({ generatedVideos: videos }),

  clearGeneratedVideos: () => set({ generatedVideos: [] }),

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
  })
}));