/**
 * Chrome Extension Test Framework - 基本動作テスト
 */

const ChromeExtensionTestFramework = require('../index');
const path = require('path');

async function testFramework() {
    console.log('🧪 Testing Chrome Extension Test Framework...\n');
    
    try {
        // サンプルの拡張機能をテスト（good-extensionを使用）
        const extensionPath = path.join(__dirname, '..', 'samples', 'good-extension');
        
        // フレームワークのインスタンスを作成
        const framework = new ChromeExtensionTestFramework({
            extensionPath: extensionPath,
            output: {
                format: ['console', 'json', 'html'],
                directory: path.join(__dirname, 'results')
            }
        });
        
        // ビルトインテストを使用
        framework.useBuiltinTests();
        
        // テストを実行
        const results = await framework.run();
        
        console.log('\n✅ Framework test completed successfully!');
        console.log(`Total tests: ${results.summary.total}`);
        console.log(`Passed: ${results.summary.passed}`);
        console.log(`Failed: ${results.summary.failed}`);
        console.log(`Success rate: ${results.summary.successRate}%`);
        
    } catch (error) {
        console.error('❌ Framework test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// テストを実行
testFramework();