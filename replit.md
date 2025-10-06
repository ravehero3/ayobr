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
- **User Profile System**: Glassmorphism modal for user profiles, allowing custom profile pictures (JPG/PNG, max 5MB) stored as base64, with username field. Monochrome image icon placeholder with gray accents.
- **Logo Integration System**: Settings panel allows users to upload logos (PNG, JPG, HEIC, SVG) for video overlay. Logos are stored as base64, displayed as miniature previews, and automatically resized to 200px width while maintaining aspect ratio when used in videos.
- **Deployment**: Web-based deployment running with webpack dev server, ensuring client-side processing for privacy and performance.

## Recent Changes (October 6, 2025)
- **Scrollbar Layout Shift Fix**: Changed video generation containers overflow from `overflow-y-auto` to `overflow-y-scroll` to prevent layout shift when scrollbar appears/disappears. The scrollbar is now always visible (even if disabled), eliminating the jarring left-right movement of containers during video generation.
- **Video Preview Border Gradient Enhancement**: Moved gradient from background to border on completed video preview containers. Gradient now appears only on the 2px border stroke using `borderImage`, while maintaining the dark glassmorphism background. This creates a cleaner, more elegant completed video indicator.

## Previous Changes (October 5, 2025)
- **UI/UX Fixes and Optimizations**:
  - Fixed z-index hierarchy: Settings window (AppInfoWindow) now properly appears above sleeping alien during video generation (sleeping alien z-index reduced to 9998)
  - Changed video preview container border from green to gradient stroke with multiple blue shades (2 dark blue corners, 1 baby blue, 1 very dark blue) for completed videos on page 3
  - Changed username font-weight from '800' (extra bold) to 'normal' for better visual balance in header
  - Removed rotating square animation from settings icon click (removed fastSpin animation on active/focus states)
  - **Performance Optimization**: Eliminated excessive FFmpeg cleanup between videos - reduced delay from 3+ seconds to 300ms while maintaining proper file cleanup. Second and subsequent videos now generate much faster.
  - **User Profile UI Cleanup**: Removed email field and input from user profile window for cleaner interface
  - **Profile Picture Placeholder Update**: Changed from user silhouette to monochrome image icon with gray accents (removed blue theme from profile placeholder)
  - **Video Preview Text Enhancement**: "Video Ready! Click to Play" now displays on one line, positioned 40px lower, and only appears on hover over completed video previews
  - **Particle Visibility Fix**: Changed video preview particle container from overflow-hidden to overflow-visible so particles appear above all other elements and are not clipped at container edges
  - **Settings Icon Animation Removal**: Removed slowSpin hover animation from settings icon to eliminate the rotating square effect when clicking

## Previous Changes (October 5, 2025)
- **Back Button Cleanup Enhancement**: When clicking "back" during video generation, the app now performs a complete cleanup by stopping all FFmpeg processes, removing temporary files, resetting all generation state, and returning to upload page for a fresh start. This ensures no orphaned processes or temporary files remain in memory.
- **Fixed Header User Icon Position**: User profile icon now stays in a fixed position when username changes. Username is positioned to the left of the icon with its right edge exactly 20px from the icon's left edge, preventing layout shift when the username is updated.
- **Header Elements Clickable During Video Generation**: Fixed z-index hierarchy so LoadingWindow (z-index 9999) stays below header (z-index 10000), ensuring user profile and logo elements remain clickable during video generation. Clicking these elements now properly opens their respective windows/modals.
- **Particle Distribution Enhancement**: Changed video preview container particles from 8 particles positioned only at bottom (75-83% vertical) to 12 particles distributed evenly around entire container perimeter using polar coordinates. Particles now appear around the whole video preview on hover, creating a more immersive visual effect.
- **Blue Theme Consistency**: Changed completed video hover glow from green (rgba(34, 197, 94)) to blue (rgba(59, 130, 246) and rgba(96, 165, 250)), matching the overall blue theme throughout the application.
- **Username Typography Enhancement**: Changed username font-weight from 'medium' (500) to '800' (extra bold) for improved visibility and prominence in the header.

