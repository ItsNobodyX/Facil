# Fácil

**Simple tools. No hassle.**

Fácil is a fully client-side web app for compressing videos and images and for
converting media to and from Base64 — all inside the browser. No backend, no
database, no accounts, no uploads. Your files never leave your device.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Home page: hero, tool selector, and all six tools |
| `styles.css` | Design system and responsive layout |
| `script.js` | Theme toggle, router, and all tool logic |
| `about.html` | About Us |
| `terms.html` | Terms Of Uses |
| `privacy.html` | Privacy Policy |
| `developer.html` | Developer profile |
| `favicon.svg` | Monochrome "F" favicon |

## Tools

- **Compress Video** — re-encodes video in-browser (Canvas + MediaRecorder) toward a target size.
- **Compress Image** — Canvas re-encode with quality slider or a target size (JPEG / WebP / PNG).
- **Video → Base64** — produces a `data:video/...;base64,...` Data URL.
- **Base64 → Video** — decodes a Data URL or raw Base64 back into a playable video.
- **Photo → Base64** — produces a `data:image/...;base64,...` Data URL.
- **Base64 → Photo** — decodes back into a downloadable image.

## Running it

There is nothing to build or install. Open `index.html` in a browser, or serve
the folder with any static host.

### Deploying

Drop these files into any static host — GitHub Pages, Vercel, Netlify, or any
plain web server. No server-side runtime is required.

## Notes and limitations

- Video compression re-encodes in real time, so it takes roughly as long as the
  video's duration, and the output is a close approximation of the target size,
  not an exact match.
- Results depend on your browser's codecs. Where a browser cannot perform an
  operation, the app says so instead of pretending it worked.
- Very large files may exceed your device's available memory.
- A web font (Inter) is loaded from a public font service for consistent
  typography. No file you process is ever transmitted.

## Privacy

All processing happens locally using browser APIs (Canvas, FileReader,
MediaRecorder, Blob/object URLs). There is no upload endpoint, no analytics,
and no tracking. See `privacy.html` for the full policy.
