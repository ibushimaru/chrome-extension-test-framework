// Simple popup that only shows time
// Doesn't need 99% of the permissions requested

chrome.runtime.sendMessage({action: 'getTime'}, (response) => {
  if (response && response.time) {
    document.getElementById('time').textContent = new Date(response.time).toLocaleTimeString();
  }
});