# TalkBoard

A web-based whiteboard application with teleprompter and screen recording capabilities, built with Excalidraw.

[English](./README.md) | [中文](./README_ZH.md) 

## Features

- **Whiteboard Drawing** - Full-featured whiteboard powered by Excalidraw
- **Teleprompter** - Built-in teleprompter for presentations and lectures
- **Screen Recording** - Record whiteboard content with camera overlay
- **Multi-slide Support** - Create and manage multiple presentation slides
- **Customizable Settings** - Aspect ratio, camera position, mouse effects, and more

## Demo

Record your whiteboard presentations with camera overlay and export as MP4.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/ludengke95/TalkBoard.git
cd talkboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

Production files will be generated in the `dist` folder.

## Usage

1. **Draw on Canvas** - Use Excalidraw tools to draw, annotate, and create content
2. **Add Slides** - Click the "+" button in the slide toolbar to add presentation slides
3. **Open Teleprompter** - Click the teleprompter icon to open the script panel
4. **Start Recording** - Click the record button, select recording area, then start

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` / `→` | Next slide |
| `P` / `←` | Previous slide |

## Configuration

Access settings via the gear icon:

- **Aspect Ratio** - 16:9, 4:3, 3:4, 9:16, 1:1
- **Camera** - Enable/disable, position, size, shape
- **Microphone** - Enable/disable, device selection
- **Mouse Effect** - Enable/disable, highlight color
- **Theme** - Light/Dark mode

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Excalidraw](https://excalidraw.com/)
- [mediabunny](https://www.npmjs.com/package/mediabunny)
- [Vitest](https://vitest.dev/) (testing)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

If you find this project helpful, please consider giving it a ⭐!

## Star History

<a href="https://www.star-history.com/?repos=ludengke95%2FTalkBoard&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/image?repos=ludengke95/TalkBoard&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/image?repos=ludengke95/TalkBoard&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/image?repos=ludengke95/TalkBoard&type=date&legend=top-left" />
 </picture>
</a>
