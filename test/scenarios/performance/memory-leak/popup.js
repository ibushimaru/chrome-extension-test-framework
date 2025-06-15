// Memory leak patterns in popup

// Pattern 1: Accumulating data without cleanup
let clickHistory = [];
let largeDataCache = [];

document.getElementById('leakButton').addEventListener('click', () => {
    // Creating large objects on each click
    const leakData = {
        timestamp: Date.now(),
        randomData: new Array(10000).fill(Math.random()),
        domSnapshot: document.body.innerHTML,
        clickCount: clickHistory.length
    };
    
    clickHistory.push(leakData);
    largeDataCache.push(new ArrayBuffer(1024 * 512)); // 512KB
    
    // Never cleaned references
    chrome.storage.local.get(['popupData'], (result) => {
        const data = result.popupData || [];
        data.push(leakData);
        chrome.storage.local.set({ popupData: data });
    });
    
    document.getElementById('status').textContent = 
        `Leaks created: ${clickHistory.length}`;
});

// Pattern 2: Timer without cleanup
let intervalId = setInterval(() => {
    const tempData = new Array(1000).fill('leak');
    // Keeping reference in closure
    console.log('Interval running:', tempData.length);
}, 100);

// Pattern 3: Event listeners that accumulate
window.addEventListener('unload', () => {
    // This won't properly clean up
    console.log('Popup closing with', clickHistory.length, 'leaks');
});