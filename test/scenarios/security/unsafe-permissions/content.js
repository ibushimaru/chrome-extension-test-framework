// Content script that runs on ALL websites but does almost nothing

console.log('Extension loaded');

// This simple functionality doesn't justify:
// - Running on all URLs
// - Running in all frames
// - Running at document_start
// - Having access to all the permissions