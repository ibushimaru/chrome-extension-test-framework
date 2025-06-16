/**
 * Issue #24のテスト - 除外パターンが完全に壊れている
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Issue #24 再現テスト\n');

// テストディレクトリを作成
const testDir = path.join(__dirname, 'issue-24-test-extension');
const nodeModulesDir = path.join(testDir, 'node_modules');
const testFrameworkDir = path.join(testDir, 'test-framework');

// ディレクトリ構造を作成
fs.mkdirSync(path.join(nodeModulesDir, 'some-package'), { recursive: true });
fs.mkdirSync(path.join(testFrameworkDir, 'lib'), { recursive: true });

// ダミーファイルを作成
fs.writeFileSync(path.join(nodeModulesDir, 'some-package', 'index.js'), 'console.log("node_modules file");');
fs.writeFileSync(path.join(testFrameworkDir, 'lib', 'test.js'), 'eval("test");');

// 拡張機能のファイル（5ファイルのみ）
fs.writeFileSync(path.join(testDir, 'manifest.json'), JSON.stringify({
    "manifest_version": 3,
    "name": "Test Extension",
    "version": "1.0.0"
}, null, 2));
fs.writeFileSync(path.join(testDir, 'content.js'), 'console.log("content script");');
fs.writeFileSync(path.join(testDir, 'background.js'), 'console.log("background script");');
fs.writeFileSync(path.join(testDir, 'options.js'), 'console.log("options script");');
fs.writeFileSync(path.join(testDir, 'options.html'), '<html><body>Options</body></html>');

// .cextrc.jsonを作成
const config = {
    "extensionPath": ".",
    "exclude": [
        "node_modules/**",
        "test-framework/**",
        "extension.js/**",
        "extension-only/**",
        "test-results/**"
    ]
};
fs.writeFileSync(path.join(testDir, '.cextrc.json'), JSON.stringify(config, null, 2));

console.log('📁 テストディレクトリ構造:');
console.log('  - manifest.json');
console.log('  - content.js');
console.log('  - background.js');
console.log('  - options.js');
console.log('  - options.html');
console.log('  - node_modules/some-package/index.js');
console.log('  - test-framework/lib/test.js');
console.log('  - .cextrc.json');

// フレームワークをテスト
const ChromeExtensionTestFramework = require('../index');
const originalCwd = process.cwd();

try {
    // テストディレクトリに移動
    process.chdir(testDir);
    
    const framework = new ChromeExtensionTestFramework({
        extensionPath: '.',
        output: {
            format: ['console'],
            directory: './test-results'
        },
        verbose: true,
        suites: ['structure'] // 構造テストのみ実行（開発ファイル検出を含む）
    });

    // クイックモードで実行
    framework.run().then(results => {
        console.log('\n📊 テスト結果:');
        console.log(`合計: ${results.summary.total}`);
        console.log(`成功: ${results.summary.passed}`);
        console.log(`失敗: ${results.summary.failed}`);
        
        // 問題のあるファイルを検出
        const issues = [];
        results.suites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.error && test.error.message) {
                    const message = test.error.message;
                    if (message.includes('node_modules') || 
                        message.includes('test-framework') ||
                        message.includes('eval') ||
                        message.includes('debugger')) {
                        issues.push({
                            suite: suite.name,
                            test: test.name,
                            error: message
                        });
                    }
                }
            });
        });
        
        if (issues.length > 0) {
            console.log('\n❌ 除外パターンが機能していません:');
            issues.forEach(issue => {
                console.log(`  - [${issue.suite}] ${issue.test}`);
                console.log(`    ${issue.error}`);
            });
        } else {
            console.log('\n✅ 除外パターンが正しく機能しています');
        }
        
        // 元のディレクトリに戻る
        process.chdir(originalCwd);
        
        // テストディレクトリをクリーンアップ
        fs.rmSync(testDir, { recursive: true });
    }).catch(error => {
        console.error('エラー:', error);
        process.chdir(originalCwd);
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
    });
} catch (error) {
    console.error('セットアップエラー:', error);
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
    }
}