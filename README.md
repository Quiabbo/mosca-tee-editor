# Mosca Tee - Online Graphic Editor

**The world's first and only graphic editor with accessibility for blind and low-vision people.**

Mosca Tee is a free and open-source online graphic editor. We believe professional design tools should be accessible to everyone, without expensive subscriptions or massive data collection.

## What is Mosca Tee?

Mosca Tee started because I believed that good design tools should be free. Not just free to download, but actually free - no premium features, no locked tools, no tracking.

The project was born from a specific mission: make design accessible to blind and low-vision people. We're not just retrofitting accessibility on top of an existing tool. Accessibility is built into every feature from day one.

### Core Values

- **100% Free** - All professional tools are available to everyone. No premium plans, no watermarks.
- **No Signup Required** - Start creating right now. We don't ask for your email.
- **Your Data, Your Control** - Everything runs locally in your browser. Your designs never leave your computer.
- **Real Accessibility** - The first graphic editor built with genuine accessibility for blind and low-vision users. With a numbered grid system, dedicated shortcuts, and full keyboard navigation.

## Features

### Drawing & Design Tools
- Selection, brush, eraser, text, shapes, pipette
- Layers system - organize, lock, hide, reorder
- Color picker and palette management
- Gradients and glass effects (glassmorphism)
- Brush customization with different styles
- Undo/redo with visual history

### Advanced Capabilities  
- Open and edit Photoshop (PSD) files
- AI-powered background removal
- Convert images to SVG vectors
- Import thousands of free images and icons from Pexels
- Filters and image adjustments (brightness, contrast, saturation)
- Generate QR codes
- Export to multiple formats: PNG, JPG, SVG, PDF

### Accessibility Features (Built-in, not bolt-on)
- Screen reader support with element descriptions
- Numbered grid system on canvas (like a chessboard)
- Keyboard shortcuts for everything
- F3 to get details about selected object
- F6 to list all objects on canvas
- F9 to hear object position
- WCAG AAA contrast checking
- Color blindness simulation modes
- Alt text support for images

### Additional
- Supports 2 languages: English and Portuguese
- Progressive Web App (works offline)
- Run locally or use on any server

## Installation

### Prerequisites
- Node.js 16+

### Web Version (Quick Start)

```bash
git clone https://github.com/Quiabbo/mosca-tee-editor.git
cd mosca-tee-editor
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

### Linux Installation (Flatpak)

```bash
flatpak install flathub com.moscatee.MoscaTee
flatpak run com.moscatee.MoscaTee
```

Or build locally:
```bash
flatpak-builder --user --install build com.moscatee.MoscaTee.yml
```

See [FLATPAK_INSTALL.md](FLATPAK_INSTALL.md) and [LINUX_MINT_SETUP.md](LINUX_MINT_SETUP.md) for detailed instructions.

## Supported File Formats

**Import:** PSD, PNG, JPG, SVG, PDF, WebP, GIF, BMP, HEIC
**Export:** PNG, JPG, SVG, PDF, PSD, WebP

## Technology

- React 19 for the interface
- Fabric.js for canvas rendering  
- Vite for build tooling
- TypeScript for code safety
- Tailwind CSS for styling
- i18next for translations
- Transformers.js for vectorization
- Various image processing libraries

## Accessibility Philosophy

We started with a simple question: why isn't there a graphic editor for blind people?

Most tools claim to be "accessible" by adding ARIA labels and hope screen readers handle it. That's not enough. Mosca Tee was designed from scratch specifically for blind and low-vision users.

The numbered grid system (like coordinates on a chessboard) lets users know exactly where objects are on the canvas. Keyboard shortcuts are comprehensive and logical. Every feature is tested with actual users and actual assistive technologies.

This isn't perfect yet - accessibility is a journey, not a destination. But it's a real start.

## Contributing

We welcome contributions! Check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Issues tagged with `good-first-issue` are great for newcomers.

## Code of Conduct

We're building a welcoming community. Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

Found a security issue? Please report it privately through GitHub Security Advisory. See [SECURITY.md](SECURITY.md).

## License

Mosca Tee is licensed under **GNU General Public License v3.0 (GPL-3.0)**.

This means you can:
- Use it, modify it, distribute it freely
- Use it commercially
- Study how it works

You must:
- Include the license with any distribution
- Disclose your modifications
- Use the same license for changes

See [LICENSE](LICENSE) for full details or visit https://www.gnu.org/licenses/gpl-3.0.html

## Support

- **Website:** https://moscatee.com
- **Issues & Bug Reports:** https://github.com/Quiabbo/mosca-tee-editor/issues
- **Documentation:** Read the guides in this repository
- **Design Guide:** https://moscatee.com/en/blog

## Credits

Made by [Mosca Tee](https://moscatee.com) for everyone who believes design should be free and accessible.

---

© 2026 Mosca Tee  
Licensed under GNU General Public License v3.0
