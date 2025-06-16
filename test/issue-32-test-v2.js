/**
 * Issue #32 Test V2 - innerHTML detection line number accuracy
 * This version corrects the expected line numbers and provides more detailed debugging
 */

const fs = require('fs');
const path = require('path');
const ContextAwareDetector = require('../lib/ContextAwareDetector');

console.log('🧪 Issue #32 - innerHTML Line Number Accuracy Test V2\n');

// Create detector instance
const detector = new ContextAwareDetector();

// Read the sample file
const sampleFilePath = path.join(__dirname, 'issue-32-sample.js');
const content = fs.readFileSync(sampleFilePath, 'utf8');

console.log('📝 Testing file:', sampleFilePath);
console.log('📏 Total lines in file:', content.split('\n').length);
console.log('\n');

// Corrected expected innerHTML occurrences based on actual line numbers
const expectedInnerHTML = [
    { line: 4, description: 'innerHTML at beginning of file', shouldDetect: true },
    { line: 12, count: 2, description: 'Multiple innerHTML on same line', shouldDetect: true },
    { line: 25, description: 'innerHTML after multiline content', shouldDetect: true },
    { line: 45, description: 'innerHTML with variable assignment', shouldDetect: true },
    { line: 48, description: 'innerHTML = empty string (safe pattern)', shouldDetect: false },
    { line: 49, description: 'innerHTML = DOMPurify.sanitize (safe pattern)', shouldDetect: false },
    { line: 50, description: 'innerHTML = chrome.i18n.getMessage (safe pattern)', shouldDetect: false },
    { line: 53, description: 'innerHTML in single-line comment', shouldDetect: false },
    { line: 57, description: 'innerHTML in multi-line comment', shouldDetect: false },
    { line: 61, description: 'innerHTML in string literal', shouldDetect: false },
    { line: 74, description: 'innerHTML at end of file', shouldDetect: true }
];

// First, let's manually check what the regex finds
console.log('🔍 Direct regex test:\n');
const regex = /\.innerHTML\s*=\s*/g;
let match;
let allMatches = [];

while ((match = regex.exec(content)) !== null) {
    const position = match.index;
    const lineNumber = content.substring(0, position).split('\n').length;
    allMatches.push({ line: lineNumber, position: position });
}

console.log(`Regex found ${allMatches.length} total matches on lines: ${allMatches.map(m => m.line).join(', ')}\n`);

// Run detection
console.log('🔍 Running ContextAwareDetector...\n');
const issues = detector.detectUnsafeInnerHTML(content, sampleFilePath);

// Sort issues by line number for easier comparison
issues.sort((a, b) => a.line - b.line);

console.log(`📊 Detector found ${issues.length} innerHTML issues:\n`);

// Display all detected issues
issues.forEach((issue, index) => {
    console.log(`Issue ${index + 1}:`);
    console.log(`  Line: ${issue.line}`);
    console.log(`  Column: ${issue.column}`);
    console.log(`  Severity: ${issue.severity}`);
    console.log(`  Context: ${issue.context}`);
    console.log(`  Assigned Value: ${issue.assignedValue}`);
    console.log('');
});

// Detailed analysis
console.log('🎯 Detailed Line Number Analysis:\n');

let testsRun = 0;
let testsPassed = 0;

expectedInnerHTML.forEach(expected => {
    testsRun++;
    const detectedOnLine = issues.filter(issue => issue.line === expected.line);
    const expectedCount = expected.count || 1;
    
    if (expected.shouldDetect) {
        if (detectedOnLine.length === expectedCount) {
            console.log(`✅ Line ${expected.line}: ${expected.description}`);
            console.log(`   Expected ${expectedCount} detection(s), found ${detectedOnLine.length}`);
            testsPassed++;
        } else {
            console.log(`❌ Line ${expected.line}: ${expected.description}`);
            console.log(`   Expected ${expectedCount} detection(s), found ${detectedOnLine.length}`);
            
            // Check if it was filtered out
            const regexFound = allMatches.some(m => m.line === expected.line);
            if (regexFound) {
                console.log(`   ⚠️  Regex found it but detector filtered it out`);
            }
        }
    } else {
        if (detectedOnLine.length === 0) {
            console.log(`✅ Line ${expected.line}: ${expected.description} - correctly ignored`);
            testsPassed++;
        } else {
            console.log(`❌ Line ${expected.line}: ${expected.description} - should have been ignored`);
        }
    }
});

// Check for unexpected detections
console.log('\n🔍 Checking for unexpected detections:\n');
const expectedLines = expectedInnerHTML.map(e => e.line);
issues.forEach(issue => {
    if (!expectedLines.includes(issue.line)) {
        console.log(`⚠️  Unexpected detection on line ${issue.line}`);
    }
});

// Test line number calculation accuracy
console.log('\n📐 Line Number Calculation Test:\n');

// Create a test string with known line positions
const testContent = `line 1
line 2
line 3 with .innerHTML = 'test'
line 4
line 5`;

const testPosition = testContent.indexOf('.innerHTML');
const calculatedLine = detector.getLineNumber(testContent, testPosition);
console.log(`Test string innerHTML position: ${testPosition}`);
console.log(`Calculated line number: ${calculatedLine}`);
console.log(`Expected line number: 3`);
console.log(calculatedLine === 3 ? '✅ Line calculation correct' : '❌ Line calculation incorrect');

// Final summary
console.log('\n📋 Test Summary:\n');
console.log(`Tests run: ${testsRun}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Success rate: ${Math.round(testsPassed / testsRun * 100)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ All line number accuracy tests PASSED');
} else {
    console.log('\n❌ Some line number accuracy tests FAILED');
    console.log('\nPossible issues:');
    console.log('- ChromePatternRecognizer might be too aggressive in filtering');
    console.log('- Context detection (comments, strings) might have issues');
    console.log('- Line number calculation might be off by 1');
}