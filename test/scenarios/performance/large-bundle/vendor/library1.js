// Simulated large vendor library (moment.js size equivalent)
(function(global) {
    'use strict';
    
    // Large library with many features, most unused
    const Library1 = {
        // Date manipulation (like moment.js)
        dateUtils: {},
        // Localization data for 100+ languages
        locales: {},
        // Timezone data
        timezones: {},
        // Formatting functions
        formatters: {}
    };
    
    // Simulate large locale data
    const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    languages.forEach(lang => {
        Library1.locales[lang] = {
            months: new Array(12).fill(0).map((_, i) => `Month_${i}_${lang}`),
            days: new Array(7).fill(0).map((_, i) => `Day_${i}_${lang}`),
            numbers: new Array(1000).fill(0).map((_, i) => `Num_${i}_${lang}`),
            // Lots of unnecessary translation data
            phrases: new Array(500).fill(0).reduce((acc, _, i) => {
                acc[`phrase_${i}`] = `Translation for phrase ${i} in ${lang}`;
                return acc;
            }, {})
        };
    });
    
    // Simulate timezone database
    for (let i = 0; i < 500; i++) {
        Library1.timezones[`TZ_${i}`] = {
            offset: (i - 250) * 30,
            dst: i % 2 === 0,
            name: `Timezone_${i}`,
            rules: new Array(50).fill({
                from: '2000-01-01',
                to: '2050-12-31',
                offset: i * 60
            })
        };
    }
    
    // Add hundreds of utility functions
    for (let i = 0; i < 200; i++) {
        Library1.dateUtils[`util${i}`] = function(date) {
            return new Date(date.getTime() + i * 1000);
        };
        
        Library1.formatters[`format${i}`] = function(date) {
            return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-Format${i}`;
        };
    }
    
    // Export to global
    global.Library1 = Library1;
    
})(this);

// Add more bulk to simulate a real large library
const PADDING = new Array(10000).fill('x').join('');
console.log(PADDING.length); // This will be removed by minification but adds to bundle size