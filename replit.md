# Type Beat Video Generator

## Overview
The Type Beat Video Generator is a desktop application designed for music producers to create type beat videos. It enables users to pair audio files (MP3/WAV) with images (PNG/JPG) to generate videos. The application features a futuristic dark theme with neon accents and offers an intuitive drag-and-drop interface for file management and video creation. Its business vision is to provide an efficient and visually appealing tool for producers to quickly create content, tapping into the growing market for unique visual accompaniments to musical tracks.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a futuristic dark theme with deep navy and matte black backgrounds, accented by neon blue glow effects and subtle highlights. The animated background system has been enhanced with smooth transitions between states: a gradient background for the empty upload state, and a dynamic blue flame GIF with diagonal movement animation (25s ease-in-out) for the file management state. Background preloading ensures smooth transitions. Containers are designed with rounded corners (24-32px) and a glassmorphism effect, including semi-transparent dark backgrounds, 16px backdrop blur, and a noise texture overlay for a modern aesthetic. UI elements like the play button are circular, and audio waveform visualizations are clean and resemble the GNOME Decibels app interface. Text colors are light gray for readability. Animations utilize Framer Motion for smooth transitions, including merge animations where containers move to center during video generation, ambient border pulses, flare flickers, and enhanced drag-and-drop visual feedback (e.g., green borders, scaling effects, and 10-degree tilt for image containers). Button styling includes spotlight effects with color variants: blue for generation, red for stopping, and green for downloading.

### Technical Implementations
The application is built as a cross-platform desktop application using Electron, with the frontend developed in React (19.1.0) and styled using TailwindCSS (4.1.11). State management is handled by Zustand (5.0.6) for lightweight and centralized data flow. Video generation is performed client-side using FFmpeg.wasm (0.12.15), and audio analysis for waveform visualization utilizes WaveSurfer.js (7.9.9). The build system relies on Webpack (5.99.9) and Babel for JavaScript transpilation.

### Feature Specifications
Key features include:
- **Drag & Drop File Management**: Full-window drop zone with automatic audio-image pairing, visual feedback for drag operations (e.g., green borders, scaling effects), and intelligent pairing logic. Drop zone is always visible - centered when empty, compact at top when files exist.
- **Modular Pair Containers**: Individual containers for audio and images, allowing drag-and-drop swapping only between same-type containers (audio with audio, image with image). Containers are 384px x 192px with a consistent glassmorphism design.
- **Media Previews**: Waveform visualization for audio files and image display with proper centering and padding.
- **Enhanced Merge Animation**: During video generation, audio and image containers visually move to the center and merge into a "Video Loading Container" with smooth Framer Motion animations. Text disappears during the merge process for clean visual transitions.
- **Video Generation**: Output videos are 1920x1080 resolution, 30px vertical spacing, white background, and high-quality audio (AAC codec at 320k bitrate). Real-time progress tracking with modern loading circles and a "STOP!" button for cancellation. Videos display in original container positions after generation.
- **Smart Button Management**: "Generate Videos" button only appears when no videos exist. After generation, only "Download All Videos" button is shown, eliminating duplicate interfaces.
- **File Validation**: Supports MP3/WAV audio and PNG/JPG/HEIC images, with MIME type and extension checking.
- **Deployment**: Web-based deployment ready for Replit with webpack dev server on port 5000. Client-side processing ensures privacy and performance.

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