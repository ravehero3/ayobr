# Type Beat Video Generator

## Overview

The Type Beat Video Generator is a desktop application built for music producers to create type beat videos by pairing audio files (MP3/WAV) with images (PNG/JPG). The app features a futuristic dark theme with neon accents and provides an intuitive drag-and-drop interface for file management and video generation.

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.0 with modern hooks and functional components
- **Styling**: TailwindCSS 4.1.11 with custom space/neon theme configuration
- **Animations**: Framer Motion 12.19.2 for smooth UI transitions and effects
- **State Management**: Zustand 5.0.6 for lightweight, centralized state management
- **Build System**: Webpack 5.99.9 with Babel transpilation for modern JavaScript features

### Desktop Application Framework
- **Platform**: Electron 37.1.0 for cross-platform desktop deployment
- **Architecture**: Main process handles system interactions, renderer process runs React app
- **Security**: Context isolation enabled with secure IPC communication via preload scripts
- **Window Management**: Hidden title bar with custom styling, optimized for wide desktop displays (1800x1000 default, 1600x900 minimum)

### Media Processing
- **Video Generation**: FFmpeg.wasm 0.12.15 for client-side video processing
- **Audio Analysis**: WaveSurfer.js 7.9.9 for waveform visualization and audio controls
- **File Handling**: Native File API with drag-and-drop support

## Key Components

### State Management (Zustand Store)
- **Pairs Management**: Tracks audio-image pairs with unique IDs
- **Video Generation**: Manages generated video metadata and progress tracking
- **UI State**: Controls loading states and user interactions

### File Processing Pipeline
- **Validation**: Separate utilities for audio and image file validation
- **Pairing Logic**: Automatic pairing of dropped files with empty slot filling
- **Media Processing**: FFmpeg-based video generation with progress callbacks

### UI Components Structure
- **Pair Containers**: Modular containers for audio-image pairs
- **Drag & Drop Zones**: Visual feedback for file upload areas
- **Progress Tracking**: Real-time progress indication during video generation
- **Generated Videos**: Preview and management of output videos

## Data Flow

1. **File Input**: Users drag audio/image files into the application
2. **Validation**: Files are validated for correct format and type
3. **Pairing**: Automatic pairing logic creates audio-image combinations
4. **Preview**: Users can preview waveforms and images before processing
5. **Processing**: FFmpeg processes pairs into MP4 videos with progress tracking
6. **Output**: Generated videos are available for preview and export

## External Dependencies

### Core Libraries
- **@ffmpeg/ffmpeg**: Client-side video processing engine
- **@ffmpeg/util**: Utilities for FFmpeg operations
- **wavesurfer.js**: Audio waveform visualization and playback
- **framer-motion**: Animation and transition library
- **uuid**: Unique identifier generation for pairs and videos

### Development Tools
- **Webpack**: Module bundling with development server
- **Babel**: JavaScript transpilation for modern syntax support
- **PostCSS**: CSS processing with Autoprefixer and TailwindCSS
- **Electron**: Desktop application wrapper and native system access

### File Processing
- **File Validation**: MIME type and extension checking for audio/image files
- **Array Buffer Processing**: Binary file data handling for FFmpeg
- **Blob URL Management**: Memory-efficient file preview and download

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Webpack dev server on port 5000 for development
- **Debug Tools**: Chrome DevTools integration for debugging
- **Source Maps**: Full source mapping for development debugging

### Production Build
- **Bundle Generation**: Webpack creates optimized production bundle
- **Electron Packaging**: Main process loads bundled HTML file
- **Asset Optimization**: TailwindCSS purging and code minification

### Platform Considerations
- **macOS Focus**: Styled with hiddenInset title bar for native macOS feel
- **Cross-Platform Ready**: Electron configuration supports multiple platforms
- **Local File Access**: Web security disabled for local file system access

## Requirements Compliance Status

### ✅ Completed Features
- **Drag & Drop File Upload**: Full-window drop zone with automatic audio-image pairing
- **Modular Pair Container Layout**: Separate containers for audio and images with puzzle piece connections
- **Dark Mode Container Design**: Navy backgrounds with neon blue glow effects and subtle highlights
- **Drag & Drop Swapping**: Audio containers swap only with audio, images only with images
- **Waveform Preview**: Enhanced WaveSurfer.js configuration with optimized bar settings
- **Image Display**: 10px padding above/below with proper centering as specified
- **Video Generation**: 1920x1080 output with 30px vertical spacing and white background
- **Tooltips**: Hover tooltips showing file name, duration/dimensions, and file size
- **File Validation**: Support for MP3/WAV audio and PNG/JPG/HEIC images
- **Progress Tracking**: Real-time progress indication during video generation

