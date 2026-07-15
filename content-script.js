// Isolated-world content script for www.youtube.com.
//
// Chrome extension content scripts run in an isolated JavaScript
// context by default: they can see and modify the DOM, but they
// cannot see custom JavaScript methods that the page's own scripts
// attach directly onto DOM elements. YouTube's player quality API
// (getAvailableQualityLevels / setPlaybackQuality /
// setPlaybackQualityRange) is exactly that kind of page-attached
// method, so it is not reachable from here - this was the root
// cause of quality enforcement silently doing nothing.
//
// This script only does what the isolated world CAN do: read
// chrome.storage, detect when settings change or a new video loads,
// and hand off the actual quality change to content-script-main.js,
// which runs in the page's own (MAIN) world and can see those
// methods. The two scripts communicate through a CustomEvent on
// document - events cross the isolated/main world boundary even
// though direct property access does not.

(function () {
  'use strict';

  const EVENT_NAME = 'leta-cyq-apply';

  let enabled = true;
  let preferredQuality = 'highest';

  function dispatchApply() {
    document.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: JSON.stringify({ enabled, preferredQuality })
    }));
  }

  function loadSettings(callback) {
    chrome.storage.sync.get(
      { preferredQuality: 'highest', enabled: true },
      (data) => {
        preferredQuality = data.preferredQuality;
        enabled = data.enabled;
        callback();
      }
    );
  }

  function watchSeeks(video) {
    if (video.dataset.qualityWatcherAttached === '1') return;
    video.dataset.qualityWatcherAttached = '1';
    video.addEventListener('seeked', () => setTimeout(dispatchApply, 300));
  }

  loadSettings(dispatchApply);

  // YouTube is a single-page app - switching videos does not reload
  // the page, so a plain page 'load' listener would miss every video
  // after the first one.
  document.addEventListener('yt-navigate-finish', () => loadSettings(dispatchApply));

  // Capture phase: 'loadedmetadata' does not bubble, and this catches
  // it regardless, for whichever <video> element YouTube is currently
  // using.
  document.addEventListener('loadedmetadata', (e) => {
    if (e.target && e.target.tagName === 'VIDEO') watchSeeks(e.target);
  }, true);

  // YouTube can raise the ceiling on selectable quality once the
  // player is displayed larger (for example fullscreen) - re-apply
  // when that changes, in case the previous attempt was capped by
  // player size rather than by the video's real maximum.
  document.addEventListener('fullscreenchange', () => setTimeout(dispatchApply, 300));

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(dispatchApply, 500);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.preferredQuality) preferredQuality = changes.preferredQuality.newValue;
    if (changes.enabled) enabled = changes.enabled.newValue;
    if (changes.preferredQuality || changes.enabled) dispatchApply();
  });
})();
