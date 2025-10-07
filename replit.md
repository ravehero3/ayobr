# Type Beat Video Generator

## Overview
The Type Beat Video Generator is a desktop application designed for music producers to create visually appealing type beat videos. It efficiently pairs audio files (MP3/WAV) with images (PNG/JPG) to generate unique visual content for musical tracks. The project aims to be an intuitive, efficient tool that caters to the market demand for high-quality visual accompaniments for music.

## User Preferences
Preferred communication style: Simple, everyday language.
Container styling preferences: 4px thick glassmorphism stroke around all containers with semitransparent shadows below and beneath.
FFmpeg optimization preferences: Use hardware acceleration when available, faster encoding presets (ultrafast/superfast), lower frame rates for processing speed, parallel processing with all CPU cores.
UI positioning preferences: "We are generating your videos" text positioned 80px higher, sleeping alien positioned at bottom of screen during video generation.
Z-index preferences: Sleeping alien should appear in front of background but behind footer during video generation.
Video container width: Generating video containers should be 200px wide (fixed size, no responsive resizing).

## System Architecture

### UI/UX Decisions
The application features a futuristic dark theme with deep navy and matte black backgrounds, neon blue accents, and a 4-layer progressive background system. Containers utilize rounded corners (24-32px) and a glassmorphism effect with semi-transparent dark backgrounds, 16px backdrop blur, and a noise texture overlay. UI elements include circular play buttons and clean audio waveform visualizations. Framer Motion provides smooth animations for merges, ambient border pulses, flare flickers, and enhanced drag-and-drop feedback. Button styling uses spotlight effects with color variants.

### Technical Implementations
The application is a cross-platform desktop application built with Electron, a React (19.1.0) frontend, and TailwindCSS (4.1.11). State management is handled by Zustand (5.0.6). Client-side video generation uses FFmpeg.wasm (0.12.15), and audio analysis for waveforms uses WaveSurfer.js (7.9.9). The build system relies on Webpack (5.99.9) and Babel. The application is deployed via a web-based webpack dev server, ensuring client-side processing for privacy and performance.

**Video Processing Optimizations**: JobManager implements FFmpeg instance pooling with a maximum of 3 concurrent instances to prevent memory exhaustion. Each video job uses a dedicated FFmpeg instance from the pool, eliminating lock contention and enabling true parallel processing. Intelligent prefetching prepares files for upcoming jobs while current ones process, with automatic buffer cleanup on cancellation to prevent memory leaks. The system supports up to 3 concurrent video generations with robust cancellation handling and terminal state guards to prevent race conditions.

### Feature Specifications
Key features include:
-   **4-Page Navigation System**: Smart transitions between Upload, File Management, Generation, and Download pages.
-   **Drag & Drop File Management**: Full-window drop zone with automatic audio-image pairing, visual feedback, and intelligent pairing logic.
-   **Modular Pair Containers**: Glassmorphism-designed containers for audio and images with drag-and-drop swapping and hover effects.
-   **Media Previews**: Waveform visualization for audio and image display.
-   **Enhanced Merge Animation**: Visual merging of audio and image containers into a "Video Loading Container" during generation using Framer Motion.
-   **Video Generation**: Outputs 1920x1080 videos with white background, high-quality audio (AAC 320k), and optional user logo overlay. Includes real-time progress and cancellation. Processes videos with controlled concurrency (2 at a time) for optimal performance while maintaining stability across 1-100 video batches.
-   **Download Page**: For video preview, bulk download, and options to create more videos.
-   **Smart Page Management**: Automatic page detection based on application state.
-   **File Validation**: Supports MP3/WAV audio and PNG/JPG/HEIC images.
-   **User Profile System**: Glassmorphism modal for user profiles with custom profile pictures (JPG/PNG, max 5MB) stored as base64, and a monochrome image icon placeholder.
-   **Logo Integration System**: Settings panel allows logo uploads (PNG, JPG, HEIC, SVG) for video overlay, stored as base64, and automatically resized to 200px width while maintaining aspect ratio.

### System Design Choices
-   **Frontend/Backend Separation**: Clear distinction between React renderer and Electron's main process.
-   **Secure IPC**: Context isolation with secure Inter-Process Communication via preload scripts.
-   **Client-Side Processing**: FFmpeg.wasm ensures all video generation is local.
-   **Optimized Layout**: Designed for wide desktop displays (1800x1000 default), using a single-column vertical stack.

## External Dependencies

### Core Libraries
-   **@ffmpeg/ffmpeg**: Client-side video processing.
-   **@ffmpeg/util**: Utilities for FFmpeg operations.
-   **wavesurfer.js**: Audio waveform visualization and playback.
-   **framer-motion**: UI animations and transitions.
-   **uuid**: Generating unique identifiers.

### Development Tools
-   **Webpack**: Module bundling and development server.
-   **Babel**: JavaScript transpilation.
-   **PostCSS**: CSS processing, including TailwindCSS integration.
-   **Electron**: Desktop application framework.

### File Processing
-   **Native File API**: File input and drag-and-drop.
-   **Array Buffer Processing**: Binary file data handling.
-   **Blob URL Management**: Efficient media preview and download.