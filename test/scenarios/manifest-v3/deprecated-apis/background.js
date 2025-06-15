// 廃止されたAPIの使用例

// tabs.executeScriptの使用（廃止）
chrome.tabs.executeScript(tabId, {
    code: 'document.body.style.backgroundColor = "red";'
});

// tabs.insertCSSの使用（廃止）
chrome.tabs.insertCSS(tabId, {
    code: 'body { background-color: blue; }'
});

// localStorageの使用（非推奨）
localStorage.setItem('apiKey', 'secret-key-123');
const apiKey = localStorage.getItem('apiKey');

// sessionStorageの使用（非推奨）
sessionStorage.setItem('tempData', JSON.stringify({ foo: 'bar' }));