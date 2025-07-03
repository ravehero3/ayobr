import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/appStore';
import { motion } from 'framer-motion';

const ImageContainer = ({ image, pairId, onSwap, draggedItem, onDragStart, onDragEnd, isContainerDragMode, draggedContainerType, onContainerDragStart, onContainerDragEnd, onDelete, isDraggingContainer, draggedContainer, shouldShowGlow }) => {
  const { updatePair } = useAppStore();
  const [imageUrl, setImageUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isContainerDragging, setIsContainerDragging] = useState(false);
  const [isDraggingWithMouse, setIsDraggingWithMouse] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  React.useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'image',
      pairId: pairId,
      data: image
    }));
    setIsDragging(true);
    onDragStart({ type: 'image', pairId, data: image });
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();

    // Check if this is an image drag from another container
    try {
      const types = Array.from(e.dataTransfer.types);
      if (types.includes('application/json')) {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
        if (dragData.type === 'image' && dragData.pairId !== pairId && image) {
          e.dataTransfer.dropEffect = 'move';
          setIsDragOver(true);
          return;
        }
      }
    } catch (error) {
      // Fallback to checking draggedItem state
      if (draggedItem?.type === 'image' && draggedItem.pairId !== pairId && image) {
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
        return;
      }
    }

    // Also allow file drops
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    // Handle image swapping from drag data
    try {
      const types = Array.from(e.dataTransfer.types);
      if (types.includes('application/json')) {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (dragData.type === 'image' && dragData.pairId !== pairId && image) {
          if (onSwap) {
            onSwap(dragData.pairId, pairId, 'image');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }

    // Fallback to state-based swapping
    if (draggedItem?.type === 'image' && draggedItem.pairId !== pairId && image) {
      if (onSwap) {
        onSwap(draggedItem.pairId, pairId, 'image');
      }
      return;
    }

    // Handle file drops
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      updatePair(pairId, { image: imageFile });
    }
  };

  const handleMoveButtonMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Move button mouse down for image container:', { type: 'individual-container', containerType: 'image', pairId, content: { image } });

    // Calculate offset to center the container on the cursor
    const rect = containerRef.current.getBoundingClientRect();
    const offset = {
      x: rect.width / 2,  // Half container width to center horizontally
      y: rect.height / 2  // Half container height to center vertically
    };
    setDragOffset(offset);

    // Set visual states
    setIsContainerDragging(true);
    setIsDraggingWithMouse(true);
    setMousePosition({ x: e.clientX, y: e.clientY });

    // Store drag data in sessionStorage for reliable access
    const dragData = {
      type: 'individual-container',
      containerType: 'image',
      pairId: pairId,
      content: { image }
    };
    sessionStorage.setItem('currentDragData', JSON.stringify(dragData));

    // Trigger container drag mode
    if (onContainerDragStart) {
      onContainerDragStart(pairId, 'start', { id: pairId, type: 'image', image });
    }

    // Add global mouse move and up listeners
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
      // Check if we're dropping on another image container
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const imageContainer = elementBelow?.closest('[data-image-container]');
      
      if (imageContainer) {
        const targetPairId = imageContainer.getAttribute('data-pair-id');
        if (targetPairId && targetPairId !== pairId) {
          console.log('Dropping on image container:', targetPairId);
          if (onSwap) {
            onSwap(pairId, targetPairId, 'image');
          }
        }
      }

      setIsContainerDragging(false);
      setIsDraggingWithMouse(false);
      sessionStorage.removeItem('currentDragData');
      
      // End container drag mode
      if (onContainerDragEnd) {
        onContainerDragEnd(pairId, 'end');
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Enhanced highlighting logic - show GREEN glow when:
  // 1. Another image container is being dragged (container drag mode)
  // 2. This container has image content (valid drop target)
  // 3. This is not the container being dragged
  const shouldHighlight = (isDraggingContainer && draggedContainerType === 'image' && !!image && draggedContainer?.id !== pairId) ||
    (draggedItem?.type === 'image' && draggedItem.pairId !== pairId && !!image) ||
    shouldShowGlow;

  // Check if this is the currently dragged container
  const isBeingDragged = (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId) ||
    (draggedItem?.type === 'image' && draggedItem.pairId === pairId);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(`${img.width}x${img.height}`);
      img.onerror = () => resolve('Unknown');
      img.src = URL.createObjectURL(file);
    });
  };

  const [imageDimensions, setImageDimensions] = React.useState('');

  React.useEffect(() => {
    if (image) {
      getImageDimensions(image).then(setImageDimensions);
    }
  }, [image]);

  // Mouse tracking for drag visualization
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDragPosition({ 
          x: e.clientX - rect.width / 2, 
          y: e.clientY - rect.height / 2 
        });
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, isContainerDragging]);

  const handleContainerDragOver = (e) => {
    // Allow container dropping when in container drag mode or when dragging images
    if ((isContainerDragMode && draggedContainerType === 'image') || 
        (draggedItem?.type === 'image' && draggedItem.pairId !== pairId)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleContainerDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('ImageContainer drop detected', {
      isDraggingContainer,
      draggedContainerType,
      draggedContainerId: draggedContainer?.id,
      currentPairId: pairId,
      hasImage: !!image
    });

    // First try to handle drag data from the drop event
    try {
      const dragDataString = e.dataTransfer.getData('application/json');
      let dragData = null;
      
      if (dragDataString) {
        dragData = JSON.parse(dragDataString);
      } else {
        // Fallback to sessionStorage
        const storedData = sessionStorage.getItem('currentDragData');
        if (storedData) {
          dragData = JSON.parse(storedData);
        }
      }

      if (dragData && dragData.type === 'individual-container' && dragData.containerType === 'image' && dragData.pairId !== pairId && image) {
        console.log('Executing image container swap via drag data:', dragData.pairId, '->', pairId);

        if (onSwap) {
          onSwap(dragData.pairId, pairId, 'image');
        }

        // End the container drag mode
        if (onContainerDragEnd) {
          onContainerDragEnd('image', 'end');
        }
        return;
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }

    // Handle container swapping when dropping on this image container
    if (isDraggingContainer && draggedContainerType === 'image' && draggedContainer && draggedContainer.id !== pairId && image) {
      console.log('Executing image container swap:', draggedContainer.id, '->', pairId);

      if (onSwap) {
        onSwap(draggedContainer.id, pairId, 'image');
      }

      // End the container drag mode
      if (onContainerDragEnd) {
        onContainerDragEnd('image', 'end');
      }
      return;
    }

    // Handle regular image file dropping from main container drag
    if (draggedItem?.type === 'image' && draggedItem.pairId !== pairId) {
      console.log('Regular image drag detected, triggering swap');
      if (onSwap) {
        onSwap(draggedItem.pairId, pairId, 'image');
      }
    }
  };

  return (
    <>
      {/* Enhanced Floating Drag Preview with Portal - appears when mouse dragging */}
      {isDraggingWithMouse && isContainerDragging && image && createPortal(
        <div
          className="green-box-drag-preview"
          style={{
            position: 'fixed',
            left: `${mousePosition.x - 250}px`, // Center horizontally (500px / 2 = 250px)
            top: `${mousePosition.y - 90}px`,   // Center vertically (180px / 2 = 90px)
            width: '500px',
            height: '180px',
            transform: 'none', // No tilt, no scale - exact copy
            zIndex: 999999999,
            pointerEvents: 'none',
            // Make it look exactly like the original container but with green glow and green background
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)', // Green background
            borderRadius: '8px',
            border: '3px solid rgba(16, 185, 129, 0.8)', // Green border
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)',
            padding: '16px',
            opacity: 0.95,
            isolation: 'isolate',
            willChange: 'transform',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
            contain: 'layout style paint'
          }}
        >
          <div className="w-full h-full flex flex-col relative">
            {/* Image preview - centered vertically with better spacing - exact copy */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative overflow-hidden rounded flex-shrink-0" style={{ transform: 'scale(1.8)' }}>
                <img
                  src={imageUrl}
                  alt={image.name}
                  className="w-20 h-20 object-contain"
                  style={{
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    // Keep original image appearance without green tint
                  }}
                />
              </div>
            </div>

            {/* Move button - positioned below image preview - exact copy with green tint */}
            <div className="flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: '#10B981'
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </div>
            </div>

            {/* Delete button - positioned at top right - exact copy */}
            <button
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center z-10"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#DC2626'
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Empty space placeholder when container is being dragged with mouse */}
      {isDraggingWithMouse && isContainerDragging ? (
        <div
          style={{
            width: '100%',
            height: '180px',
            minHeight: '180px',
            border: '2px dashed rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            background: 'rgba(10, 15, 28, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(16, 185, 129, 0.6)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Image container being moved...
        </div>
      ) : (
        <div 
          className="relative"
          style={{
            minHeight: isContainerDragging ? '220px' : '180px', // Reserve space when container is lifted
            transition: 'min-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          <motion.div
            ref={containerRef}
            className="relative w-full h-full transition-all duration-300 group cursor-pointer image-container"
            data-pair-id={pairId}
            data-image-container="true"
            draggable={!!image}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              handleDragOver(e);
              handleContainerDragOver(e);
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              handleDrop(e);
              handleContainerDrop(e);
            }}
            whileHover={{ scale: image ? 1.005 : 1 }}
            title={image ? `${image.name} • ${imageDimensions} • ${formatFileSize(image.size)}` : undefined}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              background: shouldHighlight && image
                ? 'rgba(16, 185, 129, 0.15)' // Green background when highlighted
                : image ? 'rgba(15, 23, 42, 0.6)' : '#040608', // Dark theme adapted
              borderRadius: '8px',
              border: isDragOver 
                ? '3px solid rgba(34, 197, 94, 0.8)' // Stronger green border when valid drop target
                : shouldHighlight
                ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when another image container is being dragged
                : (isContainerDragMode && draggedContainerType === 'image')
                ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when container drag mode is active for images
                : image ? '1px solid rgba(53, 132, 228, 0.3)' : '1.5px solid rgba(30, 144, 255, 0.3)',
              boxShadow: isDragging
                ? '0 0 0 4px rgba(59, 130, 246, 1), 0 0 50px rgba(59, 130, 246, 0.8), 0 30px 80px rgba(0, 0, 0, 0.6)'
                : isDragOver
                ? '0 0 0 2px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)'
                : shouldHighlight
                ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
                : (isContainerDragMode && draggedContainerType === 'image')
                ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
                : image 
                  ? '0 0 0 1px rgba(53, 132, 228, 0.2), 0 0 20px rgba(53, 132, 228, 0.1)'
                  : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `,
              padding: image ? '16px' : '20px',
              height: '180px',
              minHeight: '180px',
              maxHeight: '180px',
              position: isDraggingWithMouse && isContainerDragging ? 'fixed' : 'relative',
              left: isDraggingWithMouse && isContainerDragging ? `${mousePosition.x - dragOffset.x}px` : 'auto',
              top: isDraggingWithMouse && isContainerDragging ? `${mousePosition.y - dragOffset.y}px` : 'auto',
              transform: isDraggingWithMouse && isContainerDragging
                ? 'rotate(10deg) scale(1.1)'
                : (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId)
                ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.2) rotate(5deg)`
                : isDragging 
                ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.15) rotate(3deg)`
                : isDragOver 
                ? 'scale(1.02)' 
                : shouldHighlight
                ? 'scale(1.05) translateY(-2px)' // Lift effect when highlighted
                : 'scale(1)',
              opacity: isContainerDragging 
                ? 0.95
                : (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId)
                ? 0.9
                : isDragging ? 0.9 : 1,
              transition: (isDragging || (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId))
                ? 'none' 
                : 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', // Smoother transition for the lift effect
              zIndex: isDraggingWithMouse && isContainerDragging
                ? 99999 // Maximum z-index when dragging with mouse to appear above everything globally
                : isContainerDragging
                ? 50000 // Very high z-index when lifted
                : (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId)
                ? 1500
                : isDragging ? 1000 : shouldHighlight ? 100 : 1,
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            {/* Drag and Drop Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <p className="text-green-400 font-semibold text-sm">Drop to Swap Image</p>
                </div>
              </div>
            )}

            {image ? (
              <div className="w-full h-full flex flex-col relative">
                {/* Image preview - perfectly centered with equal spacing */}
                <div className="flex-1 flex items-center justify-center py-4">
                  <div className="relative overflow-hidden rounded flex-shrink-0" style={{ transform: 'scale(1.8)' }}>
                    <img
                      src={imageUrl}
                      alt={image.name}
                      className="w-20 h-20 object-contain"
                      style={{
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Move button - positioned with proper spacing from bottom */}
                <div className="flex items-center justify-center pb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 opacity-60 hover:opacity-100 z-10 cursor-move"
                    style={{
                      backgroundColor: (isContainerDragMode && draggedContainerType === 'image') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(53, 132, 228, 0.15)',
                      border: (isContainerDragMode && draggedContainerType === 'image') ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(53, 132, 228, 0.3)',
                      color: (isContainerDragMode && draggedContainerType === 'image') ? '#10B981' : '#3584E4'
                    }}
                    title="Drag to move image container"
                    draggable="true"
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = 'move';
                      const dragData = {
                        type: 'individual-container',
                        containerType: 'image',
                        pairId: pairId,
                        content: image
                      };
                      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));

                      // Also store in sessionStorage for reliable access
                      sessionStorage.setItem('currentDragData', JSON.stringify(dragData));

                      console.log('Move button drag started:', dragData);

                      // Set local dragging state for visual feedback
                      setIsDragging(true);

                      // Trigger the container drag system for cursor following
                      if (onContainerDragStart) {
                        onContainerDragStart('image', 'start', { 
                          id: pairId, 
                          type: 'image',
                          content: image,
                          image: image // Include the image file for proper container type detection
                        });
                      }
                    }}
                    onDragEnd={(e) => {
                      // Reset local dragging state
                      setIsDragging(false);

                      if (onContainerDragEnd) {
                        onContainerDragEnd('image', 'end');
                      }
                    }}
                    onMouseDown={handleMoveButtonMouseDown}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                  </div>
                </div>

                {/* Delete button - positioned at top right */}
                <button
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-60 hover:opacity-100 z-10"
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.15)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    color: '#DC2626'
                  }}
                  title="Delete image"
                  onClick={() => {
                    if (onDelete) {
                      onDelete();
                    }
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <div 
                  className="p-4 rounded-full mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <svg className="w-8 h-8 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-300 mb-1 text-center">Drop image file here</p>
                <p className="text-xs text-gray-500 font-light text-center">PNG, JPG, HEIC</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ImageContainer;