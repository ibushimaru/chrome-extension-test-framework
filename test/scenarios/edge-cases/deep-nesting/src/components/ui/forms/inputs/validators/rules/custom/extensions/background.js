// Background script in deeply nested directory
console.log('Background script loaded from deep directory');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});