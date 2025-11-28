# Novel Writing App

A desktop novel writing application built with Tauri and SvelteKit, combining the power of native desktop functionality with modern web technologies.

## 🚀 Tech Stack

### Frontend
- **SvelteKit 2.9.0** - Full-stack web framework
- **Svelte 5.0.0** - UI framework with modern runes syntax
- **TypeScript 5.6.2** - Type safety and developer experience
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **shadcn-svelte** - High-quality UI component library
- **mode-watcher** - Dark/light theme management

### Backend/Desktop
- **Tauri 2** - Rust-based desktop app framework
- **Rust** - Systems programming for native functionality

### Development Tools
- **Vite 6.0.3** - Fast build tool and dev server
- **Bun** - Modern package manager

## 📦 Installation

### Prerequisites
- Node.js (or Bun)
- Rust and Cargo
- System dependencies for Tauri

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd novel-app-tauri

# Install dependencies
bun install
```

## 🛠️ Development

```bash
# Start development server
bun run tauri dev

# Type checking
bun check

# Build for production
bun run tauri build
```

## 🏗️ Project Structure

```
src/                    # SvelteKit frontend source
├── lib/
│   ├── components/ui/   # shadcn-svelte UI components
│   └── utils.ts        # Utility functions
├── routes/             # SvelteKit pages/routes
└── app.css            # Global styles

src-tauri/             # Tauri Rust backend
├── src/
│   ├── main.rs        # Tauri main entry point
│   └── lib.rs         # Rust library code
├── Cargo.toml         # Rust dependencies
└── tauri.conf.json    # Tauri configuration

static/                # Static assets
```

## 🎨 Features

- **Cross-platform desktop application** - Windows, macOS, and Linux
- **Modern UI** - Clean interface with shadcn-svelte components
- **Theme support** - Dark, light, and system theme modes
- **Type-safe development** - Full TypeScript support
- **Fast development** - HMR and optimized build process

## 🧩 UI Components

This project uses shadcn-svelte for UI components. To add new components:

```bash
bun x shadcn-svelte@latest add [component-name]
```

Available components include buttons, forms, dialogs, and more. See [shadcn-svelte documentation](https://shadcn-svelte.com/docs) for details.

## 🔧 Configuration

### Tauri Configuration
Main configuration is in `src-tauri/tauri.conf.json` for app settings, permissions, and build options.

### Theme System
Theme management is handled by mode-watcher, supporting:
- Light mode
- Dark mode  
- System preference detection
- Theme persistence

## 📝 Development Notes

### Svelte 5 Runes
This project uses Svelte 5's modern runes syntax (`$state`, `$props`) for reactive state management.

### SPA Mode
Configured as a Single Page Application with adapter-static for optimal Tauri integration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking with `bun check`
5. Submit a pull request

## 📄 License

TBD

## Recommended IDE Setup

[Zed](https://zed.dev/) + [Svelte](https://zed.dev/extensions/svelte)
