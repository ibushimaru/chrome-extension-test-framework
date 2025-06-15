// 古いAPIの使用（Manifest V3では非推奨または削除）
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log('Request intercepted:', details);
    },
    {urls: ["<all_urls>"]},
    ["blocking"]
);

// chrome.storage.sync の古い使用法（同期的に使用しようとする）
const data = chrome.storage.sync.get('key'); // 実際は非同期

// 古いタブAPI
chrome.tabs.getAllInWindow(null, function(tabs) {
    console.log('All tabs:', tabs);
});