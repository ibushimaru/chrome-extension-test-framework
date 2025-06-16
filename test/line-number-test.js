/**
 * Test to verify line number accuracy
 */

const ContextAwareDetector = require('../lib/ContextAwareDetector');
const fs = require('fs');
const path = require('path');

// Create a test file with known content
const testContent = `// Line 1
const test = 'hello'; // Line 2
// Line 3
// Line 4
element.innerHTML = userInput; // Line 5 - should detect this
// Line 6
// Line 7
localStorage.setItem('key', 'value'); // Line 8 - should detect this
// Line 9
console.log('test'); // Line 10 - should detect this
`.trim();

// Create a large test file to test line numbers beyond 1000
const largeTestContent = Array.from({ length: 2000 }, (_, i) => {
    if (i === 1412) {
        return `element.innerHTML = dangerous; // Line ${i + 1} - dangerous innerHTML`;
    }
    if (i === 1499) {
        return `localStorage.setItem('sensitive', data); // Line ${i + 1}`;
    }
    if (i === 1547) {
        return `console.log('debug'); // Line ${i + 1}`;
    }
    return `// Line ${i + 1}`;
}).join('\n');

console.log('🧪 Testing line number accuracy...\n');

// Test 1: Small file
console.log('Test 1: Small file (10 lines)');
const detector = new ContextAwareDetector();

const innerHTMLIssues = detector.detectUnsafeInnerHTML(testContent, 'test.js');
console.log('innerHTML issues:', innerHTMLIssues.map(i => ({ line: i.line, message: i.message })));

const localStorageIssues = detector.detectLocalStorageUsage(testContent, 'test.js');
console.log('localStorage issues:', localStorageIssues.map(i => ({ line: i.line, message: i.message })));

const consoleIssues = detector.detectConsoleUsage(testContent, 'test.js');
console.log('console issues:', consoleIssues.map(i => ({ line: i.line, message: i.message })));

// Test 2: Large file
console.log('\n\nTest 2: Large file (2000 lines)');

const largeInnerHTMLIssues = detector.detectUnsafeInnerHTML(largeTestContent, 'large-test.js');
console.log('innerHTML issues:', largeInnerHTMLIssues.map(i => ({ line: i.line, message: i.message })));

const largeLSIssues = detector.detectLocalStorageUsage(largeTestContent, 'large-test.js');
console.log('localStorage issues:', largeLSIssues.map(i => ({ line: i.line, message: i.message })));

const largeConsoleIssues = detector.detectConsoleUsage(largeTestContent, 'large-test.js');
console.log('console issues:', largeConsoleIssues.map(i => ({ line: i.line, message: i.message })));

// Test 3: Verify specific line calculation
console.log('\n\nTest 3: Direct line number calculation');
const testLines = largeTestContent.split('\n');
console.log(`Total lines in large file: ${testLines.length}`);

// Find the innerHTML line
const innerHTMLLineIndex = testLines.findIndex(line => line.includes('element.innerHTML'));
console.log(`innerHTML should be at line: ${innerHTMLLineIndex + 1}`);

// Verify using the same method as the detector
const innerHTMLMatch = largeTestContent.match(/\.innerHTML\s*=\s*/);
if (innerHTMLMatch) {
    const position = innerHTMLMatch.index;
    const calculatedLine = largeTestContent.substring(0, position).split('\n').length;
    console.log(`Calculated line for innerHTML: ${calculatedLine}`);
}

console.log('\n✅ Line number test completed');