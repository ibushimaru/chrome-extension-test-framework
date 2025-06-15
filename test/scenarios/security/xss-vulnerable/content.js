// Content script with XSS vulnerabilities

// Injecting user content into the page unsafely
function injectUserContent(content) {
  // Dangerous: using innerHTML
  const div = document.createElement('div');
  div.innerHTML = content;
  document.body.appendChild(div);
}

// Listening for messages and executing them unsafely
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertHTML') {
    // XSS vulnerability: inserting arbitrary HTML
    document.body.innerHTML += request.html;
  }
  
  if (request.action === 'updateElement') {
    const element = document.getElementById(request.id);
    if (element) {
      // Dangerous: setting innerHTML from external source
      element.innerHTML = request.content;
    }
  }
});

// Getting data from page and using it unsafely
const pageData = document.body.getAttribute('data-user-content');
if (pageData) {
  // XSS vulnerability: trusting page content
  injectUserContent(pageData);
}