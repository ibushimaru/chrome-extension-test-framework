/**
 * Debug script for Issue #32 - innerHTML detection
 */

const fs = require('fs');
const path = require('path');

// Read the sample file
const sampleFilePath = path.join(__dirname, 'issue-32-sample.js');
const content = fs.readFileSync(sampleFilePath, 'utf8');

// Test the regex directly
const regex = /\.innerHTML\s*=\s*/g;
let match;
let matches = [];

while ((match = regex.exec(content)) !== null) {
    const position = match.index;
    const lineNumber = content.substring(0, position).split('\n').length;
    
    // Get line content
    const lineStart = content.lastIndexOf('\n', position) + 1;
    const lineEnd = content.indexOf('\n', position);
    const lineContent = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
    
    matches.push({
        position: position,
        lineNumber: lineNumber,
        match: match[0],
        lineContent: lineContent.trim()
    });
}

console.log(`Found ${matches.length} regex matches:\n`);
matches.forEach((m, i) => {
    console.log(`Match ${i + 1}:`);
    console.log(`  Position: ${m.position}`);
    console.log(`  Line: ${m.lineNumber}`);
    console.log(`  Matched: "${m.match}"`);
    console.log(`  Line content: ${m.lineContent}`);
    console.log('');
});