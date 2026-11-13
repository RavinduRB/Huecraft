# Huecraft

Huecraft is a desktop color-picking workspace for turning images and on-screen references into useful color palettes. Load an image, sample colors, and collect or generate palettes for your next creative project.

<img width="2069" height="1164" alt="Huecraft" src="https://github.com/user-attachments/assets/14e10729-1e0b-413b-b4a3-9c4d5c6fee91" />

## Key features

- Upload, drag and drop, or paste an image into the workspace.
- Sample individual colors from an image with a pixel-level picker.
- Pick colors from anywhere on your screen with the browser's EyeDropper API (where supported).
- Automatically extract a five-color palette from an image.
- Generate complementary, contrast, and softer palette variations from selected colors.
- Copy individual colors or complete palettes to the clipboard.
- Zoom and reset the image view.
- Launch a compact, always-on-top widget edition.

## Technology stack

- **Electron** for the desktop application and window management.
- **HTML, CSS, and vanilla JavaScript** for the user interface and application logic.
- **Canvas API** for displaying images and sampling pixel colors.
- **EyeDropper API** and **Clipboard API** for screen color selection and copying colors.
- **electron-builder** for packaging portable Windows x64 applications.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm start
```

To run the compact widget edition:

```bash
npm run start:widget
```

To build the portable Windows applications:

```bash
npm run build
```

The portable app and widget build outputs are written to `artifacts/portable-new` and `artifacts/widget-new`, respectively.
