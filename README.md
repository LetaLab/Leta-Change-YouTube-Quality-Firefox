# Leta Change YouTube Quality (Firefox Edition)

<p align="left">  
<img src="https://github.com/user-attachments/assets/79b0c0a6-6caa-4d3f-bebb-c1facc760e06" alt="OG" width="15%">
</p>

---

<p align="center">
  <em>Hi, I'm Leta - the mascot of all projects under the LetaLab umbrella!</em><br><br>
  <em>Andrzej brought me to life using Inkscape! I am related to Tux!</em><br>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/e6230a1e-3fbd-48f7-965c-fdb42e52d370" alt="icon-512" width="220">
</p>

---

**Force your preferred YouTube video quality - and keep it that way.**

YouTube loves defaulting to "Auto," which in practice usually means every video starts in whatever quality the algorithm feels like that day - often not a great one. This extension lets you pick a quality once, in a small popup, and then just keeps it that way: every video, every tab, every time you jump to a new one without a full page reload. If a video genuinely doesn't offer the quality you picked, it steps down to the best one that is actually available. It never quietly drops all the way to uncontrolled Auto.

"Leta Change YouTube Quality" is a small, single-purpose extension for Firefox, and it's part of the LetaLab family of projects - you can find the rest of them at [https://LetaLab.eu](https://letalab.eu).

