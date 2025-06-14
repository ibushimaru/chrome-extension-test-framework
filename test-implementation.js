#!/usr/bin/env node

/**
 * 実際のテスト実行を確認するスクリプト
 */

const ChromeExtensionTestFramework = require('./index');
const path = require('path');

async function testFramework() {
    console.log('🔍 Testing the framework implementation...\n');
    
    // 最小限の拡張機能でテスト
    const minimalPath = path.join(__dirname, 'samples', 'minimal-extension');
    
    try {
        console.log('1️⃣ Testing minimal extension with basic configuration...');
        const framework1 = new ChromeExtensionTestFramework({
            extensionPath: minimalPath,
            output: {
                format: ['console'],
                directory: './test-output'
            }
        });
        
        // Manifestテストのみ実行
        const ManifestTestSuite = require('./suites/ManifestTestSuite');
        framework1.addSuite(new ManifestTestSuite(framework1.config));
        
        const results1 = await framework1.run();
        console.log('\nTest completed. Summary:', results1.summary);
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
    
    // 全テストスイートでテスト
    try {
        console.log('\n\n2️⃣ Testing minimal extension with all test suites...');
        const framework2 = new ChromeExtensionTestFramework({
            extensionPath: minimalPath,
            output: {
                format: ['console'],
                directory: './test-output'
            }
        });
        
        framework2.useBuiltinTests();
        
        const results2 = await framework2.run();
        console.log('\nAll tests completed. Summary:', results2.summary);
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

// テスト実行
testFramework().catch(console.error);