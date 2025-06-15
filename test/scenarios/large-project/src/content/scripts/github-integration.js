// github-integration content script
(function() {
    'use strict';
    
    console.log('github-integration loaded');
    
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