Website is created by me and I do everything that is in my limited power to make it [safe and private](https://www.ssllabs.com/ssltest/analyze.html?d=letalab.eu&hideResults=on&latest).

| SSLLabs Server testing results |
|---|
| <a href="https://github.com/user-attachments/assets/9fe4044b-92f6-4de6-9e65-5fbf79fb4df2"><img width="50%" alt="SSLLabs Server testing results" src="https://github.com/user-attachments/assets/9fe4044b-92f6-4de6-9e65-5fbf79fb4df2" /></a> |

![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![Browsers](https://img.shields.io/badge/Firefox-supported-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of contents

- [Get the extension](#get-the-extension)
- [Screenshots](#screenshots)
- [Features](#features)
- [How it works](#how-it-works)
- [Permissions](#permissions)
- [Privacy and security](#privacy-and-security)
- [Known issues and support](#known-issues-and-support)
- [Directory structure](#directory-structure)
- [License](#license)
- [Credits](#credits)

## Get the extension

The easiest way to install Leta Change YouTube Quality is straight from the official Firefox Add-ons store:

[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-Install-blue)](https://addons.mozilla.org/en-GB/firefox/addon/leta-change-youtube-quality/)

Works on Firefox for desktop and on Firefox for Android through the same listing.

Running Chrome or Edge instead? There's a separate build for that: [Leta Change YouTube Quality for Chrome and Edge](https://github.com/LetaLab/Leta-Change-YouTube-Quality).

## Screenshots

<!-- Replace the two placeholder links below with your own uploaded Firefox screenshot URLs -->

| Popup | Quality enforced on a video |
|---|---|
| <a href="https://github.com/user-attachments/assets/18ef1f54-710a-43aa-be14-f345aeaf2805"><img width="100%" alt="Popup" src="https://github.com/user-attachments/assets/18ef1f54-710a-43aa-be14-f345aeaf2805" /></a> | <a href="https://github.com/user-attachments/assets/45f5156e-e27f-4e3e-92fa-d3cb97ee0885"><img width="100%" alt="Quality enforced" src="https://github.com/user-attachments/assets/45f5156e-e27f-4e3e-92fa-d3cb97ee0885" /></a> |

## Features

- Pick a target quality from one dropdown - anything from 144p up to whatever the video actually offers, plus a "Highest available" option
- Your choice is saved instantly through `chrome.storage.sync` (Firefox's Chrome-compatible storage API) and stays put - no re-prompting, no reset on browser restart, no reset between videos
- Applies on every video load, including YouTube's own internal navigation between videos, so it works without a full page reload
- Also reapplies automatically after seeking, toggling fullscreen, or resizing the window - moments when YouTube can quietly raise or lower the quality ceiling on its own
- Smart fallback: if a video's maximum quality is lower than what you picked (say you want 1440p and the video tops out at 1080p), it selects the highest quality actually available for that video
- A simple ON/OFF toggle in the popup lets you pause enforcement without uninstalling anything - the toolbar icon changes color to match, so you can tell the state at a glance
- Zero configuration beyond that one dropdown - no accounts, no onboarding, no setup wizard
- A small link to letalab.eu at the bottom of the popup - just a plain link that opens in a new tab, nothing tracking it

## How it works

Firefox runs extension content scripts in what's called an isolated JavaScript world by default. A content script can read and modify the page's DOM, but it can't see custom methods that the page attaches directly to its own elements. YouTube's player quality controls, `getAvailableQualityLevels`, `setPlaybackQuality`, and `setPlaybackQualityRange`, are exactly that kind of page-attached method - which was the original reason quality enforcement was silently doing nothing during early development.

To get around it, the extension splits its logic across two content scripts that only ever talk to each other through a single `CustomEvent`:

- **`content-script.js`** runs in the isolated world. It reads `chrome.storage`, notices when the setting changes or a new video loads (including YouTube's single-page-app navigation, seeking, fullscreen changes, and window resizes), and dispatches an apply event
- **`content-script-main.js`** runs in the MAIN world, the only place that can actually see YouTube's player methods. It applies the requested quality, and if that exact tier isn't available for a given video, walks down a ranked list (2160p, 1440p, 1080p, 720p, 480p, 360p, 240p, 144p) until it finds one that is. It also keeps retrying for a few seconds after a video loads, since the player's API isn't always ready the instant the page reports it is

```text
popup (user picks quality)
  -> chrome.storage.sync.set()
       -> content-script.js (isolated world, youtube.com only)
            -> dispatches "leta-cyq-apply" CustomEvent on document
                 -> content-script-main.js (MAIN world)
                      -> #movie_player.setPlaybackQualityRange(target)
```

No network requests anywhere in this chain, no external dependencies, no build step - just vanilla ES2020+ and a Manifest V3 event-driven background script. Running a content script in the MAIN world like this requires Firefox 142 or later, on both desktop and Android.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Remembers your chosen quality and on/off state between sessions |
| `host_permissions`: `*://www.youtube.com/*` | Lets the content script read a video's available qualities and call the player's quality method |

That's genuinely all of it - no `<all_urls>`, no `tabs`, no `cookies`, no `scripting`, no `webRequest`, no `declarativeNetRequest`. If a future version ever needs something new, this table gets updated in the same commit that adds it.

## Privacy and security

- No data collection of any kind - no analytics, no crash reporting, no telemetry, no update-check pings. The extension never contacts any server, including one of its own
- Exactly two values are ever stored, using `chrome.storage.sync`: your preferred quality, and the on/off state
- No remote code loading - the full source ships inside the installed package, nothing is fetched or evaluated at runtime
- No cross-origin requests - the content scripts only ever touch the DOM of the current YouTube tab, and only read publicly available video-player information (no account details, watch history, or comments)
- Declared formally to Mozilla too: `browser_specific_settings.gecko.data_collection_permissions.required` is set to `["none"]` in the manifest
- Full details live in the [Privacy Policy](https://letalab.eu/LetaChangeYouTubeQuality/Privacy_Policy.html), also hosted at [https://LetaLab.eu](https://letalab.eu)

## Known issues and support

The quality-setting call relies on a method exposed by YouTube's own player object that isn't part of YouTube's officially documented API surface. It's a long-standing, widely used technique, but YouTube could change or remove it without notice - if quality suddenly stops applying, that's the most likely cause.

Running into that, or anything else that doesn't behave the way it should? Open a thread in [Issues](https://github.com/LetaLab/Leta-Change-YouTube-Quality-Firefox/issues) and include the console output from a YouTube tab if you can (`Ctrl+Shift+J` opens Firefox's Browser Console) - it makes tracking down the problem much faster.

## Directory structure

```text
├──leta-change-youtube-quality-firefox/
│   ├── manifest.json
│   ├── background.js             background script - toggles the toolbar icon on enable/disable
│   ├── content-script.js         isolated world - reads settings, dispatches an apply event
│   ├── content-script-main.js    main world - the only context that can see YouTube's player API
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
├── icons/
│   │   ├── icon-16.png / icon-16-off.png
│   │   ├── icon-32.png / icon-32-off.png
│   │   ├── icon-48.png / icon-48-off.png
│   │   ├── icon-128.png / icon-128-off.png
│   │   └── letalab-icon-32.png
│   ├── LICENSE
└── README.md              this file
```

## License

MIT - see [`LICENSE`](LICENSE)

## Credits

Built by [LetaLab.eu](https://letalab.eu) - a small collection of tools built for actual daily use.
