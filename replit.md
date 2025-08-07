# Type Beat Video Generator

## Overview
The Type Beat Video Generator is a desktop application designed for music producers to create type beat videos. It enables users to pair audio files (MP3/WAV) with images (PNG/JPG) to generate videos. The application features a futuristic dark theme with neon accents and offers an intuitive drag-and-drop interface for file management and video creation. Its business vision is to provide an efficient and visually appealing tool for producers to quickly create content, tapping into the growing market for unique visual accompaniments to musical tracks.

## User Preferences
Preferred communication style: Simple, everyday language.
Container styling preferences: 4px thick glassmorphism stroke around all containers with semitransparent shadows below and beneath.

## System Architecture

### UI/UX Decisions
The application features a futuristic dark theme with deep navy and matte black backgrounds, accented by neon blue glow effects and subtle highlights. The application now uses a revolutionary 4-layer progressive background system that creates an engaging visual journey: Layer 1 (Base Dark Texture) remains constant, Layer 2 (Animated Particle System) fades out when files are added, Layer 3 (Dynamic Flame GIF with typebeatznew_1754459272105.gif) disappears when complete pairs are created, and Layer 4 (Energetic Overlay Pattern) vanishes during video generation, revealing a clean Success Gradient for the final download state. Each layer transition is triggered by user actions, creating a satisfying sense of progression from complex to clean as tasks are completed. Containers are designed with rounded corners (24-32px) and a glassmorphism effect, including semi-transparent dark backgrounds, 16px backdrop blur, and a noise texture overlay for a modern aesthetic. UI elements like the play button are circular, and audio waveform visualizations are clean and resemble the GNOME Decibels app interface. Text colors are light gray for readability. Animations utilize Framer Motion for smooth transitions, including merge animations where containers move to center during video generation, ambient border pulses, flare flickers, and enhanced drag-and-drop visual feedback (e.g., green borders, scaling effects, and 10-degree tilt for image containers). Button styling includes spotlight effects with color variants: blue for generation, red for stopping, and green for downloading.

### Technical Implementations
The application is built as a cross-platform desktop application using Electron, with the frontend developed in React (19.1.0) and styled using TailwindCSS (4.1.11). State management is handled by Zustand (5.0.6) for lightweight and centralized data flow. Video generation is performed client-side using FFmpeg.wasm (0.12.15), and audio analysis for waveform visualization utilizes WaveSurfer.js (7.9.9). The build system relies on Webpack (5.99.9) and Babel for JavaScript transpilation.

### Feature Specifications
Key features include:
- **4-Page Navigation System**: Smart page detection automatically transitions between Upload (empty state), File Management (with files), Generation (during processing), and Download (with completed videos). Each page has distinct backgrounds and UI elements.
- **Drag & Drop File Management**: Full-window drop zone with automatic audio-image pairing, visual feedback for drag operations (e.g., green borders, scaling effects), and intelligent pairing logic. Drop zone is visible on Upload page, file management on File Management page.
- **Modular Pair Containers**: Individual containers for audio and images, allowing drag-and-drop swapping only between same-type containers (audio with audio, image with image). Containers are 384px x 192px with a consistent glassmorphism design.
- **Media Previews**: Waveform visualization for audio files and image display with proper centering and padding.
- **Enhanced Merge Animation**: During video generation, audio and image containers visually move to the center and merge into a "Video Loading Container" with smooth Framer Motion animations. Text disappears during the merge process for clean visual transitions.
- **Video Generation**: Output videos are 1920x1080 resolution, 30px vertical spacing, white background, and high-quality audio (AAC codec at 320k bitrate). Real-time progress tracking with modern loading circles and a "STOP!" button for cancellation.
- **Download Page**: Dedicated final page for video preview and download with grid layout, individual video controls, bulk download functionality, and "Create More Videos" option to return to file management.
- **Smart Page Management**: Automatic page detection based on app state (files present, videos generated, generation in progress) with manual override capabilities.
- **File Validation**: Supports MP3/WAV audio and PNG/JPG/HEIC images, with MIME type and extension checking.
- **User Profile System**: Clickable profile icon in header opens elegant Version 2 glassmorphism user profile modal featuring subtle blue glow effects. Users can upload custom profile pictures (JPG/PNG, max 5MB) which are stored as base64 data in memory. Profile image automatically updates header icon and persists during session. Enhanced with username and email fields, shine animation effects on profile picture hover, and premium glassmorphism styling with deep backdrop blur and blue accent borders.
- **Deployment**: Successfully migrated from Replit Agent to standard Replit web environment (January 2025). Web-based deployment running with webpack dev server on port 5000. Client-side processing ensures privacy and performance. All Electron-specific features adapted for web compatibility while maintaining full functionality. Header loading timing optimized to appear before file containers for better UX. Updated background system on January 6, 2025 to use custom space-themed backgrounds: Page 1 features deep space with Earth view, Page 2 uses Earth from space perspective. Completely removed night sky animated background for cleaner, more focused design. Enhanced glassmorphism styling implemented January 7, 2025 with **1px inner borders** and **4px glassmorphism stroke** around all containers, plus **15% opacity shadows** around the whole container for refined premium visual depth. Navigation positioning updated January 7, 2025: back arrow/button moved 20px right, "Ready" status counter moved 20px left for better visual balance. Container pair spacing optimized to 4px between pairs for extremely compact layout when multiple pairs are present. Header positioning adjusted to 80px top margin to prevent overlap with containers.

### System Design Choices
- **Frontend/Backend Separation**: Clear distinction between the React-based renderer process and Electron's main process for system interactions.
- **Secure IPC**: Context isolation enabled with secure Inter-Process Communication (IPC) via preload scripts for enhanced security.
- **Client-Side Processing**: Leveraging FFmpeg.wasm ensures all video generation occurs locally within the user's browser environment, reducing server load and improving privacy.
- **Optimized Layout**: Designed for wide desktop displays (1800x1000 default, 1600x900 minimum), utilizing a single-column vertical stack for optimal container viewing.

## External Dependencies

### Core Libraries
- **@ffmpeg/ffmpeg**: For client-side video processing.
- **@ffmpeg/util**: Utilities supporting FFmpeg operations.
- **wavesurfer.js**: For audio waveform visualization and playback.
- **framer-motion**: For UI animations and transitions.
- **uuid**: For generating unique identifiers for pairs and videos.

### Development Tools
- **Webpack**: Module bundling and development server.
- **Babel**: JavaScript transpilation.
- **PostCSS**: CSS processing, including TailwindCSS integration.
- **Electron**: Desktop application framework.

### File Processing
- **Native File API**: For handling file input and drag-and-drop functionality.
- **Array Buffer Processing**: For handling binary file data required by FFmpeg.
- **Blob URL Management**: For efficient preview and download of media.