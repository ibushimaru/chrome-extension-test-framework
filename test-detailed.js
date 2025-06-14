#!/usr/bin/env node

/**
 * フレームワーク実装の詳細テスト
 */

const ChromeExtensionTestFramework = require('./index');
const path = require('path');
const fs = require('fs');

// テスト用ディレクトリを作成
function createTestDirectory() {
    const testDir = path.join(__dirname, 'test-output');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    return testDir;
}

async function runDetailedTests() {
    console.log('🔬 Chrome Extension Test Framework - Detailed Testing\n');
    
    const outputDir = createTestDirectory();
    
    // テスト1: 単純な拡張機能でのManifestテスト
    console.log('=' .repeat(60));
    console.log('TEST 1: Simple Extension - Manifest Only');
    console.log('=' .repeat(60));
    
    try {
        const testPath = path.join(__dirname, 'test-data', 'simple-extension');
        
        if (!fs.existsSync(testPath)) {
            console.error('❌ Test extension not found. Creating...');
            fs.mkdirSync(path.dirname(testPath), { recursive: true });
            fs.writeFileSync(
                path.join(testPath, 'manifest.json'),
                JSON.stringify({
                    manifest_version: 3,
                    name: "Test Extension",
                    version: "1.0.0",
                    description: "A simple test extension"
                }, null, 2)
            );
        }
        
        const framework = new ChromeExtensionTestFramework({
            extensionPath: testPath,
            output: {
                format: ['console'],
                directory: outputDir
            }
        });
        
        // Manifestテストのみ追加
        const ManifestTestSuite = require('./suites/ManifestTestSuite');
        framework.addSuite(new ManifestTestSuite(framework.config));
        
        const results = await framework.run();
        
        console.log('\n📊 Results:');
        console.log(`   Total: ${results.summary.total}`);
        console.log(`   Passed: ${results.summary.passed}`);
        console.log(`   Failed: ${results.summary.failed}`);
        console.log(`   Success Rate: ${results.summary.successRate}%`);
        
    } catch (error) {
        console.error('\n❌ Test 1 Failed:');
        console.error(error.stack || error);
    }
    
    // テスト2: すべてのビルトインテスト
    console.log('\n\n' + '=' .repeat(60));
    console.log('TEST 2: All Built-in Test Suites');
    console.log('=' .repeat(60));
    
    try {
        const testPath = path.join(__dirname, 'test-data', 'simple-extension');
        
        const framework = new ChromeExtensionTestFramework({
            extensionPath: testPath,
            output: {
                format: ['console', 'json', 'html'],
                directory: outputDir,
                filename: 'full-test'
            }
        });
        
        // すべてのビルトインテストを使用
        framework.useBuiltinTests();
        
        const results = await framework.run();
        
        console.log('\n📊 Overall Results:');
        console.log(`   Total: ${results.summary.total}`);
        console.log(`   Passed: ${results.summary.passed}`);
        console.log(`   Failed: ${results.summary.failed}`);
        console.log(`   Success Rate: ${results.summary.successRate}%`);
        
        // 各スイートの結果を表示
        console.log('\n📋 Results by Suite:');
        results.suites.forEach(suite => {
            const passed = suite.tests.filter(t => t.status === 'passed').length;
            const failed = suite.tests.filter(t => t.status === 'failed').length;
            console.log(`   ${suite.name}: ${passed}/${suite.tests.length} passed`);
        });
        
    } catch (error) {
        console.error('\n❌ Test 2 Failed:');
        console.error(error.stack || error);
    }
    
    // テスト3: カスタムテストの追加
    console.log('\n\n' + '=' .repeat(60));
    console.log('TEST 3: Custom Test Suite');
    console.log('=' .repeat(60));
    
    try {
        const testPath = path.join(__dirname, 'test-data', 'simple-extension');
        
        const framework = new ChromeExtensionTestFramework({
            extensionPath: testPath,
            output: {
                format: ['console'],
                directory: outputDir
            }
        });
        
        // カスタムテストスイートを作成
        const { TestSuite } = require('./index');
        
        const customSuite = new TestSuite({
            name: 'Custom Validation',
            description: 'Custom tests for specific requirements',
            config: framework.config
        });
        
        customSuite
            .test('Extension name starts with capital', async function(config) {
                const manifest = await this.loadManifest(config);
                if (!/^[A-Z]/.test(manifest.name)) {
                    throw new Error('Extension name should start with capital letter');
                }
            }.bind(customSuite))
            .test('Version is 1.0.0 or higher', async function(config) {
                const manifest = await this.loadManifest(config);
                const version = manifest.version.split('.').map(Number);
                if (version[0] < 1) {
                    throw new Error('Version should be 1.0.0 or higher');
                }
            }.bind(customSuite));
        
        framework.addSuite(customSuite);
        
        const results = await framework.run();
        
        console.log('\n📊 Custom Test Results:');
        results.suites[0].tests.forEach(test => {
            const icon = test.status === 'passed' ? '✅' : '❌';
            console.log(`   ${icon} ${test.name}`);
        });
        
    } catch (error) {
        console.error('\n❌ Test 3 Failed:');
        console.error(error.stack || error);
    }
    
    console.log('\n\n✨ Testing complete! Check the test-output directory for reports.');
}

// メイン実行
if (require.main === module) {
    runDetailedTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runDetailedTests };