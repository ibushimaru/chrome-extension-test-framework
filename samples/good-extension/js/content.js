// Content script
// Injected into matching pages

(function() {
  'use strict';
  
  // Only run on proper pages
  if (window.location.protocol !== 'https:') {
    return;
  }
  
  // Communicate with background script
  chrome.runtime.sendMessage({ action: 'getData' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }
    
    console.log('Received data:', response.data);
  });
  
  // Example: Add a subtle indicator
  const indicator = document.createElement('div');
  indicator.className = 'good-extension-indicator';
  indicator.textContent = '✓';
  indicator.setAttribute('aria-label', 'Good Extension is active');
  document.body.appendChild(indicator);
})();