### ✅ Technical Implementation
- **Electron + React + TailwindCSS**: Full desktop app framework
- **FFmpeg Processing**: Client-side video generation via ffmpeg.wasm
- **State Management**: Zustand for lightweight, centralized state
- **Animations**: Framer Motion for smooth transitions and effects
- **Security**: Context isolation and secure IPC communication

### 🎯 Design Specifications Met
- **Container Size**: 384px × 192px puzzle piece containers
- **Border Radius**: 24-32px rounded corners
- **Background**: Deep navy (#0A0F1C) with matte black fill (#050A13)
- **Outline**: Neon blue glow (#1E90FF-#00CFFF) at proper width
- **Highlight Effects**: Top-right corner flare with subtle animations
- **Responsive Layout**: Optimized grid system for various screen sizes

## Changelog

```
Changelog:
- June 29, 2025. Initial setup and Electron app framework
- June 29, 2025. Migrated from Replit Agent to standard Replit environment
- June 29, 2025. Implemented full-window drop zone with automatic file pairing
- June 29, 2025. Added puzzle piece container connections per user specifications
- June 29, 2025. Updated container sizes to match reference image proportions
- June 29, 2025. Enhanced compliance with all technical requirements
- June 29, 2025. Added tooltips, proper image padding, and FFmpeg video specs
- June 29, 2025. Updated containers to horizontal layout (side-by-side pairs)
- June 29, 2025. Implemented video generation animations with progress bars
- June 29, 2025. Added green checkmark completion animation and video preview
- June 29, 2025. Created download videos functionality with multiple video support
- June 29, 2025. Optimized FFmpeg processing for 10x faster video generation
- June 29, 2025. Fixed FFmpeg initialization issues for Replit environment
- June 29, 2025. Implemented immediate cancellation with forceStopAllProcesses() function
- June 29, 2025. Optimized concurrent video generation (2-3 videos simultaneously for best performance)
- June 29, 2025. Enhanced cancellation system - stop button now terminates all processes instantly
- June 29, 2025. Added user-friendly settings panel with gear icon for customizable concurrent video limits
- June 29, 2025. Implemented performance presets (Conservative, Balanced, Aggressive) and custom settings
- June 29, 2025. Dynamic concurrency scaling: 1-5 videos (2-3), 6-15 videos (4-5), 16-25 videos (6-8), 25+ videos (8-10)
- June 30, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- June 30, 2025. Applied futuristic dark theme with exact specifications: deep navy (#0A0F1C), matte black (#050A13), neon blue glow (#1E90FF to #00CFFF)
- June 30, 2025. Enhanced container dimensions to 450px minimum width for better content display
- June 30, 2025. Added ambient border pulse and flare flicker animations for sci-fi HUD feel
- June 30, 2025. Updated layout system to single-column vertical stack for optimal wide container viewing
- June 30, 2025. Completely removed settings wheel/gear icon from interface for cleaner design
- June 30, 2025. Eliminated dotted lines from image containers, replaced with solid neon blue borders
- June 30, 2025. Redesigned audio preview to perfectly match GNOME Decibels app interface
- June 30, 2025. Implemented clean waveform visualization with GNOME blue progress and muted gray bars
- June 30, 2025. Added large, prominent play/pause button with GNOME-style circular design
- June 30, 2025. Created minimal filename display (no extensions) with time counter like Decibels
- June 30, 2025. Successfully integrated custom Decibels-style UI with existing audio functionality
- June 30, 2025. Completed migration from Replit Agent to standard Replit environment
- June 30, 2025. Optimized file pairing logic to create containers only for uploaded files (no extra empty containers)
- June 30, 2025. Enhanced automatic pairing system to intelligently match audio and image files
- June 30, 2025. Implemented smart container display: empty state when no files, only filled containers when files uploaded
- June 30, 2025. Removed all unnecessary empty containers - app now creates exactly the number of containers needed
- June 30, 2025. Enhanced drag and drop system: containers can be dragged to empty containers and entire container is draggable
- June 30, 2025. Added visual feedback for drag operations: green borders, scaling effects, and smooth transitions
- July 1, 2025. Updated video display to show only the generated video without "Generated Video" text or status indicators
- July 1, 2025. Fixed audio issues in generated videos - ensured high-quality audio preservation with AAC codec at 320k bitrate
- July 1, 2025. Fixed video preview persistence issue - videos now stay displayed after generation instead of disappearing
- July 1, 2025. Successfully completed migration from Replit Agent to standard Replit environment
- July 1, 2025. Fixed progress bar reloading issue - videos now generate once and display properly without progress bar loops
- July 1, 2025. Fixed file drop issue after deleting pairs - users can now delete pairs and drop new files properly
- July 1, 2025. Enhanced drag and drop swapping functionality with improved visual feedback - audio files can be dragged to swap with other audio files, images can be swapped with other images
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```