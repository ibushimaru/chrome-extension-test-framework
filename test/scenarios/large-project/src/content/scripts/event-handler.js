// event-handler content script
(function() {
    'use strict';
    
    console.log('event-handler loaded');
    
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