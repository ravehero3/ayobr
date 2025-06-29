import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const useAppStore = create((set, get) => ({
  // State
  pairs: [{
    id: uuidv4(),
    audio: null,
    image: null
  }],
  generatedVideos: [],
  isGenerating: false,
  isCancelling: false,
  currentProgress: 0,
  videoGenerationStates: {}, // Track generation progress for each pair

  // Actions
  addPair: (pair) => set(state => ({
    pairs: [...state.pairs, { ...pair, id: pair.id || uuidv4() }]
  })),

  updatePair: (pairId, updates) => set(state => ({
    pairs: state.pairs.map(pair => 
      pair.id === pairId ? { ...pair, ...updates } : pair
    )
  })),

  removePair: (pairId) => set(state => ({
    pairs: state.pairs.filter(pair => pair.id !== pairId)
  })),

  setPairs: (pairs) => set({ pairs }),

  clearAllPairs: () => set({
    pairs: [{
      id: uuidv4(),
      audio: null,
      image: null
    }]
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
    isCancelling: true,
    isGenerating: false
  }),
  
  resetCancellation: () => set({ isCancelling: false }),
  
  setProgress: (progress) => set({ currentProgress: progress }),

  // Video generation state management for individual pairs
  setVideoGenerationState: (pairId, state) => set(store => ({
    videoGenerationStates: {
      ...store.videoGenerationStates,
      [pairId]: state
    }
  })),

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
  }
}));
