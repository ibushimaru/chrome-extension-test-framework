// Content script that uses only a tiny fraction of the bundled libraries

// Actual extension functionality (10 lines)
console.log('Extension loaded');

// Only using one function from each massive library
Library1.dateUtils.util0(new Date()); // Using 1 of 200 functions
Library2.array.method0([1, 2, 3]);     // Using 1 of 500 functions  
Library3('body').addClass('extension-loaded'); // Using 1 of 100+ methods

// The rest is unused bundled code that increases load time

// More unnecessary bundled data
const BUNDLED_DATA = {
    // Configuration that could be fetched dynamically
    settings: new Array(1000).fill(0).map((_, i) => ({
        key: `setting_${i}`,
        value: `value_${i}`,
        description: `This is the description for setting ${i}`,
        metadata: {
            type: 'string',
            default: 'default',
            validation: /^[a-zA-Z0-9]+$/,
            dependencies: [`setting_${(i + 1) % 1000}`, `setting_${(i + 2) % 1000}`]
        }
    })),
    
    // Templates that should be separate files
    templates: {
        popup: `
            <div class="popup-container">
                ${new Array(50).fill('<div class="item">Item</div>').join('')}
            </div>
        `,
        options: `
            <div class="options-container">
                ${new Array(100).fill('<input type="checkbox">').join('')}
            </div>
        `,
        sidebar: `
            <div class="sidebar">
                ${new Array(200).fill('<a href="#">Link</a>').join('')}
            </div>
        `
    },
    
    // Inline styles that should be in CSS files
    styles: `
        ${new Array(500).fill(0).map((_, i) => 
            `.class-${i} { margin: ${i}px; padding: ${i}px; color: #${i.toString(16).padStart(6, '0')}; }`
        ).join('\n')}
    `
};

// Duplicate implementations of library functions
function customDateFormat(date) {
    // Reimplementing what Library1 already provides
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function customArrayMap(array, fn) {
    // Reimplementing what Library2 already provides
    const result = [];
    for (let i = 0; i < array.length; i++) {
        result.push(fn(array[i]));
    }
    return result;
}

function customQuerySelector(selector) {
    // Reimplementing what Library3 already provides
    return document.querySelector(selector);
}

// Polyfills for features that are already supported
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

// Feature detection code that's unnecessary for modern browsers
const FEATURE_DETECTION = {
    hasQuerySelector: !!document.querySelector,
    hasClassList: !!document.body.classList,
    hasDataset: !!document.body.dataset,
    hasLocalStorage: !!window.localStorage,
    hasJSON: !!window.JSON,
    hasPromise: !!window.Promise,
    hasMap: !!window.Map,
    hasSet: !!window.Set
};

console.log('Bundle loaded with', Object.keys(BUNDLED_DATA.settings).length, 'unused settings');