# Airi Voice Studio (UI Prototype)

A mobile-responsive, local-first video/transcript editor starter for GitHub Pages.

## What works now
- Import a video file locally (it is not uploaded to a server).
- Preview, play/pause, seek, fullscreen, and display duration.
- Edit sample transcript segment text, add/remove segments, select a segment and seek to its start.
- Export transcript metadata as `airi-transcript.json`.
- Responsive editor UI for Android and desktop.
- No login, API key, or backend.

## Not implemented yet (buttons are honest placeholders)
- AI transcription / Whisper inference
- Voice separation (person tracks / background music)
- Speaker diarization
- Same-speaker voice regeneration / voice cloning
- Replacing audio in video and final MP4 rendering
- True waveform extraction (the current waveform is illustrative)

These require compatible on-device models and substantial memory/CPU/GPU. A 4GB RAM minimum does not guarantee all models will run; 8GB+ is recommended for advanced processing.

## Run locally
Install Node.js 20+:
```bash
npm install
npm run dev
```
Build:
```bash
npm run build
```

## Deploy to GitHub Pages
1. Create a GitHub repository and upload these files.
2. In repository Settings → Pages, select **GitHub Actions** (recommended).
3. Add `.github/workflows/pages.yml` below.
4. Push to the default branch; Actions builds and deploys `dist`.

### `.github/workflows/pages.yml`
```yaml
name: Deploy Airi Voice Studio
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Privacy
Files are processed in the browser in this prototype. Imported video is held via a local object URL and is not sent to a server. Google Fonts may make a network request; to make fully offline, remove the `@import` from `src/style.css`.
