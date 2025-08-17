# Type Beat Video Generator

## Overview
The Type Beat Video Generator is a desktop application enabling music producers to create type beat videos by pairing audio files (MP3/WAV) with images (PNG/JPG). It aims to provide an efficient, visually appealing, and intuitive tool for content creation, catering to the market demand for unique visual accompaniments to musical tracks.

## User Preferences
Preferred communication style: Simple, everyday language.
Container styling preferences: 4px thick glassmorphism stroke around all containers with semitransparent shadows below and beneath.
FFmpeg optimization preferences: Use hardware acceleration when available, faster encoding presets (ultrafast/superfast), lower frame rates for processing speed, parallel processing with all CPU cores.
UI positioning preferences: "We are generating your videos" text positioned 80px higher, sleeping alien positioned at bottom of screen during video generation.
Z-index preferences: Sleeping alien should appear in front of background but behind footer during video generation.
Video container width: Generating video containers should be 200px wide (fixed size, no responsive resizing).

## System Architecture

### UI/UX Decisions
The application features a futuristic dark theme with deep navy and matte black backgrounds, accented by neon blue glow effects. It incorporates a 4-layer progressive background system that transitions based on user actions, creating a sense of progression. Containers have rounded corners (24-32px) and a glassmorphism effect with semi-transparent dark backgrounds, 16px backdrop blur, and a noise texture overlay. UI elements are designed for a modern aesthetic, including circular play buttons and clean audio waveform visualizations. Framer Motion is used for smooth animations, including merge animations, ambient border pulses, flare flickers, and enhanced drag-and-drop visual feedback. Button styling uses spotlight effects with color variants for different actions.

### Technical Implementations
The application is a cross-platform desktop application built with Electron, a React (19.1.0) frontend, and TailwindCSS (4.1.11) for styling. State management uses Zustand (5.0.6). Client-side video generation is handled by FFmpeg.wasm (0.12.15), and audio analysis for waveforms uses WaveSurfer.js (7.9.9). The build system uses Webpack (5.99.9) and Babel.

### Feature Specifications
Key features include:
- **4-Page Navigation System**: Smart page transitions between Upload, File Management, Generation, and Download states, each with distinct UI.
- **Drag & Drop File Management**: Full-window drop zone with automatic audio-image pairing, visual feedback, and intelligent pairing logic.
- **Modular Pair Containers**: Individual glassmorphism-designed containers for audio and images, allowing drag-and-drop swapping between same-type containers. Subtle hover effects provide visual feedback.
- **Media Previews**: Waveform visualization for audio and proper display for images.
- **Enhanced Merge Animation**: Visual merging of audio and image containers into a "Video Loading Container" during generation with Framer Motion animations.
- **Video Generation**: Outputs 1920x1080 videos with white background, high-quality audio (AAC 320k), and optional user logo overlay (27% horizontal from left, vertically centered, 80px height). Includes real-time progress tracking and cancellation.
- **Download Page**: Dedicated page for video preview, bulk download, and options to create more videos.
- **Smart Page Management**: Automatic page detection based on application state.
- **File Validation**: Supports MP3/WAV audio and PNG/JPG/HEIC images with MIME type and extension checking.
- **User Profile System**: Glassmorphism modal for user profiles, allowing custom profile pictures (JPG/PNG, max 5MB) stored as base64, with username and email fields.
- **Logo Integration System**: Settings panel allows users to upload logos (PNG, JPG, HEIC, SVG) for video overlay. Logos are stored as base64, displayed as miniature previews, and automatically resized to 200px width while maintaining aspect ratio when used in videos.
- **Deployment**: Web-based deployment running with webpack dev server, ensuring client-side processing for privacy and performance.

## Recent Changes (August 17, 2025)
- **Migration Completed**: Successfully migrated project from Replit Agent to Replit environment
- **Z-index Hierarchy**: Fixed sleeping alien visibility during video generation (z-index: 9900, above background but below footer)
- **Video Container Sizing**: Set generating video containers to 200px width with fixed dimensions (no responsive resizing)
- **Header Visibility Fix**: Fixed header z-index (10000) to ensure visibility above loading window during video generation
- **Layer Management**: Updated layering hierarchy: footer (z-index: 99999) > header (z-index: 10000) > loading window (z-index: 9950) > sleeping alien (z-index: 9900) > background

### System Design Choices
- **Frontend/Backend Separation**: Clear distinction between React renderer and Electron's main process.
- **Secure IPC**: Context isolation with secure Inter-Process Communication via preload scripts.
- **Client-Side Processing**: FFmpeg.wasm ensures all video generation is local.
- **Optimized Layout**: Designed for wide desktop displays (1800x1000 default), using a single-column vertical stack.

## External Dependencies

### Core Libraries
- **@ffmpeg/ffmpeg**: For client-side video processing.
- **@ffmpeg/util**: Utilities supporting FFmpeg operations.
- **wavesurfer.js**: For audio waveform visualization and playback.
- **framer-motion**: For UI animations and transitions.
- **uuid**: For generating unique identifiers.

### Development Tools
- **Webpack**: Module bundling and development server.
- **Babel**: JavaScript transpilation.
- **PostCSS**: CSS processing, including TailwindCSS integration.
- **Electron**: Desktop application framework.

### File Processing
- **Native File API**: For file input and drag-and-drop.
- **Array Buffer Processing**: For binary file data.
- **Blob URL Management**: For efficient media preview and download.