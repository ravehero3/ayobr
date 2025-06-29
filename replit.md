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
- **Window Management**: Hidden title bar with custom styling and minimum size constraints

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

## Changelog

```
Changelog:
- June 29, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```