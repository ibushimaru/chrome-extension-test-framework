// main content script
(function() {
    'use strict';
    
    console.log('main loaded');
    
    // Content script logic
    function init() {
        // Initialization
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();