// Content script with insecure storage practices

// BAD: Hardcoded credentials in content script (accessible to web page)
const SERVICE_API_KEY = 'service-key-123456';
const WEBHOOK_SECRET = 'webhook-secret-abcdef';

// BAD: Using localStorage in content script (shared with web page)
function storeUserData() {
  // This localStorage is the web page's localStorage!
  localStorage.setItem('extension_api_key', SERVICE_API_KEY);
  localStorage.setItem('user_session', 'session_123456');
  
  // Getting form data and storing insecurely
  const passwordField = document.querySelector('input[type="password"]');
  if (passwordField) {
    localStorage.setItem('captured_password', passwordField.value);
  }
}

// BAD: Exposing sensitive data to the web page
window.postMessage({
  type: 'EXTENSION_DATA',
  apiKey: SERVICE_API_KEY,
  webhookSecret: WEBHOOK_SECRET
}, '*');

// BAD: Injecting sensitive data into DOM
const script = document.createElement('script');
script.textContent = `
  window.EXTENSION_API_KEY = '${SERVICE_API_KEY}';
  window.EXTENSION_SECRET = '${WEBHOOK_SECRET}';
`;
document.head.appendChild(script);

// BAD: Storing data in DOM attributes
document.body.setAttribute('data-api-key', SERVICE_API_KEY);
document.body.setAttribute('data-user-token', 'user-token-xyz');

// Listening for sensitive data from page
window.addEventListener('message', (event) => {
  if (event.data.type === 'CREDENTIALS') {
    // BAD: Trusting and storing data from web page
    chrome.storage.local.set({
      pageCredentials: event.data.credentials
    });
  }
});