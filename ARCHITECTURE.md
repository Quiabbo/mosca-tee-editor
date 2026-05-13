# Project Architecture

## Main Components

The project is organized like this:

- **src/components/** - React components for the UI
- **src/pages/** - Page components (about, blog, etc)
- **src/services/** - Business logic and services
- **src/utils/** - Utility functions and helpers
- **src/hooks/** - Custom React hooks
- **src/store/** - State management with Zustand
- **src/locales/** - Translations (English and Portuguese)
- **src/workers/** - Web workers for background tasks
- **public/** - Static files, manifest, etc

## Technologies Used

- **React 19** - The UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Fabric.js** - Canvas manipulation
- **i18next** - Internationalization
- **Zustand** - State management

For image and PDF handling:
- **jsPDF**, **pdf-lib**, **jimp** - Document manipulation
- **Transformers.js** - AI-powered vectorization
- **ImageMagick WASM** - Image processing
- **ag-psd** - Photoshop file support

## How It Works

1. User opens the app in their browser
2. React renders the interface
3. Fabric.js handles the canvas where users draw
4. Everything runs locally - files don't go to any server
5. Users can export their designs in various formats

## Build Process

We use Vite for building:

```bash
npm run build    # Creates optimized production build
npm run preview  # Test the production build locally
```

The built files go into the `dist/` folder.

## Flatpak

For Linux distribution, we use Flatpak. The manifest (`com.moscatee.MoscaTee.yml`) describes:

- What the app needs to run (Node, npm, etc)
- How to build it
- Permissions it requires (filesystem, network, display)
- Metadata for the app store

## Local Development

The `server.ts` file runs a simple Express server for development:

```bash
npm run dev     # Starts the dev server on localhost:5173
```

The dev server includes hot reload, so changes appear immediately.

## Files You Need to Know About

- **package.json** - Project metadata and dependencies
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build configuration
- **com.moscatee.MoscaTee.yml** - Flatpak manifest
- **.flatpak-build.sh** - Script to build the Flatpak
- **.flatpak-validate.sh** - Script to check if your system can build Flatpak
