// Simulated large vendor library (lodash size equivalent)
(function(global) {
    'use strict';
    
    const Library2 = {
        // Array utilities
        array: {},
        // Object utilities  
        object: {},
        // String utilities
        string: {},
        // Function utilities
        func: {},
        // Collection utilities
        collection: {}
    };
    
    // Simulate lodash-like utility functions
    const categories = ['array', 'object', 'string', 'func', 'collection'];
    
    categories.forEach(category => {
        // Add 100 functions per category
        for (let i = 0; i < 100; i++) {
            Library2[category][`method${i}`] = function(...args) {
                // Simulated implementation with unnecessary complexity
                const temp = new Array(100).fill(args);
                return temp.reduce((acc, val) => {
                    return acc.concat(val.map(v => {
                        if (typeof v === 'object') {
                            return JSON.parse(JSON.stringify(v));
                        }
                        return v;
                    }));
                }, []);
            };
            
            // Add variations of each method
            Library2[category][`method${i}By`] = function(arr, iteratee) {
                return Library2[category][`method${i}`](arr.map(iteratee));
            };
            
            Library2[category][`method${i}Right`] = function(...args) {
                return Library2[category][`method${i}`](...args.reverse());
            };
        }
    });
    
    // Add chaining functionality (increases size significantly)
    Library2.chain = function(value) {
        const wrapper = {
            _value: value,
            value: function() { return this._value; }
        };
        
        // Add all methods to chain
        Object.keys(Library2).forEach(category => {
            if (typeof Library2[category] === 'object') {
                Object.keys(Library2[category]).forEach(method => {
                    wrapper[method] = function(...args) {
                        this._value = Library2[category][method](this._value, ...args);
                        return this;
                    };
                });
            }
        });
        
        return wrapper;
    };
    
    // Duplicate implementations for "performance"
    Library2.fastArray = { ...Library2.array };
    Library2.fastObject = { ...Library2.object };
    
    global.Library2 = Library2;
    global._ = Library2; // lodash-style alias
    
})(this);