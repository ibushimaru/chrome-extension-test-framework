// Background script that barely uses any of the requested permissions

// Only using storage, but has access to everything
chrome.storage.local.set({installTime: Date.now()});

// Simple message handler that doesn't need most permissions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTime') {
    sendResponse({time: Date.now()});
  }
});

// Unused permissions examples:
// - Not using cookies API despite having permission
// - Not using downloads API despite having permission
// - Not using history API despite having permission
// - Not using bookmarks API despite having permission
// - Not using webRequest API despite having permission
// - Not using proxy API despite having permission
// - Not using debugger API despite having permission