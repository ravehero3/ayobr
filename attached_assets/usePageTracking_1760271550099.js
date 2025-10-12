
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export const usePageTracking = () => {
  const [userFocus, setUserFocus] = useState('upload');
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const { pairs, generatedVideos, isGenerating, setCurrentPage } = useAppStore();

  // Track user scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      setLastInteraction(Date.now());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track user mouse movement and clicks
  useEffect(() => {
    const handleUserActivity = (event) => {
      setLastInteraction(Date.now());
      
      // Detect which section user is interacting with
      const target = event.target.closest('[data-page-section]');
      if (target) {
        const section = target.getAttribute('data-page-section');
        setUserFocus(section);
      }
    };

    document.addEventListener('click', handleUserActivity);
    document.addEventListener('mousemove', handleUserActivity);
    
    return () => {
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('mousemove', handleUserActivity);
    };
  }, []);

  // Intelligent page detection based on user context
  const detectCurrentPage = useCallback(() => {
    const hasFiles = pairs.some(pair => pair.audio || pair.image);
    const hasVideos = generatedVideos.length > 0;
    
    // If user is actively interacting with a specific section, respect that
    if (Date.now() - lastInteraction < 3000) { // 3 seconds of recent activity
      if (userFocus && ['upload', 'fileManagement', 'generation', 'download'].includes(userFocus)) {
        return userFocus;
      }
    }

    // Fallback to state-based detection
    if (hasVideos && !isGenerating) {
      return 'download';
    } else if (isGenerating) {
      return 'generation';
    } else if (hasFiles) {
      return 'fileManagement';
    } else {
      return 'upload';
    }
  }, [pairs, generatedVideos, isGenerating, userFocus, lastInteraction]);

  // Update the store with detected page
  useEffect(() => {
    const detectedPage = detectCurrentPage();
    setCurrentPage(detectedPage);
  }, [detectCurrentPage, setCurrentPage]);

  return {
    currentPage: detectCurrentPage(),
    userFocus,
    lastInteraction,
    scrollPosition,
    setUserFocus
  };
};
