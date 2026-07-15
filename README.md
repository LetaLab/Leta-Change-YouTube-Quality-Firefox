# Leta Change YouTube Quality (Firefox Edition)

---

<h2 align="center">
  <strong>! WORK IN PROGRESS - SECURITY REVIEW WELCOME !</strong>
</h2>

> **This project is built with the assistance of Anthropic Claude, as part of the LetaLab family of projects.**
>
> There is no intentional malicious code in this repository.  
> The Firefox extension requests exactly one permission (`storage`) and access to exactly one site (`youtube.com`) - nothing else, by design.
>
> Responsible security review is genuinely welcome. If you find a problem, please report it privately and with enough detail to reproduce it.
>
> Provided under the MIT License, without warranty.

---

**Force your preferred YouTube video quality - and keep it that way.**

A tiny, single-purpose Firefox WebExtension. Pick a quality once in the popup; it applies automatically on every video and falls back to the highest quality actually available when your preferred one isn't offered – it never silently drops playback to YouTube's uncontrolled "Auto".

![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![Browsers](https://img.shields.io/badge/Firefox-supported-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- One popup, one dropdown: pick a target quality, from 144p up to whatever YouTube offers for a given video
- The setting is saved immediately (`browser.storage.sync`) and persists until you change it again
- Applies on every video load, including YouTube's internal SPA navigation
- Fallback logic: if your preferred quality is unavailable, the extension selects the highest quality actually offered
- ON/OFF toggle in the popup with icon state
- Zero configuration beyond the one dropdown
- A small link to letalab.eu at the bottom of the popup – plain link, no tracking

---

## Architecture and Firefox-specific notes

- Zero external dependencies – no npm, no bundler, no build step
- Zero JavaScript frameworks – vanilla ES2020+
- Manifest V3 event-driven background service worker (Firefox supports MV3 as of 2026)
- Two content scripts, both registered for `youtube.com` only:
  - isolated-world script that reads `browser.storage`
  - main-world script that calls YouTube's player quality methods
- Communication between scripts uses a single `CustomEvent`
- No network requests anywhere in the codebase
- No remote code execution
- No telemetry, analytics, crash reporting, or update-check pings

---

## Known issues

- The quality-setting call relies on a method exposed by YouTube's player object that is not part of YouTube's documented API. YouTube may change or remove it without notice. If quality stops applying, please open an issue with the browser console output from a YouTube tab.

---

## Permissions

| Permission | Why |
|---|---|
| `storage` | Remembers your chosen quality and on/off state |
| `host_permissions`: `*://www.youtube.com/*` | Required to read available qualities and call the player's quality method |

Firefox-specific:

- `browser_specific_settings.gecko.data_collection_permissions` is set to an empty list because the extension does not collect any data.

---

## Security notes

- No remote code loading  
- No cross-origin requests  
- No background persistence beyond MV3 requirements  
- No data collection of any kind  

---

## Testing: temporary installation from a ZIP file

To test the extension in Firefox without publishing it or signing it, load it as a **temporary add-on**. This works directly with a `.zip` (or `.xpi`) file, or with the unpacked folder.

1. Build the package (only if you don't already have a `.zip`):
   ```bash
   cd "Leta Change YouTube Quality Firefox"
   zip -r -FS ../leta-change-youtube-quality.zip * -x '*.git*'
   ```
   The zip must contain the extension's files at the **root** of the archive (i.e. `manifest.json` directly inside the zip, not inside a subfolder).
2. Open Firefox and go to `about:debugging`.
3. Click **This Firefox** in the left sidebar.
4. Click **Load Temporary Add-on…**.
5. In the file picker, select the `.zip` file (or, if testing from the unpacked folder, select `manifest.json` inside it).
6. The extension loads immediately and appears in the list with a **Reload** button, and its icon shows up in the toolbar.

Notes:

- The temporary add-on is removed automatically when Firefox restarts – you'll need to reload it each session during testing.
- After changing any source file, click **Reload** on `about:debugging` instead of removing/re-adding it.
- No signing is required for temporary installation, so this is the fastest way to test changes before publishing to AMO.
- To check for errors, open the **Browser Console** (`Ctrl+Shift+J`) after loading – manifest or runtime errors show up there.

---

## Directory structure

```text
./
├── LICENSE
├── README.md
├── background.js
├── content-script-main.js
├── content-script.js
├── icons
│   ├── icon-128-off.png
│   ├── icon-128.png
│   ├── icon-16-off.png
│   ├── icon-16.png
│   ├── icon-32-off.png
│   ├── icon-32.png
│   ├── icon-48-off.png
│   ├── icon-48.png
│   └── letalab-icon-32.png
├── manifest.json
└── popup
    ├── popup.css
    ├── popup.html
    └── popup.js
```