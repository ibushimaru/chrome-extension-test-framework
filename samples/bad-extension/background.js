// Bad background script with issues

// Not using service worker features properly
var globalState = {};

// Synchronous XMLHttpRequest - deprecated
function fetchDataSync() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://insecure-api.example.com/data', false); // Synchronous + HTTP
  xhr.send();
  return xhr.responseText;
}

// Memory leak - never cleaned up
var leakyArray = [];
setInterval(function() {
  leakyArray.push(new Array(1000000).fill('memory leak'));
}, 1000);

// Listening to all web requests - performance issue
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log('Intercepting:', details.url);
    // Blocking all requests is bad!
  },
  {urls: ["<all_urls>"]},
  ["blocking"]
);

// Using deprecated APIs
chrome.tabs.getAllInWindow(null, function(tabs) {
  console.log('All tabs:', tabs);
});

// No error handling
chrome.storage.local.set({key: undefined}, function() {
  // This will fail silently
});