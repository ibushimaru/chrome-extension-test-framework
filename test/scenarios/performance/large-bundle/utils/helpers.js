// Utility helpers with lots of duplicate and unused code

// Duplicate array utilities (Library2 already has these)
const ArrayHelpers = {
    map: (arr, fn) => arr.map(fn),
    filter: (arr, fn) => arr.filter(fn),
    reduce: (arr, fn, init) => arr.reduce(fn, init),
    forEach: (arr, fn) => arr.forEach(fn),
    find: (arr, fn) => arr.find(fn),
    findIndex: (arr, fn) => arr.findIndex(fn),
    every: (arr, fn) => arr.every(fn),
    some: (arr, fn) => arr.some(fn),
    includes: (arr, val) => arr.includes(val),
    
    // Unnecessary custom implementations
    customMap: function(arr, fn) {
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            result.push(fn(arr[i], i, arr));
        }
        return result;
    },
    
    customFilter: function(arr, fn) {
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            if (fn(arr[i], i, arr)) {
                result.push(arr[i]);
            }
        }
        return result;
    }
};

// Duplicate string utilities
const StringHelpers = {
    trim: (str) => str.trim(),
    toUpperCase: (str) => str.toUpperCase(),
    toLowerCase: (str) => str.toLowerCase(),
    split: (str, sep) => str.split(sep),
    replace: (str, search, replace) => str.replace(search, replace),
    
    // Bloated implementations
    customTrim: function(str) {
        let start = 0;
        let end = str.length - 1;
        while (start < str.length && str[start] === ' ') start++;
        while (end >= 0 && str[end] === ' ') end--;
        return str.substring(start, end + 1);
    },
    
    // Unused complex functions
    levenshteinDistance: function(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
};

// Duplicate DOM utilities (Library3 already has these)
const DOMHelpers = {
    getElementById: (id) => document.getElementById(id),
    getElementsByClassName: (className) => document.getElementsByClassName(className),
    querySelector: (selector) => document.querySelector(selector),
    querySelectorAll: (selector) => document.querySelectorAll(selector),
    createElement: (tag) => document.createElement(tag),
    
    // Unnecessary wrappers
    createElementWithAttrs: function(tag, attrs) {
        const element = document.createElement(tag);
        Object.keys(attrs).forEach(key => {
            element.setAttribute(key, attrs[key]);
        });
        return element;
    },
    
    // Complex unused utilities
    deepCloneNode: function(node) {
        const clone = node.cloneNode(false);
        if (node.hasChildNodes()) {
            node.childNodes.forEach(child => {
                clone.appendChild(this.deepCloneNode(child));
            });
        }
        return clone;
    }
};

// Huge constants object
const CONSTANTS = {
    // Unnecessary data
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 
             'July', 'August', 'September', 'October', 'November', 'December'],
    DAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    
    // Large lookup tables
    COLOR_CODES: new Array(1000).fill(0).reduce((acc, _, i) => {
        acc[`color${i}`] = `#${i.toString(16).padStart(6, '0')}`;
        return acc;
    }, {}),
    
    // Unused configuration
    CONFIG: {
        features: new Array(100).fill(0).map((_, i) => ({
            id: `feature_${i}`,
            enabled: false,
            settings: {
                option1: 'value1',
                option2: 'value2',
                option3: 'value3'
            }
        }))
    }
};

// Export everything (increases bundle size)
window.ArrayHelpers = ArrayHelpers;
window.StringHelpers = StringHelpers;
window.DOMHelpers = DOMHelpers;
window.CONSTANTS = CONSTANTS;