// Memory leak patterns in background script

// Pattern 1: Growing array that never gets cleared
let dataCache = [];
let requestCount = 0;

// Pattern 2: Event listeners that are never removed
chrome.tabs.onUpdated.addListener(function tabUpdateHandler(tabId, changeInfo, tab) {
    // This creates a new closure each time
    dataCache.push({
        tabId: tabId,
        url: tab.url,
        timestamp: Date.now(),
        largeData: new Array(10000).fill('memory leak')
    });
    
    // Never cleaning up old data
    requestCount++;
});

// Pattern 3: Timers that are never cleared
setInterval(() => {
    // Creating large objects repeatedly
    const leakyObject = {
        data: new Array(100000).fill('leak'),
        timestamp: Date.now(),
        count: requestCount++
    };
    
    // Storing references that prevent garbage collection
    chrome.storage.local.get(['history'], (result) => {
        const history = result.history || [];
        history.push(leakyObject);
        // Never limiting the size of history
        chrome.storage.local.set({ history: history });
    });
}, 1000);

// Pattern 4: Global variables holding large data
let globalCache = {};
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Creating new entries without cleanup
    globalCache[sender.tab.id] = {
        request: request,
        sender: sender,
        timestamp: Date.now(),
        largeBuffer: new ArrayBuffer(1024 * 1024) // 1MB buffer
    };
    
    sendResponse({ status: 'received' });
    return true;
});

// Pattern 5: Recursive setTimeout creating closures
function recursiveLeak() {
    const largeData = new Array(10000).fill(Math.random());
    
    setTimeout(() => {
        // Reference to largeData kept in closure
        console.log(largeData.length);
        recursiveLeak();
    }, 100);
}
recursiveLeak();