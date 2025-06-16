#!/usr/bin/env node

/**
 * Test script to verify exclude patterns are working correctly
 */

const ChromeExtensionTestFramework = require('./index');
const path = require('path');
const fs = require('fs');

async function testExcludePatterns() {
    console.log('🧪 Testing exclude pattern functionality...\n');
    
    // Create a test extension directory
    const testDir = path.join(__dirname, 'test-extension-exclude');
    
    // Clean up if exists
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // Create test structure
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'node_modules', 'some-lib'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'test'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'lib'), { recursive: true });
    
    // Create test files
    const files = {
        'manifest.json': JSON.stringify({
            manifest_version: 3,
            name: "Test Extension",
            version: "1.0.0",
            description: "Test extension for exclude patterns"
        }, null, 2),
        'src/content.js': '// Should be included\nconsole.log("content");',
        'src/background.js': '// Should be included\nconsole.log("background");',
        'node_modules/some-lib/index.js': '// Should be excluded\nconsole.log("lib");',
        'test/test.js': '// Should be excluded\nconsole.log("test");',
        'lib/helper.js': '// Should be excluded by config\nconsole.log("helper");',
        '.cextrc.json': JSON.stringify({
            exclude: ["lib/**", "test/**"],
            excludePatterns: {
                directories: ["node_modules", "test-framework"]
            }
        }, null, 2)
    };
    
    // Write files
    Object.entries(files).forEach(([filePath, content]) => {
        const fullPath = path.join(testDir, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content);
    });
    
    console.log('📁 Created test extension structure:');
    console.log(`   ${testDir}/`);
    console.log('   ├── manifest.json');
    console.log('   ├── .cextrc.json');
    console.log('   ├── src/');
    console.log('   │   ├── content.js');
    console.log('   │   └── background.js');
    console.log('   ├── node_modules/');
    console.log('   │   └── some-lib/');
    console.log('   │       └── index.js');
    console.log('   ├── test/');
    console.log('   │   └── test.js');
    console.log('   └── lib/');
    console.log('       └── helper.js');
    
    console.log('\n📄 .cextrc.json config:');
    console.log('   exclude: ["lib/**", "test/**"]');
    console.log('   excludePatterns.directories: ["node_modules", "test-framework"]');
    
    try {
        // Create framework instance
        const framework = new ChromeExtensionTestFramework({
            extensionPath: testDir,
            output: {
                format: ['console'],
                directory: testDir
            },
            quiet: true
        });
        
        // Load config
        await framework.loadConfig(path.join(testDir, '.cextrc.json'));
        
        console.log('\n🔍 Testing file discovery...');
        
        // Get the first test suite and use it to test getAllFiles
        const TestSuite = require('./lib/TestSuite');
        const testSuite = new TestSuite({
            name: 'Test Suite',
            config: {
                extensionPath: testDir,
                excludeManager: framework.excludeManager
            }
        });
        
        const allFiles = await testSuite.getAllFiles();
        
        console.log('\n📊 Results:');
        console.log(`   Total files found: ${allFiles.length}`);
        console.log('\n   Files discovered:');
        allFiles.forEach(file => {
            console.log(`   ✅ ${file}`);
        });
        
        // Check for excluded files
        const shouldBeExcluded = [
            'node_modules/some-lib/index.js',
            'test/test.js',
            'lib/helper.js'
        ];
        
        const wronglyIncluded = shouldBeExcluded.filter(file => 
            allFiles.includes(file)
        );
        
        if (wronglyIncluded.length > 0) {
            console.log('\n❌ ERROR: The following files should have been excluded:');
            wronglyIncluded.forEach(file => {
                console.log(`   - ${file}`);
            });
        } else {
            console.log('\n✅ SUCCESS: All exclude patterns are working correctly!');
        }
        
        // Test with security suite
        console.log('\n🔒 Testing with SecurityTestSuite...');
        const SecurityTestSuite = require('./suites/SecurityTestSuite');
        const securitySuite = new SecurityTestSuite({
            extensionPath: testDir,
            excludeManager: framework.excludeManager,
            quiet: true
        });
        
        // Test findFiles method
        const jsFiles = await securitySuite.findFiles(testDir, '.js');
        console.log(`\n   JavaScript files found: ${jsFiles.length}`);
        jsFiles.forEach(file => {
            console.log(`   - ${path.relative(testDir, file)}`);
        });
        
        const excludedJsFiles = jsFiles.filter(file => {
            const relativePath = path.relative(testDir, file);
            return relativePath.includes('node_modules') || 
                   relativePath.includes('test/') ||
                   relativePath.includes('lib/');
        });
        
        if (excludedJsFiles.length > 0) {
            console.log('\n❌ ERROR: SecurityTestSuite included excluded files:');
            excludedJsFiles.forEach(file => {
                console.log(`   - ${path.relative(testDir, file)}`);
            });
        } else {
            console.log('\n✅ SUCCESS: SecurityTestSuite respects exclude patterns!');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        // Clean up
        console.log('\n🧹 Cleaning up test directory...');
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

// Run the test
testExcludePatterns().catch(console.error);