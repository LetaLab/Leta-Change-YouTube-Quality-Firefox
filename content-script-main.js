// Main-world content script for www.youtube.com.
//
// Registered with "world": "MAIN" in manifest.json, so it runs inside
// the page's own JavaScript context - the only place the methods
// YouTube attaches to its player element are actually visible.
//
// This script has no access to chrome.storage or any other extension
// API (MAIN-world scripts cannot use chrome.* APIs at all); it only
// reacts to the CustomEvent dispatched by content-script.js, which is
// the isolated-world script that reads the stored preference.

(function () {
  'use strict';

  const EVENT_NAME = 'leta-cyq-apply';

  // Ranked best to worst - used to walk down to the next best
  // available tier when the exact preference can't be met.
  const QUALITY_RANK = [
    'highres', 'hd2160', 'hd1440', 'hd1080', 'hd720',
    'large', 'medium', 'small', 'tiny'
  ];

  let activeTimer = null;

  function getPlayer() {
    return document.getElementById('movie_player');
  }

  function pickTarget(available, preferredQuality) {
    if (!available || !available.length) return null;
    if (preferredQuality === 'highest') return available[0];
    if (available.includes(preferredQuality)) return preferredQuality;

    const idx = QUALITY_RANK.indexOf(preferredQuality);
    if (idx !== -1) {
      for (let i = idx; i < QUALITY_RANK.length; i++) {
        if (available.includes(QUALITY_RANK[i])) return QUALITY_RANK[i];
      }
    }
    // Preference not found in the rank table at all - fall back to
    // whatever the player reports as the best available option.
    return available[0];
  }

  function applyQuality(preferredQuality) {
    const player = getPlayer();
    if (!player || typeof player.getAvailableQualityLevels !== 'function') {
      return false;
    }

    const available = player.getAvailableQualityLevels();
    const target = pickTarget(available, preferredQuality);
    if (!target) return false;

    try {
      if (typeof player.setPlaybackQualityRange === 'function') {
        player.setPlaybackQualityRange(target, target);
      }
      if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(target);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function scheduleApply(preferredQuality) {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
    let attempts = 0;
    activeTimer = setInterval(() => {
      attempts += 1;
      if (applyQuality(preferredQuality) || attempts > 20) { // roughly 8 seconds
        clearInterval(activeTimer);
        activeTimer = null;
      }
    }, 400);
  }

  document.addEventListener(EVENT_NAME, (e) => {
    let payload;
    try {
      payload = JSON.parse(e.detail);
    } catch (err) {
      return;
    }
    if (!payload || !payload.enabled) {
      if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
      }
      return;
    }
    scheduleApply(payload.preferredQuality);
  });
})();
