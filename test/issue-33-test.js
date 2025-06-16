/**
 * Issue #33のテスト - 存在しない権限 scripting を継続的に誤検出
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Issue #33 再現テスト\n');

// テスト用のmanifest.json
const testManifest = {
    "manifest_version": 3,
    "name": "Test Extension",
    "version": "1.0.0",
    "permissions": ["tabs", "storage", "sidePanel", "offscreen"]
};

// テストディレクトリを作成
const testDir = path.join(__dirname, 'issue-33-test-extension');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

// manifest.jsonを書き込み
fs.writeFileSync(
    path.join(testDir, 'manifest.json'),
    JSON.stringify(testManifest, null, 2)
);

// 最小限の背景スクリプトを作成
fs.writeFileSync(
    path.join(testDir, 'background.js'),
    '// Background script\nconsole.log("Extension loaded");'
);

// manifest.jsonを更新
testManifest.background = {
    service_worker: "background.js"
};
fs.writeFileSync(
    path.join(testDir, 'manifest.json'),
    JSON.stringify(testManifest, null, 2)
);

console.log('📝 テスト用manifest.json:');
console.log(JSON.stringify(testManifest, null, 2));
console.log('\n注目: scriptingパーミッションは含まれていません\n');

// フレームワークをテスト
const ChromeExtensionTestFramework = require('../index');
const framework = new ChromeExtensionTestFramework({
    extensionPath: testDir,
    output: {
        format: ['console'],
        directory: path.join(testDir, 'test-results')
    }
});

// テスト実行
framework.run().then(results => {
    console.log('\n📊 テスト結果:');
    console.log(`合計: ${results.summary.total}`);
    console.log(`成功: ${results.summary.passed}`);
    console.log(`失敗: ${results.summary.failed}`);
    
    // scriptingに関するエラーや警告をチェック
    const scriptingIssues = [];
    
    results.suites.forEach(suite => {
        suite.tests.forEach(test => {
            if (test.error && test.error.message && test.error.message.includes('scripting')) {
                scriptingIssues.push({
                    suite: suite.name,
                    test: test.name,
                    error: test.error.message
                });
            }
        });
        
        if (suite.warnings) {
            suite.warnings.forEach(warning => {
                if (warning.includes('scripting')) {
                    scriptingIssues.push({
                        suite: suite.name,
                        warning: warning
                    });
                }
            });
        }
    });
    
    if (scriptingIssues.length > 0) {
        console.log('\n❌ scriptingに関する誤検出が見つかりました:');
        scriptingIssues.forEach(issue => {
            console.log(JSON.stringify(issue, null, 2));
        });
    } else {
        console.log('\n✅ scriptingに関する誤検出はありませんでした');
    }
    
    // テストディレクトリをクリーンアップ
    fs.rmSync(testDir, { recursive: true });
}).catch(error => {
    console.error('エラー:', error);
    // テストディレクトリをクリーンアップ
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
    }
});