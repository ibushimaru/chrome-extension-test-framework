// Large bundled background script with unnecessary dependencies

// Simulating a large library import (would normally be minified)
const LARGE_CONSTANTS = {
    // Huge configuration object that could be loaded dynamically
    config: new Array(10000).fill(0).map((_, i) => ({
        id: i,
        name: `Config_${i}`,
        value: Math.random(),
        metadata: {
            created: new Date().toISOString(),
            version: '1.0.0',
            flags: new Array(100).fill(false),
            data: new Array(100).fill('x').join('')
        }
    })),
    
    // Unnecessary data bundled into the script
    lookupTable: new Array(50000).fill(0).reduce((acc, _, i) => {
        acc[`key_${i}`] = {
            value: i * Math.PI,
            sqrt: Math.sqrt(i),
            log: Math.log(i + 1),
            sin: Math.sin(i),
            cos: Math.cos(i)
        };
        return acc;
    }, {}),
    
    // Large strings that should be external resources
    templates: {
        html: `<div class="container">${new Array(1000).fill('<div class="item">Template content</div>').join('')}</div>`,
        css: new Array(500).fill('.class { property: value; }').join('\n'),
        svg: new Array(100).fill('<svg><circle cx="50" cy="50" r="40"/></svg>').join('')
    }
};

// Simulating bundled third-party libraries
const BUNDLED_LIBRARY_1 = (function() {
    // Mock large library code
    const lib = {};
    for (let i = 0; i < 1000; i++) {
        lib[`method${i}`] = function() {
            return new Array(100).fill(i).reduce((a, b) => a + b, 0);
        };
    }
    return lib;
})();

const BUNDLED_LIBRARY_2 = (function() {
    // Another mock library with duplicate functionality
    const utils = {};
    for (let i = 0; i < 500; i++) {
        utils[`util${i}`] = {
            process: (data) => data,
            validate: (data) => true,
            transform: (data) => data,
            serialize: (data) => JSON.stringify(data),
            deserialize: (data) => JSON.parse(data)
        };
    }
    return utils;
})();

// Duplicated code that should be shared
function processDataMethod1(data) {
    return data.map(item => ({
        ...item,
        processed: true,
        timestamp: Date.now(),
        hash: Math.random().toString(36)
    }));
}

function processDataMethod2(data) {
    // Almost identical to method1
    return data.map(item => ({
        ...item,
        processed: true,
        timestamp: Date.now(),
        hash: Math.random().toString(36)
    }));
}

function processDataMethod3(data) {
    // Yet another duplicate
    return data.map(item => ({
        ...item,
        processed: true,
        timestamp: Date.now(),
        hash: Math.random().toString(36)
    }));
}

// Unused code that increases bundle size
class UnusedFeature1 {
    constructor() {
        this.data = new Array(10000).fill('unused');
    }
    
    unusedMethod() {
        return this.data.map(x => x.toUpperCase());
    }
}

class UnusedFeature2 {
    constructor() {
        this.cache = new Map();
        for (let i = 0; i < 1000; i++) {
            this.cache.set(i, new Array(100).fill(i));
        }
    }
}

// Dead code
if (false) {
    const deadCode = new Array(50000).fill('dead').join('');
    console.log(deadCode);
}

// Actual extension logic (tiny compared to bundle)
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse({ status: 'ok' });
});