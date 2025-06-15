// クロスブラウザ互換性の試み
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Firefox特有のAPI
if (typeof browser !== 'undefined' && browser.sidebarAction) {
    browser.sidebarAction.open();
}

// Chrome特有のAPI
if (chrome.enterprise && chrome.enterprise.platformKeys) {
    chrome.enterprise.platformKeys.getCertificates(
        {},
        (certificates) => console.log('Certificates:', certificates)
    );
}

// WebExtensions ポリフィル使用の想定
browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
    console.log('Active tab:', tabs[0]);
});

// ブラウザ検出
const isFirefox = navigator.userAgent.includes('Firefox');
const isChrome = navigator.userAgent.includes('Chrome');
const isEdge = navigator.userAgent.includes('Edg');

if (isFirefox) {
    console.log('Running on Firefox');
} else if (isEdge) {
    console.log('Running on Edge');
} else if (isChrome) {
    console.log('Running on Chrome');
}