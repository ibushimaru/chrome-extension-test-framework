// Background script with insecure storage practices

// Hardcoded API keys and secrets (NEVER DO THIS!)
const API_KEY = 'sk-1234567890abcdef1234567890abcdef';
const SECRET_TOKEN = 'secret_token_123456789';
const DATABASE_PASSWORD = 'admin123';

// Storing sensitive data in plain text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveCredentials') {
    // BAD: Storing passwords in plain text
    chrome.storage.local.set({
      username: request.username,
      password: request.password, // Storing password without encryption
      apiKey: API_KEY,
      secretToken: SECRET_TOKEN
    });
    
    // Also storing in sync storage (even worse - syncs across devices)
    chrome.storage.sync.set({
      userPassword: request.password,
      creditCard: request.creditCard // Storing credit card info!
    });
  }
  
  if (request.action === 'saveToken') {
    // BAD: Storing authentication tokens in plain text
    chrome.storage.local.set({
      authToken: request.token,
      refreshToken: request.refreshToken,
      sessionId: request.sessionId
    });
  }
});

// Exposing sensitive data through runtime API
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'getApiKey') {
    // BAD: Sending API key to external sources
    sendResponse({apiKey: API_KEY});
  }
});