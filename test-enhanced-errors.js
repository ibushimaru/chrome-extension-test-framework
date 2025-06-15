/**
 * Test script to demonstrate enhanced error messages
 */

const ChromeExtensionTestFramework = require('./index');
const path = require('path');
const fs = require('fs');

// Create a temporary test directory with intentional errors
const testDir = path.join(__dirname, 'temp-test-extension');

// Clean up if exists
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
}

// Create test directory
fs.mkdirSync(testDir);

// Create an invalid manifest.json with various errors
const invalidManifest = {
    // Missing manifest_version
    "name": "Test Extension With Errors That Is Way Too Long For Chrome Web Store Requirements",
    "version": "1.0.0.0.1", // Invalid version format
    "description": "A test extension with intentional errors",
    "permissions": ["tabs", "storage", "http://*/*"], // Insecure permission
    "content_scripts": [{
        "matches": ["<all_urls>"],
        "js": ["content.js"],
        "run_at": "document_start"
    }],
    "background": {
        "scripts": ["background.js"], // Should use service_worker for MV3
        "persistent": true
    }
};

// Write the invalid manifest
fs.writeFileSync(
    path.join(testDir, 'manifest.json'),
    JSON.stringify(invalidManifest, null, 2)
);

// Create a JavaScript file with security issues
const insecureJS = `
// Insecure code examples
eval("console.log('This is unsafe')");
document.body.innerHTML = userInput;
chrome.storage.local.set({ apiKey: 'sk-1234567890' });
`;

fs.writeFileSync(path.join(testDir, 'content.js'), insecureJS);

// Create a large unoptimized file
const largeFile = 'x'.repeat(1024 * 1024 * 2); // 2MB file
fs.writeFileSync(path.join(testDir, 'large-file.js'), largeFile);

// Create files with bad naming
fs.writeFileSync(path.join(testDir, 'MyFile.JS'), '// Bad naming');
fs.writeFileSync(path.join(testDir, 'test.log'), 'Debug log');
fs.writeFileSync(path.join(testDir, '.DS_Store'), 'Mac file');

console.log('🧪 Testing Enhanced Error Messages\n');
console.log('This test will intentionally trigger various errors to demonstrate');
console.log('the enhanced error reporting capabilities.\n');
console.log('═'.repeat(60) + '\n');

// Run the test framework
async function testEnhancedErrors() {
    try {
        const framework = new ChromeExtensionTestFramework({
            extensionPath: testDir,
            output: {
                format: ['console'],
                directory: './test-results'
            },
            verbose: true
        });

        // Use only specific test suites to demonstrate different error types
        framework.suites = [
            new (require('./suites/ManifestTestSuite'))(framework.config),
            new (require('./suites/SecurityTestSuite'))(framework.config),
            new (require('./suites/PerformanceTestSuite'))(framework.config),
            new (require('./suites/StructureTestSuite'))(framework.config)
        ];

        const results = await framework.run();
        
        console.log('\n📊 Summary of Enhanced Error Messages:');
        console.log(`- Total errors detected: ${results.summary.failed}`);
        console.log(`- Error categories: Validation, Security, Performance, Structure`);
        console.log(`- Each error includes: Code, Severity, Suggestion, Example, Documentation`);
        
    } catch (error) {
        console.error('Framework error:', error);
    } finally {
        // Cleanup
        setTimeout(() => {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true });
                console.log('\n🧹 Cleaned up test directory');
            }
        }, 1000);
    }
}

testEnhancedErrors();