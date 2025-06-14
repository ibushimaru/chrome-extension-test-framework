// Background service worker
// Following Manifest V3 best practices

// Use chrome.storage for persistent data
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize storage with default values
    await chrome.storage.local.set({
      settings: {
        enabled: true,
        theme: 'light'
      }
    });
    
    console.log('Extension installed successfully');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    // Async operation example
    chrome.storage.local.get(['settings'], (result) => {
      sendResponse({ data: result.settings });
    });
    return true; // Keep message channel open for async response
  }
});

// Service worker lifecycle management
self.addEventListener('activate', event => {
  console.log('Service worker activated');
});

export {};