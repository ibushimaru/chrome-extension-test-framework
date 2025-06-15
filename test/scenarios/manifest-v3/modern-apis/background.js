// モダンなAPIの使用例

// chrome.scripting.executeScriptの使用（推奨）
chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
        document.body.style.backgroundColor = 'red';
    }
});

// chrome.scripting.insertCSSの使用（推奨）
chrome.scripting.insertCSS({
    target: { tabId: tabId },
    css: 'body { background-color: blue; }'
});

// chrome.storage.localの使用（推奨）
chrome.storage.local.set({ apiKey: 'secret-key-123' }, () => {
    console.log('API key saved');
});

chrome.storage.local.get(['apiKey'], (result) => {
    console.log('API key retrieved:', result.apiKey);
});

// chrome.storage.syncの使用（クォータチェック付き）
const data = { largeData: 'x'.repeat(1000) };
chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
    if (bytesInUse < chrome.storage.sync.QUOTA_BYTES * 0.9) {
        chrome.storage.sync.set(data);
    } else {
        console.warn('Sync storage quota nearly full');
        chrome.storage.local.set(data);
    }
});

// chrome.storage.sessionの使用（Chrome 102+）
chrome.storage.session.set({ tempData: { foo: 'bar' } });