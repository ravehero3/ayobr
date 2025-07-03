
import { create } from 'zustand';

// Global store for managing video playback
const useVideoPlaybackStore = create((set, get) => ({
  currentlyPlayingId: null,
  
  setCurrentlyPlaying: (videoId) => {
    set({ currentlyPlayingId: videoId });
  },
  
  pauseAll: () => {
    set({ currentlyPlayingId: null });
  },
  
  isPlaying: (videoId) => {
    const { currentlyPlayingId } = get();
    return currentlyPlayingId === videoId;
  }
}));

export const useVideoPlayback = () => {
  const store = useVideoPlaybackStore();
  
  return {
    currentlyPlayingId: store.currentlyPlayingId,
    setCurrentlyPlaying: store.setCurrentlyPlaying,
    pauseAll: store.pauseAll,
    isPlaying: store.isPlaying
  };
};
