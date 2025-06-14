// Popup script
// Handles popup UI interactions

import { i18n } from './utils/i18n.js';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Apply translations
  i18n.translateDocument();
  
  // Get current settings
  const { settings } = await chrome.storage.local.get(['settings']);
  
  // Handle button click
  const button = document.getElementById('actionButton');
  button.addEventListener('click', async () => {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'performAction' 
      });
      console.log('Action performed:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  });
});