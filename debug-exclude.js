#!/usr/bin/env node

/**
 * Debug test for exclude pattern issue
 * This test demonstrates that getAllFiles still returns files from excluded directories
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const TestSuite = require('./lib/TestSuite');
const ExcludeManager = require('./lib/ExcludeManager');

// Create test directory in temp folder to avoid framework path exclusion
const testRoot = path.join(os.tmpdir(), 'test-exclude-debug-' + Date.now());
const dirs = {
    root: testRoot,
    nodeModules: path.join(testRoot, 'node_modules'),
    nodeModulesLib: path.join(testRoot, 'node_modules', 'some-lib'),
    testFramework: path.join(testRoot, 'test-framework'),
    testFrameworkLib: path.join(testRoot, 'test-framework', 'lib'),
    chromeExtTestFramework: path.join(testRoot, 'chrome-extension-test-framework'),
    chromeExtTestFrameworkLib: path.join(testRoot, 'chrome-extension-test-framework', 'lib'),
    src: path.join(testRoot, 'src'),
    lib: path.join(testRoot, 'lib')
};

// Clean up any existing test directory
if (fs.existsSync(testRoot)) {
    fs.rmSync(testRoot, { recursive: true, force: true });
}

// Create directory structure
console.log('Creating test directory structure...');
Object.values(dirs).forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
});

// Create test files
const testFiles = {
    'manifest.json': '{"manifest_version": 3, "name": "Test", "version": "1.0"}',
    'node_modules/some-lib/index.js': '// Should be excluded',
    'node_modules/some-lib/package.json': '{"name": "some-lib"}',
    'test-framework/test.js': '// Should be excluded',
    'test-framework/lib/helper.js': '// Should be excluded',
    'chrome-extension-test-framework/index.js': '// Should be excluded',
    'chrome-extension-test-framework/lib/test.js': '// Should be excluded',
    'src/content.js': '// Should be included',
    'src/background.js': '// Should be included',
    'lib/utils.js': '// Should be excluded by lib/** pattern'
};

Object.entries(testFiles).forEach(([filePath, content]) => {
    const fullPath = path.join(testRoot, filePath);
    fs.writeFileSync(fullPath, content);
});

console.log('\nTest directory structure created:');
console.log(testRoot);

// Test 1: Basic exclude patterns
console.log('\n=== Test 1: Basic Exclude Patterns ===');
const config1 = {
    extensionPath: testRoot,
    exclude: [
        'node_modules/**',
        'test-framework/**',
        'chrome-extension-test-framework/**',
        'lib/**'
    ]
};

const excludeManager1 = new ExcludeManager(config1);
const suite1 = new TestSuite({ 
    config: { 
        ...config1, 
        excludeManager: excludeManager1 
    } 
});

console.log('\nExclude patterns:', excludeManager1.getPatterns());

// Get all files
(async () => {
    try {
        // First, let's check what files exist without any filtering
        console.log('\nFiles in test directory (raw fs.readdirSync):');
        const walkDir = (dir, prefix = '') => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                console.log(`${prefix}- ${file}${stat.isDirectory() ? '/' : ''}`);
                if (stat.isDirectory()) {
                    walkDir(fullPath, prefix + '  ');
                }
            });
        };
        walkDir(testRoot);
        
        const allFiles = await suite1.getAllFiles();
        
        console.log('\nAll files found by getAllFiles():');
        allFiles.forEach(file => console.log('  -', file));
        
        // Also get all files without exclude
        const allFilesNoExclude = await suite1.getAllFiles('', [], { skipExclude: true });
        console.log('\nAll files found by getAllFiles() with skipExclude=true:');
        allFilesNoExclude.forEach(file => console.log('  -', file));
        
        // Debug: Check framework path detection
        console.log('\nDebug info:');
        console.log('- extensionPath:', suite1.config.extensionPath);
        console.log('- __dirname:', __dirname);
        console.log('- Framework path:', path.resolve(__dirname, 'lib', '..'));
        console.log('- Test path starts with framework path?', testRoot.startsWith(path.resolve(__dirname)));
        
        console.log('\nChecking each file with shouldExclude:');
        allFilesNoExclude.forEach(file => {
            const shouldExclude = excludeManager1.shouldExclude(file);
            console.log(`  - ${file}: shouldExclude = ${shouldExclude}`);
        });
        
        // Filter files that should have been excluded
        const unexpectedFiles = allFiles.filter(file => {
            return file.includes('node_modules') || 
                   file.includes('test-framework') || 
                   file.includes('chrome-extension-test-framework') ||
                   file.startsWith('lib/');
        });
        
        if (unexpectedFiles.length > 0) {
            console.log('\n❌ ISSUE FOUND: The following files should have been excluded:');
            unexpectedFiles.forEach(file => console.log('  -', file));
        } else {
            console.log('\n✅ All excluded files were properly filtered');
        }
        
    } catch (error) {
        console.error('Error during test:', error);
    }
    
    // Test 2: Using excludePatterns.directories
    console.log('\n\n=== Test 2: Using excludePatterns.directories ===');
    const config2 = {
        extensionPath: testRoot,
        excludePatterns: {
            directories: ['node_modules', 'test-framework', 'chrome-extension-test-framework', 'lib']
        }
    };
    
    const excludeManager2 = new ExcludeManager(config2);
    const suite2 = new TestSuite({ 
        config: { 
            ...config2, 
            excludeManager: excludeManager2 
        } 
    });
    
    console.log('\nExclude patterns:', excludeManager2.getPatterns());
    
    try {
        const allFiles2 = await suite2.getAllFiles();
        
        console.log('\nAll files found by getAllFiles():');
        allFiles2.forEach(file => console.log('  -', file));
        
        const unexpectedFiles2 = allFiles2.filter(file => {
            return file.includes('node_modules') || 
                   file.includes('test-framework') || 
                   file.includes('chrome-extension-test-framework') ||
                   file.startsWith('lib/');
        });
        
        if (unexpectedFiles2.length > 0) {
            console.log('\n❌ ISSUE FOUND: The following files should have been excluded:');
            unexpectedFiles2.forEach(file => console.log('  -', file));
        } else {
            console.log('\n✅ All excluded files were properly filtered');
        }
        
    } catch (error) {
        console.error('Error during test 2:', error);
    }
    
    // Test 3: Direct ExcludeManager testing
    console.log('\n\n=== Test 3: Direct ExcludeManager Testing ===');
    console.log('Testing shouldExclude with various paths:');
    
    const testPaths = [
        'node_modules/some-lib/index.js',
        'test-framework/test.js',
        'chrome-extension-test-framework/index.js',
        'lib/utils.js',
        'src/content.js',
        './node_modules/some-lib/index.js',
        path.join(testRoot, 'node_modules/some-lib/index.js')
    ];
    
    testPaths.forEach(testPath => {
        const result1 = excludeManager1.shouldExclude(testPath);
        const result2 = excludeManager2.shouldExclude(testPath);
        console.log(`  - "${testPath}"`);
        console.log(`    Config1 (exclude patterns): ${result1}`);
        console.log(`    Config2 (excludePatterns.directories): ${result2}`);
    });
    
    // Test 4: Check relative vs absolute paths in getAllFiles
    console.log('\n\n=== Test 4: Relative vs Absolute Path Testing ===');
    console.log('Testing what paths are passed to shouldExclude from getAllFiles:');
    
    // Create a custom exclude manager that logs what it receives
    class LoggingExcludeManager extends ExcludeManager {
        shouldExclude(filePath) {
            console.log(`  shouldExclude called with: "${filePath}"`);
            return super.shouldExclude(filePath);
        }
        
        shouldExcludeDirectory(dirPath) {
            console.log(`  shouldExcludeDirectory called with: "${dirPath}"`);
            return super.shouldExcludeDirectory(dirPath);
        }
    }
    
    const loggingExcludeManager = new LoggingExcludeManager(config1);
    const loggingSuite = new TestSuite({ 
        config: { 
            ...config1, 
            excludeManager: loggingExcludeManager 
        } 
    });
    
    console.log('\nCalling getAllFiles with logging exclude manager:');
    await loggingSuite.getAllFiles();
    
    // Cleanup
    console.log('\n\nCleaning up test directory...');
    fs.rmSync(testRoot, { recursive: true, force: true });
    console.log('Done!');
    
})();