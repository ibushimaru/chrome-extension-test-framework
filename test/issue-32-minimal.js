/**
 * Minimal test to reproduce Issue #32 - innerHTML line number detection
 */

const ContextAwareDetector = require('../lib/ContextAwareDetector');

// Create a simple test case with innerHTML at known positions
const testContent = `// Line 1
// Line 2  
// Line 3
element.innerHTML = userInput; // Line 4 - should be detected
// Line 5
element.innerHTML = '<div>Static HTML</div>'; // Line 6 - might be filtered as safe
// Line 7
element.innerHTML = variable; // Line 8 - should be detected
`;

console.log('Test content:');
console.log(testContent);
console.log('\n---\n');

// Create detector
const detector = new ContextAwareDetector();

// Temporarily disable ChromePatternRecognizer filtering for testing
// by replacing the isSafeInnerHTMLUsage method
detector.chromeRecognizer.isSafeInnerHTMLUsage = () => false;

// Run detection
const issues = detector.detectUnsafeInnerHTML(testContent, 'test.js');

console.log(`Found ${issues.length} issues:\n`);
issues.forEach((issue, i) => {
    console.log(`Issue ${i + 1}:`);
    console.log(`  Line: ${issue.line}`);
    console.log(`  Column: ${issue.column}`);
    console.log(`  Context: ${issue.context}`);
    console.log(`  Assigned value: ${issue.assignedValue}`);
    console.log('');
});

// Verify line numbers
console.log('Line number verification:');
const expectedLines = [4, 6, 8];
expectedLines.forEach(expectedLine => {
    const found = issues.find(issue => issue.line === expectedLine);
    console.log(`Line ${expectedLine}: ${found ? '✅ Found' : '❌ Not found'}`);
});