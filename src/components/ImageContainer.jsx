import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { motion } from 'framer-motion';

const ImageContainer = ({ image, pairId, onSwap, draggedItem, onDragStart, onDragEnd, isContainerDragMode, draggedContainerType, onContainerDragStart, onContainerDragEnd, onDelete, isDraggingContainer, draggedContainer, shouldShowGlow }) => {
  const { updatePair } = useAppStore();
  const [imageUrl, setImageUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isContainerDragging, setIsContainerDragging] = useState(false);
  const [containerDragPosition, setContainerDragPosition] = useState({ x: 0, y: 0 });
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

  const handleDelete = () => {
    updatePair(pairId, { image: null });
  };

  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isDraggingWithMouse, setIsDraggingWithMouse] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  const handleMoveButtonMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Move button mouse down:', { type: 'individual-container', containerType: 'image', pairId, content: { image } });

    // Calculate offset from container center
    const rect = containerRef.current.getBoundingClientRect();
    const offset = {
      x: e.clientX - (rect.left + rect.width / 2),
      y: e.clientY - (rect.top + rect.height / 2)
    };
    setDragOffset(offset);

    // Set visual states
    setIsContainerDragging(true);
    setIsDraggingWithMouse(true);
    setMousePosition({ x: e.clientX, y: e.clientY });

    // Add global mouse move and up listeners
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsContainerDragging(false);
      setIsDraggingWithMouse(false);
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
      if (isContainerDragging) {
        setContainerDragPosition({ 
          x: e.clientX - 250, // Half the container width
          y: e.clientY - 90   // Half the container height
        });
      }
    };

    if (isDragging || isContainerDragging) {
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

  // Reset container dragging state when clicking elsewhere
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (isContainerDragging && containerRef.current && !containerRef.current.contains(e.target)) {
        setIsContainerDragging(false);
      }
    };

    if (isContainerDragging) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isContainerDragging]);

  return (
    <>
      {/* Floating drag preview */}
      {isContainerDragging && image && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: containerDragPosition.x,
            top: containerDragPosition.y,
            width: '500px',
            height: '180px',
            transform: 'scale(1.1) rotate(5deg)',
            opacity: 0.9
          }}
        >
          <div
            className="w-full h-full rounded-2xl border-4 border-blue-400 shadow-2xl backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
              boxShadow: `
                0 0 0 4px rgba(59, 130, 246, 1),
                0 0 50px rgba(59, 130, 246, 0.8),
                0 30px 80px rgba(0, 0, 0, 0.6)
              `,
              padding: '20px'
            }}
          >
            <img
              src={imageUrl}
              alt={image.name}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <div 
        className="relative"
        style={{
          minHeight: isContainerDragging ? '260px' : '180px', // Reserve space when container is lifted
          transition: 'min-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <motion.div
          ref={containerRef}
          className="relative rounded-2xl transition-all duration-300 group cursor-pointer"
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
          whileHover={{ scale: image ? 1.01 : 1 }}
          title={image ? `${image.name} • ${imageDimensions} • ${formatFileSize(image.size)}` : undefined}
      style={image ? {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        backdropFilter: 'blur(8px)',
        background: shouldHighlight 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        border: isDragOver 
          ? '3px solid rgba(34, 197, 94, 0.8)' 
          : shouldHighlight
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when another image container is being dragged
          : (isContainerDragMode && draggedContainerType === 'image')
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when container drag mode is active for images
          : '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: isDragging
          ? '0 0 0 3px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6), 0 20px 60px rgba(0, 0, 0, 0.4)'
          : isDragOver
          ? '0 0 0 2px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)'
          : shouldHighlight
          ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
          : (isContainerDragMode && draggedContainerType === 'image')
          ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
          : '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        padding: '20px',
        height: '180px',
        minHeight: '180px',
        maxHeight: '180px',
        transform: isDraggingWithMouse && isContainerDragging
          ? `translate(${mousePosition.x - window.innerWidth/2}px, ${mousePosition.y - window.innerHeight/2}px) rotate(10deg) scale(1.1)`
          : isContainerDragging
          ? 'translateY(-80px) translateX(50px) rotate(10deg) scale(1.1)' // Move up and right, tilt 10 degrees when move button clicked
          : (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId)
          ? `translate(${containerDragPosition.x}px, ${containerDragPosition.y}px) scale(1.2) rotate(5deg)`
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
        zIndex: isContainerDragging
          ? 2000 // Higher z-index when lifted
          : (isDraggingContainer && draggedContainerType === 'image' && draggedContainer?.id === pairId)
          ? 1500 
          : isDragging ? 1000 : shouldHighlight ? 100 : 1,
        pointerEvents: 'auto',
        userSelect: 'none'
      } : {
        background: '#040608', // Darker matte black container fill
        backgroundColor: '#080C14', // Darker navy background
        backdropFilter: 'blur(4px)',
        border: isDragOver
          ? '2px solid rgba(34, 197, 94, 0.6)'
          : shouldHighlight
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when another image container is being dragged
          : (isContainerDragMode && draggedContainerType === 'image')
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow for empty image containers too
          : '1.5px solid rgba(30, 144, 255, 0.3)',
        boxShadow: isDragOver
          ? '0 0 0 1px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3)'
          : shouldHighlight
          ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
          : (isContainerDragMode && draggedContainerType === 'image')
          ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
          : `
          0 0 0 1px rgba(30, 144, 255, 0.15),
          0 0 8px rgba(30, 144, 255, 0.2),
          0 0 15px rgba(0, 207, 255, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.02)
        `,
        borderRadius: '14px',
        padding: '20px',
        height: '180px',
        minHeight: '180px',
        maxHeight: '180px',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease-in-out',
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
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          

          {/* Delete button - positioned at bottom right */}
          <button
            className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-60 hover:opacity-100 z-10"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#DC2626'
            }}
            title="Delete image"
            onClick={() => {
              handleDelete();
              if (onDelete) {
                onDelete();
              }
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full container image */}
          <img
            src={imageUrl}
            alt={image.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback for HEIC files that might not display
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full items-center justify-center bg-gray-800/50">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-400">Image Preview</p>
              <p className="text-xs text-gray-500">{image.name.split('.').pop()?.toUpperCase()}</p>
            </div>
          </div>

          {/* Move button - positioned at bottom left */}
          <div
            className="absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 opacity-60 hover:opacity-100 z-10 cursor-move"
            style={{
              backgroundColor: (isContainerDragMode && draggedContainerType === 'image') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(53, 132, 228, 0.15)',
              border: (isContainerDragMode && draggedContainerType === 'image') ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(53, 132, 228, 0.3)',
              color: (isContainerDragMode && draggedContainerType === 'image') ? '#10B981' : '#3584E4'
            }}
            title="Drag to move image container"
            onMouseDown={handleMoveButtonMouseDown}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </div>

          {/* Hover overlay with filename */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-6 h-6 mx-auto text-neon-cyan mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-white text-sm font-medium truncate max-w-32">
                {image.name}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
          <div className="w-16 h-16 mb-4 bg-gray-500/10 rounded-full flex items-center justify-center border-2 border-dashed border-gray-500/30">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Empty Image Container</p>
          <p className="text-gray-600 text-xs">Drop an image here</p>
        </div>
      )}
      </motion.div>
      </div>
    </>
  );
};

export default ImageContainer;