## Previous Changes (August 26, 2025)
- **Video Generation Logic Overhaul**: Completely restructured video generation to process one video at a time sequentially for maximum stability. Eliminated race conditions and concurrent processing issues that were causing stuck generations.
- **Enhanced Audio Quality**: Upgraded audio settings to 320k bitrate, 48kHz sample rate with stereo output for professional quality uncompressed sound.
- **Improved State Management**: Simplified video generation state tracking with clear progression indicators and immediate UI updates when videos complete.
- **Better Error Handling**: Enhanced FFmpeg file reading with progressive retry delays and longer stabilization periods to prevent incomplete video generation.
- **Memory Optimization**: Implemented more frequent garbage collection and breathing room between sequential video processing to prevent browser overload.

## Previous Changes (August 19, 2025)
- **Migration Completed**: Successfully migrated project from Replit Agent to Replit environment
- **Dependencies Installation**: Installed all required packages via npm, resolved package conflicts
- **Webpack Configuration**: Verified webpack dev server configuration for Replit environment
- **Audio Quality Enhancement**: Optimized audio settings for quality and stability (192k bitrate, 44.1kHz sample rate, stereo)
- **Processing Optimization**: Improved FFmpeg settings with zerolatency tuning and limited threads to prevent browser overload
- **Timeout Resolution**: Extended processing timeout to 12 minutes and optimized file reading with reduced delays to prevent completion failures
- **Particle Visual Update**: Changed generation page particles to white and baby blue colors matching design system, positioned around progress bars with proper looping animations
- **Container Visibility Fix**: Fixed issue where video generation containers disappeared during processing - containers now remain visible with reduced opacity during generation
- **Security Enhancement**: Ensured proper client/server separation with secure FFmpeg.wasm processing
- **Environment Setup**: Configured proper port binding (5000) and CORS headers for Replit deployment
- **Migration from Replit Agent (August 24, 2025)**: Successfully migrated project from Replit Agent to standard Replit environment with all dependencies installed and webpack dev server running on port 5000. Removed all Electron dependencies, fixed TailwindCSS PostCSS configuration, and confirmed video generation works correctly in browser. All migration checklist items completed - project is fully functional and ready for development
- **Video Generation Stability Fix (August 24, 2025)**: Fixed critical issue where processing multiple videos simultaneously (4 concurrent) was overwhelming browser memory causing generation failures. Reduced concurrent processing to 2 videos maximum, increased FFmpeg timeout to 15 minutes, and optimized concurrency settings for better stability. Video generation now processes reliably without returning users to previous page on failure
- **Logo Update**: Fixed broken logo in AppInfoWindow component and updated to use new TypeBeatz alien logo with 'zzz' text
- **Z-Index Improvements**: Updated AppInfoWindow and UserProfile components to use consistent high z-index values (999999) ensuring they appear above all other elements, matching settings window behavior
- **Header Status Enhancement**: Added "We are generating your videos" indicator in header during video generation with animated pulse effect
- **User Profile Modal Enhancement**: Added Gaussian blur backdrop when user profile is opened, creating elegant modal overlay effect while maintaining app functionality
- **Generation Text Positioning**: Moved "We are generating your videos" text 40px higher on the generation page and removed redundant header indicator per user preference
- **Modal Blur Enhancement**: Added consistent Gaussian blur backdrop to SettingsPanel and AppInfoWindow modals, matching UserProfile's elegant overlay effect
- **AppInfoWindow Improvements**: Removed dragging functionality and fixed window to perfect center position with simplified close button for better UX
- **AppInfoWindow Title Logo Fix**: Updated broken title logo in AppInfoWindow component to use new "TypeBeatz Logo 2 White Version" provided by user, ensuring proper branding display
- **AppInfoWindow Spacing Optimization**: Adjusted padding to ensure exactly 32px free space between TypeBeatz icon and window edges, with maximum width set to 396px for proper containment. Close button repositioned to maintain consistent 32px spacing from all edges

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