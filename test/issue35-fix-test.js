/**
 * Issue #35 の修正確認テスト
 */

const fs = require('fs');
const path = require('path');
const SecurityAnalyzer = require('../lib/SecurityAnalyzer');

// テスト用の拡張機能ディレクトリを作成
const testExtensionPath = path.join(__dirname, 'test-extension-issue35');

// ディレクトリ構造を作成
if (!fs.existsSync(testExtensionPath)) {
    fs.mkdirSync(testExtensionPath, { recursive: true });
}

// manifest.json を作成
fs.writeFileSync(path.join(testExtensionPath, 'manifest.json'), JSON.stringify({
    manifest_version: 3,
    name: "Test Extension",
    version: "1.0.0",
    permissions: ["storage"]
}, null, 2));

// content.js を作成（安全なコード）
fs.writeFileSync(path.join(testExtensionPath, 'content.js'), `
// Safe Chrome extension code
chrome.storage.local.get(['setting'], (result) => {
    console.log('Setting value:', result.setting);
});
`);

// .cextrc.json を作成
const config = {
    extensionPath: testExtensionPath,
    exclude: [
        'node_modules/**',
        'test-framework/**',
        'extension.js/**'
    ]
};

fs.writeFileSync(path.join(testExtensionPath, '.cextrc.json'), JSON.stringify(config, null, 2));

console.log('=== Issue #35 修正確認テスト ===\n');
console.log('テスト拡張機能のパス:', testExtensionPath);
console.log('除外パターン:', config.exclude);

// SecurityAnalyzerでテスト
async function runTest() {
    try {
        const analyzer = new SecurityAnalyzer(config);
        const results = await analyzer.analyze(testExtensionPath);
        const report = analyzer.generateReport();
        
        console.log('\n=== 分析結果 ===');
        console.log('スキャンされたファイル数:', results.scannedFiles);
        console.log('見つかった問題:', results.issues.length);
        
        if (results.issues.length > 0) {
            console.log('\n検出された問題:');
            results.issues.forEach(issue => {
                console.log(`  - ${issue.file}: ${issue.type} (${issue.severity})`);
            });
        }
        
        // フレームワーク自身のファイルが含まれているかチェック
        const frameworkFiles = results.issues.filter(issue => 
            issue.file.includes('test-framework/') ||
            issue.file.includes('chrome-extension-test-framework/')
        );
        
        if (frameworkFiles.length > 0) {
            console.log('\n❌ エラー: フレームワーク自身のファイルが検出されました:');
            frameworkFiles.forEach(issue => {
                console.log(`  - ${issue.file}`);
            });
        } else {
            console.log('\n✅ 成功: フレームワーク自身のファイルは検出されませんでした');
        }
        
        // manifest.jsonの問題チェック
        const manifestIssues = results.issues.filter(issue => 
            issue.file.includes('manifest.json')
        );
        
        if (manifestIssues.length > 0) {
            console.log('\nmanifest.json の問題:');
            manifestIssues.forEach(issue => {
                console.log(`  - ${issue.message}`);
            });
        }
        
    } catch (error) {
        console.error('エラー:', error.message);
        console.error(error.stack);
    } finally {
        // テストディレクトリをクリーンアップ
        if (fs.existsSync(testExtensionPath)) {
            fs.rmSync(testExtensionPath, { recursive: true, force: true });
        }
    }
}

runTest();