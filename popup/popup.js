const qualitySelect = document.getElementById('quality');
const enabledToggle = document.getElementById('enabled');
const status = document.getElementById('status');
let statusTimer = null;

chrome.storage.sync.get(
  { preferredQuality: 'highest', enabled: true },
  (data) => {
    qualitySelect.value = data.preferredQuality;
    enabledToggle.checked = data.enabled;
  }
);

function showSaved() {
  status.classList.add('visible');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    status.classList.remove('visible');
  }, 1500);
}

qualitySelect.addEventListener('change', () => {
  chrome.storage.sync.set({ preferredQuality: qualitySelect.value }, showSaved);
});

enabledToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabledToggle.checked }, showSaved);
});
