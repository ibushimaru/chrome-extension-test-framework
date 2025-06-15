// Heavy computation patterns that block the main thread

// Pattern 1: Synchronous heavy calculations on message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'calculate') {
        // Blocking computation
        let result = 0;
        for (let i = 0; i < 100000000; i++) {
            result += Math.sqrt(i) * Math.sin(i);
        }
        sendResponse({ result: result });
    }
    return true;
});

// Pattern 2: Large data processing without chunks
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Processing large array synchronously
        const hugeArray = new Array(1000000).fill(0).map((_, i) => i);
        const processed = hugeArray.map(num => {
            // Complex calculation for each item
            return Math.pow(num, 3) + Math.sqrt(num) - Math.log(num + 1);
        }).filter(num => num > 1000);
        
        console.log('Processed', processed.length, 'items');
    }
});

// Pattern 3: Recursive Fibonacci without memoization
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Pattern 4: Prime number calculation (inefficient)
function isPrime(num) {
    for (let i = 2; i < num; i++) {
        if (num % i === 0) return false;
    }
    return num > 1;
}

// Pattern 5: Blocking initialization
(function init() {
    // Finding all primes up to 50000 on startup
    const primes = [];
    for (let i = 2; i < 50000; i++) {
        if (isPrime(i)) {
            primes.push(i);
        }
    }
    console.log('Found', primes.length, 'primes on startup');
})();

// Pattern 6: Sorting large arrays repeatedly
chrome.runtime.onInstalled.addListener(() => {
    const largeArray = new Array(100000).fill(0).map(() => Math.random());
    
    // Sorting multiple times unnecessarily
    for (let i = 0; i < 10; i++) {
        const sorted = [...largeArray].sort((a, b) => a - b);
        console.log('Sort iteration', i, 'complete');
    }
});

// Pattern 7: Nested loops with DOM-like operations
function processComplexData() {
    const data = [];
    for (let i = 0; i < 1000; i++) {
        for (let j = 0; j < 1000; j++) {
            data.push({
                x: i,
                y: j,
                value: Math.sin(i) * Math.cos(j)
            });
        }
    }
    return data;
}

// Running heavy computation periodically
setInterval(() => {
    const start = Date.now();
    processComplexData();
    console.log('Heavy computation took', Date.now() - start, 'ms');
}, 5000);