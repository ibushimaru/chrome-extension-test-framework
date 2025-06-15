// XSS vulnerabilities in JavaScript

// Getting user input from storage and displaying without sanitization
chrome.storage.local.get(['userMessages'], function(result) {
  if (result.userMessages) {
    // Dangerous: inserting HTML directly
    document.getElementById('userContent').innerHTML = result.userMessages;
  }
});

// Handling user input unsafely
document.addEventListener('DOMContentLoaded', function() {
  // Getting URL parameters unsafely
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  
  if (message) {
    // XSS vulnerability: directly inserting user input
    document.body.innerHTML += '<div class="message">' + message + '</div>';
  }
  
  // Creating elements with user input
  const createDiv = (content) => {
    const div = document.createElement('div');
    // Dangerous: setting innerHTML with user content
    div.innerHTML = content;
    document.body.appendChild(div);
  };
  
  // Example of unsafe DOM manipulation
  chrome.storage.local.get(['customHTML'], function(result) {
    if (result.customHTML) {
      createDiv(result.customHTML);
    }
  });
});