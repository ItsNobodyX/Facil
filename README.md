<div align="center">

# Fácil

**Simple tools. No hassle.**

Compress videos and images, convert media to Base64, and turn Base64 back into
usable files — entirely inside your browser.

[![Backend](https://img.shields.io/badge/backend-none-111111?style=flat-square)](#no-backend)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local-111111?style=flat-square)](#privacy)
[![No accounts](https://img.shields.io/badge/accounts-not%20required-111111?style=flat-square)](#)
[![Static](https://img.shields.io/badge/deploy-any%20static%20host-111111?style=flat-square)](#deployment)

</div>

---

## What is Fácil?

**Fácil** (Spanish for *easy*) is a small, focused set of everyday media
utilities that run **completely in your browser**. It does six things, does them
well, and stays out of your way:

1. Compress videos
2. Compress images
3. Convert video → Base64
4. Convert Base64 → video
5. Convert photo → Base64
6. Convert Base64 → photo

There is **no backend, no database, no accounts, and no uploads**. Your files
are read and processed on your own device using built-in browser APIs, so they
never leave your machine. Fácil is a single static site — you can host it
anywhere, and it will keep working.

> **Private by design.** Your files never leave your device.

## Screenshots

| Home (light) | Home (dark) |
| --- | --- |
| ![Fácil home page, light theme](screenshots/home-light.png) | ![Fácil home page, dark theme](screenshots/home-dark.png) |

| Compress Video | Base64 to Photo |
| --- | --- |
| ![Compress Video tool](screenshots/tool-compress-video.png) | ![Base64 to Photo tool](screenshots/tool-base64-to-photo.png) |

<p align="center">
  <img src="screenshots/mobile-light.png" alt="Fácil on a mobile phone" width="300">
</p>

## Features

### 🎬 Compress Video
- Pick a video from your device or gallery.
- See file name, original size, duration, resolution, format, and a live preview.
- Choose a **target size** (30 MB / 25 MB / 20 MB / custom) and compress.
- Watch real progress: *Preparing video… → Processing 48% → Almost done…*.
- Get a before/after summary — **Original, Compressed, Saved, Reduction** — and download.

### 🖼️ Compress Image
- Pick a JPEG, PNG, or WebP image.
- See file name, size, dimensions, format, and a preview.
- Control **quality** with a slider, aim for a **target size**, or choose an output format.
- Get the same before/after summary and a one-click download.

### 🔢 Video → Base64
- Convert a video into a `data:video/…;base64,…` Data URL.
- Copy it, download it as `.txt`, and see the exact character count.
- A warning appears for large files; reading happens asynchronously with a progress bar.

### 🔁 Base64 → Video
- Paste a Data URL **or** raw Base64.
- Auto-detect the MIME type, or pick one manually.
- Preview the decoded video and download it.

### 🖼️ Photo → Base64
- Convert an image into a `data:image/…;base64,…` Data URL.
- Copy, download as `.txt`, character count, and a large-file warning.

### 🔁 Base64 → Photo
- Paste a Data URL or raw Base64, auto-detect the type, preview, and download.

## How it works

Every operation is performed by the browser itself. No code runs on a server,
because there is no server.

| Concern | Browser technology used |
| --- | --- |
| Reading files | `FileReader`, `Blob`, `URL.createObjectURL()` |
| Image decode/encode | `Canvas` 2D context, `HTMLCanvasElement.toBlob()` |
| Video re-encoding | `HTMLCanvasElement.captureStream()` + `MediaRecorder` |
| Bitrate targeting | Bitrate math from target bytes ÷ duration |
| Downloads | `Blob` + object URLs, `download` attribute |
| Theme | `localStorage` + `prefers-color-scheme` |

**Video compression** works by drawing the video frame-by-frame onto a canvas,
capturing that canvas as a stream, adding the original audio track, and
re-encoding with `MediaRecorder` at a bitrate calculated to approximate your
target size. It is real encoding, not a mock — which also means it runs in real
time and takes roughly as long as the video itself.

## Tech stack

- **Vanilla HTML, CSS, and JavaScript.** No frameworks, no build step, no bundler.
- **Zero runtime dependencies.** Nothing to `npm install`.
- **Static by nature.** Works on GitHub Pages, Vercel, Netlify, or any plain web server.
- A single web font (**Inter**) is loaded from a public font service for consistent typography. No file you process is ever transmitted.

## Getting started

There is nothing to install or build.

### Option 1 — just open it
```bash
git clone https://github.com/ItsNobodyX/facil.git
cd facil
# open index.html in your browser
```

### Option 2 — serve locally (recommended)
A local server avoids any browser file-access restrictions:
```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

Fácil is a static site. Drop the files onto any static host:

- **GitHub Pages** — push to a repo, enable Pages on the root.
- **Vercel / Netlify** — import the repo; no build command, no output directory needed.
- **Any web server** — copy the files into your web root.

## Browser support

| Browser | Image tools | Base64 tools | Video compression |
| --- | --- | --- | --- |
| Chrome / Edge (recent) | ✅ | ✅ | ✅ |
| Firefox (recent) | ✅ | ✅ | ✅ |
| Safari (recent) | ✅ | ✅ | ✅ (MP4) |
| Mobile Chrome (Android) | ✅ | ✅ | ✅ |
| Mobile Safari (iOS) | ✅ | ✅ | ⚠️ Limited by codec support |

Where a browser cannot perform an operation, Fácil says so plainly instead of
pretending it worked.

## Privacy

- **No uploads.** Files are processed locally and never sent anywhere.
- **No accounts.** Nothing to sign up for, no personal details collected.
- **No analytics or trackers.** No tracking scripts, pixels, or ad code.
- **One local preference.** Your light/dark choice is stored in `localStorage` on your device only.

See [`privacy.html`](privacy.html) for the full policy.

## Limitations (stated honestly)

Fácil would rather be accurate than impressive:

- **Video compression runs in real time.** A 2-minute video takes about 2 minutes to process.
- **Target size is an approximation.** If you ask for 25 MB, Fácil aims for ~25 MB via bitrate math; the exact output depends on the codec and content.
- **Codec support varies by browser.** Some formats can't be decoded or encoded everywhere.
- **Large files need memory.** Very large videos may exceed your device's available RAM.
- **Always keep your originals.** Fácil does not store backups for you.

## Project structure

```
facil/
├── index.html            # Home: hero, tool selector, all six tools
├── styles.css            # Design system + responsive layout
├── script.js             # Theme, router, and all tool logic
├── about.html            # About Us
├── terms.html            # Terms Of Uses
├── privacy.html          # Privacy Policy
├── developer.html        # Developer profile
├── favicon.svg           # Monochrome "F" mark
├── screenshots/          # Images used in this README
└── README.md
```

## Design principles

Fácil follows a restrained, editorial, monochrome visual language:

- Clean, minimal, flat UI with generous whitespace
- Strong typography (Inter, weights 400–600) driving the hierarchy
- Neutral palette — black on white, with a sophisticated neutral dark mode
- Thin borders and **subtle** corner radii — never pill-shaped or bubbly
- Quiet, precise, confident; not flashy, not a dashboard, not a template

## FAQ

**Is my data safe?**
Yes. Your files are processed entirely on your device and are never uploaded.

**Do I need an account?**
No. There are no accounts at all.

**Is there a file-size limit?**
No hard limit, but very large files depend on your device's available memory.

**Why is video compression slow?**
Because it genuinely re-encodes the video in real time in your browser.

**Can I use it offline?**
Once the page and font are loaded, the tools work without a network connection.

**Can I self-host it?**
Yes — copy the files to any static host. There is no backend to configure.

## Roadmap

- [ ] Optional FFmpeg.wasm path for faster-than-real-time video encoding
- [ ] Batch image compression
- [ ] Drag-and-drop file selection
- [ ] Installable PWA with offline caching

## Contributing

Issues and pull requests are welcome. Please keep changes consistent with the
project's principles: **minimal design, real functionality, and no backend.**

## License

No license has been specified for this project yet. Until one is added, all
rights are reserved by the author. If you intend to reuse this code, please
open an issue to discuss a suitable license.

## Author

Built and maintained by **ItsNobodyX**.

- GitHub: [github.com/ItsNobodyX](https://github.com/ItsNobodyX)
- LinkedIn (developer): [Nikhil Kumar](https://www.linkedin.com/in/nikhil-kumar-31b914341)
- LinkedIn (company): [Kimi Technologies](https://www.linkedin.com/company/kimitechnologies/)
- X: [@mrnooffline](https://x.com/mrnooffline)

---

<div align="center">

**Fácil** — *Simple tools. No hassle.*

Made for people who just want the job done, privately.

</div>
