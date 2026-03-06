# TalkBoard Project Wiki

> A whiteboard application based on Excalidraw with teleprompter and screen recording capabilities

**English** | [中文](./WIKI_ZH.md)

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Quick Start](#quick-start)
- [User Guide](#user-guide)
  - [Whiteboard Drawing](#whiteboard-drawing)
  - [Screen Recording](#screen-recording)
  - [Slide Management](#slide-management)
  - [Teleprompter](#teleprompter)
  - [Settings](#settings)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Technical Architecture](#technical-architecture)
- [FAQ](#faq)

---

## Introduction

### Overview

TalkBoard (byv-whiteboard) is a powerful whiteboard recording application designed for creating tutorial videos, lecture recordings, online courses, and more. Built on Excalidraw, it provides complete whiteboard drawing functionality while integrating practical features like screen recording, teleprompter, and camera overlay.

### Use Cases

| Scenario | Description |
|----------|-------------|
| 📚 Online Teaching | Record course content with teleprompter for knowledge points |
| 🎤 Lecture Recording | Create lecture videos with multi-slide support |
| 📝 Meeting Records | Document meeting discussions and record presentations |
| 🎨 Creative Showcase | Display drawing processes and record creative demos |

### Key Advantages

- **Ready to Use**: No complex configuration required, start immediately
- **All-in-One Solution**: Whiteboard + Recording + Teleprompter, no need for multiple tools
- **High Quality Output**: Automatically converts to H264 encoded MP4 format
- **Flexible Configuration**: Supports multiple aspect ratios, camera positions, and microphone selection

---

## Features

### Feature Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        TalkBoard                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Whiteboard │  │   Screen    │  │    Slide    │          │
│  │   Drawing   │  │  Recording  │  │ Management  │          │
│  │  · Pen Tool │  │ · Area Sel. │  │ · Add/Del   │          │
│  │  · Shapes   │  │ · Camera    │  │ · Drag Sort │          │
│  │  · Text     │  │ · Microphone│  │ · Shortcuts │          │
│  │  · Themes   │  │ · MP4 Out   │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │Teleprompter │  │   Settings  │                           │
│  │  · Draggable│  │ · Aspect    │                           │
│  │  · Scrolling│  │ · Camera    │                           │
│  │  · Opacity  │  │ · Microphone│                           │
│  │  · Speed    │  │ · Mouse FX  │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 1. Whiteboard Drawing

Professional whiteboard features powered by Excalidraw:

| Tool Type | Tools Included | Description |
|-----------|----------------|-------------|
| Drawing Tools | Rectangle, Circle, Diamond, Arrow, Line | Supports fill, stroke, rounded corners |
| Writing Tools | Freehand pen, Fountain pen | Supports pressure sensitivity, various thickness |
| Text Tools | Text box | Supports font size, color settings |
| Editing Tools | Selection, Eraser | Supports multi-select, grouping, locking |
| Auxiliary Tools | Image, Laser pointer | Supports drag-and-drop image insertion |

**Theme Support**:
- Light theme (default)
- Dark theme

### 2. Screen Recording

Professional screen recording features:

```
Recording Flow:

  ┌──────┐    ┌──────────┐    ┌────────┐    ┌──────────┐
  │ Idle │───▶│ Selecting│───▶│ Ready  │───▶│Recording │
  │      │    │   Area   │    │        │    │          │
  └──────┘    └──────────┘    └────────┘    └──────────┘
      ▲                                            │
      └────────────────────────────────────────────┘
                    Stop recording, download video
```

**Recording Features**:
- Draggable recording area adjustment
- Fixed aspect ratio support (16:9, 4:3, 9:16, etc.)
- Real-time recording duration display
- View lock during recording to prevent accidental operations
- Automatic MP4 format conversion and download

### 3. Slide Management

Multi-slide support:

- Add/Delete slides
- Drag to reorder
- Keyboard shortcuts for navigation
- Smooth transition animations
- Auto-calculated slide dimensions based on aspect ratio

### 4. Teleprompter

Draggable teleprompter panel:

- Free drag positioning (position auto-saved)
- Scrolling playback control
- Scroll speed adjustment (1-10 levels)
- Opacity adjustment (0-100%)
- Play/Pause control

### 5. Camera Overlay

Camera overlay during recording:

| Setting | Options |
|---------|---------|
| Shape | Circle, Square |
| Position | Top-left, Top-right, Bottom-left, Bottom-right |
| Size | Adjustable |
| Device | Multi-camera switching support |

### 6. Microphone Recording

Synchronized audio recording:

- Multi-microphone device selection
- Real-time volume indicator
- Synchronized with video

---

## Quick Start

### Requirements

| Software | Version |
|----------|---------|
| Node.js | 18.0+ |
| npm | 9.0+ |
| Browser | Chrome/Edge/Firefox (latest) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ludengke95/TalkBoard.git

# 2. Navigate to project directory
cd TalkBoard

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

### Access the Application

After starting, open in browser: **http://localhost:3000**

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Start test watch mode |
| `npm run test:run` | Run all tests |

---

## User Guide

### Whiteboard Drawing

#### Toolbar Overview

```
┌─────────────────────────────────────────────────────────┐
│  Excalidraw Toolbar                                      │
├─────────────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │Select│Rect │Diamond│Circle│Arrow│Line │Pen  │Text ││
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│
│                                                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                            │
│  │Eraser│Image│Laser│Handle│                            │
│  └────┘ └────┘ └────┘ └────┘                            │
└─────────────────────────────────────────────────────────┘
```

#### Basic Operations

1. **Selection Tool**: Click or press `V`
   - Click to select element
   - Drag to select multiple elements
   - Drag to move element

2. **Drawing Tools**: Click icon or use shortcuts
   - Rectangle: `R`
   - Circle: `O`
   - Arrow: `A`
   - Line: `L`
   - Pen: `D`
   - Text: `T`

3. **Theme Switching**:
   - Click settings icon in top-right corner
   - Select Light/Dark theme

#### Advanced Features

- **Group Elements**: Select multiple elements and click group button
- **Lock Elements**: Select element and click lock button
- **Copy/Paste**: `Ctrl+C` / `Ctrl+V`
- **Undo/Redo**: `Ctrl+Z` / `Ctrl+Shift+Z`

---

### Screen Recording

#### Recording Process

```
Step 1: Click Record Button
┌─────────────────────────────────────┐
│                                     │
│    ┌──────────────────────────┐     │
│    │                          │     │
│    │    Whiteboard Canvas     │     │
│    │                          │     │
│    └──────────────────────────┘     │
│                                     │
│         ┌─────────────────┐         │
│         │  🔴 Start Rec   │  ◀── Click this button
│         └─────────────────┘         │
└─────────────────────────────────────┘

Step 2: Select Recording Area
┌─────────────────────────────────────┐
│    ┌──────────────────────┐         │
│    │ ┌──────────────────┐ │         │
│    │ │                  │ │         │
│    │ │ Recording Area   │ │ ◀── Drag to adjust
│    │ │                  │ │         │
│    │ └──────────────────┘ │         │
│    └──────────────────────┘         │
│                                     │
│         ┌─────────────────┐         │
│         │  ✓ Confirm Area │  ◀── Confirm selection
│         └─────────────────┘         │
└─────────────────────────────────────┘

Step 3: Start Recording
┌─────────────────────────────────────┐
│    ┌──────────────────────┐         │
│    │ ┌──────────────────┐ │         │
│    │ │                  │ │         │
│    │ │   Recording...   │ │         │
│    │ │                  │ │         │
│    │ └──────────────────┘ │         │
│    └──────────────────────┘         │
│                                     │
│    Duration: 02:35    ⏹ Stop Rec   │
└─────────────────────────────────────┘

Step 4: Auto Download
┌─────────────────────────────────────┐
│                                     │
│    📹 Video generated, downloading...│
│                                     │
│    Filename: recording_2024-01-15.mp4│
│                                     │
└─────────────────────────────────────┘
```

#### Area Selection Operations

| Operation | Method |
|-----------|--------|
| Resize | Drag corner control points |
| Move Area | Drag the center of the area |
| Confirm Area | Click "Confirm Area" button |
| Cancel Selection | Click "Cancel" button |

#### Recording Status

| Status | Icon | Description |
|--------|------|-------------|
| Idle | 🔴 | Ready to select recording area |
| Selecting | ⬜ | Dragging to select recording area |
| Ready | ✅ | Area confirmed, ready to record |
| Recording | ⏺ | Recording in progress, showing duration |

#### Recording Notes

1. **View Lock**: View is locked during recording to prevent accidental operations
2. **Duration Display**: Real-time recording duration
   - Under 1 hour: `MM:SS` format
   - Over 1 hour: `HH:MM:SS` format
3. **Video Format**: Automatically converts to H264 encoded MP4
4. **File Naming**: `recording_YYYY-MM-DD.mp4`

---

### Slide Management

#### Slide Toolbar

```
┌─────────────────────────────────────────────┐
│  Slide Toolbar                               │
├─────────────────────────────────────────────┤
│                                              │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│   │ 1  │ │ 2  │ │ 3  │ │ +  │ │ 🗑️ │       │
│   └────┘ └────┘ └────┘ └────┘ └────┘       │
│   Current  Slide   Slide   Add   Delete     │
│                                              │
└─────────────────────────────────────────────┘
```

#### Operations

| Operation | Method |
|-----------|--------|
| Add Slide | Click `+` button |
| Delete Slide | Select slide and click `🗑️` button |
| Switch Slide | Click page number |
| Reorder Slides | Drag page numbers to reorder |

#### Slide Dimensions

Slide dimensions are auto-calculated based on aspect ratio:

| Aspect Ratio | Slide Size |
|--------------|------------|
| 16:9 | 1920×1080 |
| 4:3 | 1280×960 |
| 3:4 | 960×1280 |
| 9:16 | 1080×1920 |
| 1:1 | 800×800 |

---

### Teleprompter

#### Teleprompter Interface

```
┌─────────────────────────────────────┐
│  📜 Teleprompter                ─ □  │
├─────────────────────────────────────┤
│                                     │
│  Enter your script content here...  │
│                                     │
│  Supports multi-line text input     │
│  Text auto-scrolls upward during    │
│  playback                           │
│                                     │
│  Pause or adjust speed anytime      │
│                                     │
├─────────────────────────────────────┤
│  Speed: [━━━━●━━━━━] 5              │
│  Opacity: [━━━━━━●━━] 70%           │
│                                     │
│  [ ▶ Play ]  [ ⏸ Pause ]            │
└─────────────────────────────────────┘
```

#### Operations

| Function | Operation |
|----------|-----------|
| Move Position | Drag title bar |
| Edit Content | Type in text area |
| Adjust Speed | Drag speed slider (1-10) |
| Adjust Opacity | Drag opacity slider (0-100%) |
| Play/Pause | Click play/pause button |

#### Teleprompter Features

- **Position Memory**: Position is preserved when reopened
- **Opacity**: Can be set to semi-transparent without blocking whiteboard
- **Scroll Speed**: 10 adjustable levels for different presentation paces

---

### Settings

#### Open Settings

Click the gear icon `⚙️` in the toolbar to open settings panel.

#### Settings Interface

```
┌─────────────────────────────────────┐
│  ⚙️ Settings                     ✕  │
├─────────────────────────────────────┤
│                                     │
│  📐 Aspect Ratio                    │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │16:9 │ │ 4:3 │ │ 9:16│           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  🎥 Camera                          │
│  [✓] Enable Camera                  │
│  Shape: ○ Circle  □ Square          │
│  Position: ○TL ○TR ●BL ○BR          │
│  Device: [Select camera device]     │
│                                     │
│  🎤 Microphone                      │
│  [✓] Enable Microphone              │
│  Device: [Select microphone device] │
│  Volume: ▂▃▄▅▆▇█                   │
│                                     │
│  🖱️ Mouse Effect                    │
│  [✓] Enable Mouse Highlight         │
│  Color: [🟡] Select color           │
│                                     │
│         [ Reset All Settings ]      │
└─────────────────────────────────────┘
```

#### Settings Details

##### Aspect Ratio

| Ratio | Resolution | Use Case |
|-------|------------|----------|
| 16:9 | 1920×1080 | Video platforms, widescreen presentations |
| 4:3 | 1280×960 | Traditional presentations, educational videos |
| 3:4 | 960×1280 | Portrait content |
| 9:16 | 1080×1920 | Short videos, mobile |
| 1:1 | 800×800 | Social media, avatar videos |

##### Camera Settings

| Setting | Options | Description |
|---------|---------|-------------|
| Enable | On/Off | Show camera during recording |
| Shape | Circle/Square | Camera frame shape |
| Size | 60-200px | Camera frame size |
| Position | Four corners | Camera display position |
| Offset | X/Y | Distance from edge |
| Device | Dropdown | Select camera device |

##### Microphone Settings

| Setting | Description |
|---------|-------------|
| Enable | Record audio or not |
| Device Selection | Select microphone device |
| Volume Indicator | Real-time volume display |

##### Mouse Effect Settings

| Setting | Description |
|---------|-------------|
| Enable | Show mouse highlight effect |
| Color | Highlight circle color |

#### Reset Settings

Click "Reset All Settings" button to restore default settings.

---

## Keyboard Shortcuts

### Slide Navigation Shortcuts

| Shortcut | Function |
|----------|----------|
| `N` | Next slide |
| `→` | Next slide |
| `↓` | Next slide |
| `P` | Previous slide |
| `←` | Previous slide |
| `↑` | Previous slide |

### Excalidraw Shortcuts

| Shortcut | Function |
|----------|----------|
| `V` | Selection tool |
| `R` | Rectangle tool |
| `O` | Circle tool |
| `D` | Pen tool |
| `A` | Arrow tool |
| `L` | Line tool |
| `T` | Text tool |
| `E` | Eraser |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` | Delete selected elements |
| `Escape` | Deselect |

---

## Technical Architecture

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18.2.0 |
| Build Tool | Vite | 5.0.0 |
| Whiteboard | Excalidraw | 0.17.6 |
| Video Conversion | mediabunny | 1.35.1 |
| Test Framework | Vitest | 4.0.18 |
| Testing Library | Testing Library | 16.3.2 |

### Project Structure

```
byv/
├── src/
│   ├── main.jsx                 # Application entry
│   ├── App.jsx                  # Main app component
│   ├── App.css                  # Main styles
│   ├── index.css                # Global styles
│   │
│   ├── components/              # Components directory
│   │   ├── CameraPreview/       # Camera preview
│   │   ├── CursorIndicator/     # Cursor indicator
│   │   ├── SelectionBox/        # Recording area selection
│   │   ├── Settings/            # Settings components
│   │   ├── SlideToolbar/        # Slide toolbar
│   │   ├── Teleprompter/        # Teleprompter
│   │   └── Toolbar/             # Main toolbar
│   │
│   ├── contexts/                # React Context
│   │   └── SettingsContext.jsx  # Settings state management
│   │
│   ├── hooks/                   # Custom Hooks
│   │   ├── useRecording.js      # Recording logic
│   │   ├── useSlides.js         # Slide management
│   │   ├── useMediaDevices.js   # Media device management
│   │   └── useExcalidrawScroll.js # Scroll animation
│   │
│   ├── test/                    # Test files
│   └── utils/                   # Utility functions
│
├── index.html                   # HTML entry
├── vite.config.js               # Vite config
├── vitest.config.js             # Vitest config
└── package.json                 # Project config
```

### Core Module Description

#### 1. useRecording Hook

Core recording logic:

- Recording state management
- Video stream capture
- Camera frame drawing
- Microphone audio recording
- Video conversion and download

#### 2. useSlides Hook

Slide management:

- Slide CRUD operations
- Navigation logic
- Shortcut handling
- Slide dimension calculation

#### 3. useMediaDevices Hook

Media device management:

- Device enumeration
- Camera open/close
- Microphone open/close

#### 4. SettingsContext

Global settings state:

- Settings persistence (localStorage)
- Settings change notification
- Default value management

---

## FAQ

### Q1: No sound in recording?

**Solutions**:
1. Check if microphone is enabled in settings
2. Confirm correct microphone device is selected
3. Check if browser has microphone permission
4. Check if volume indicator shows activity

### Q2: Camera not displaying?

**Solutions**:
1. Check if camera is enabled in settings
2. Confirm correct camera device is selected
3. Check if browser has camera permission
4. Try refreshing the page to reacquire device

### Q3: Recording area selection inaccurate?

**Solutions**:
1. Use corner control points for precise adjustment
2. Select a fixed aspect ratio (e.g., 16:9)
3. Drag the center to move the entire area

### Q4: Video download failed?

**Solutions**:
1. Check browser download settings
2. Confirm sufficient disk space
3. Try using a different browser

### Q5: Teleprompter position reset?

**Solutions**:
- Teleprompter position is saved in localStorage
- Clearing browser data will reset the position
- Simply drag to desired position again

### Q6: Whiteboard content lost?

**Solutions**:
- Excalidraw auto-saves to browser storage
- Clearing browser data will lose content
- Recommend regularly exporting .excalidraw files as backup

### Q7: Which browsers are supported?

**Recommended Browsers**:
- Google Chrome (recommended)
- Microsoft Edge
- Firefox
- Safari (some features may be limited)

### Q8: How to export whiteboard content?

**Methods**:
1. Use Excalidraw's export function
2. Export as PNG/SVG images
3. Save as .excalidraw file

---

## Changelog

### v1.0.0

- Initial release
- Whiteboard drawing features
- Screen recording features
- Slide management
- Teleprompter feature
- Camera overlay
- Microphone recording

---

## Contact & Support

- **Project URL**: [GitHub](https://github.com/ludengke95/TalkBoard)
- **Issue Tracker**: [Issues](https://github.com/ludengke95/TalkBoard/issues)

---

*Last updated: 2026*
