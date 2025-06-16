/**
 * Issue #33 のデバッグ - scripting権限の誤検出
 */

const fs = require('fs');
const path = require('path');
const PermissionDetector = require('../lib/PermissionDetector');

// テスト用の拡張機能を作成（Issue #33の報告内容を再現）
const testExtensionPath = path.join(__dirname, 'test-extension-issue33');

if (!fs.existsSync(testExtensionPath)) {
    fs.mkdirSync(testExtensionPath, { recursive: true });
}

// manifest.json（Issue #33の報告と同じ）
const manifest = {
    manifest_version: 3,
    name: "NotebookLM Extension",
    version: "1.0.0",
    permissions: ["tabs", "storage", "sidePanel", "offscreen"]
    // scriptingとactiveTabは含まれていない！
};

fs.writeFileSync(
    path.join(testExtensionPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
);

// content.js（タブ操作のコード）
fs.writeFileSync(path.join(testExtensionPath, 'content.js'), `
// タブの操作
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    console.log('Current tab:', tabs[0]);
});

// ストレージの使用
chrome.storage.local.set({key: 'value'}, () => {
    console.log('Saved to storage');
});

// サイドパネルの使用
chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
});

// オフスクリーンドキュメントの作成
chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['CLIPBOARD'],
    justification: 'Need to copy text'
});
`);

console.log('=== Issue #33 Debug ===\n');
console.log('Manifest permissions:', manifest.permissions);
console.log('注意: scriptingとactiveTabは含まれていません\n');

// PermissionDetectorでテスト
async function runDebug() {
    try {
        const detector = new PermissionDetector();
        
        // ファイルを読み込んで分析
        const files = [
            {
                path: path.join(testExtensionPath, 'content.js'),
                content: fs.readFileSync(path.join(testExtensionPath, 'content.js'), 'utf8')
            }
        ];
        
        const results = detector.detectUsedPermissions(files);
        
        console.log('=== 検出結果 ===');
        console.log('検出された権限:', results.permissions);
        console.log('検出されたホスト:', results.hostPatterns);
        console.log('検出されたAPI:', Object.keys(results.apiUsage));
        
        // 誤検出の確認
        if (results.permissions.includes('scripting')) {
            console.log('\n❌ エラー: scripting権限が誤検出されました');
            console.log('APIマッピング確認:');
            Object.entries(results.apiUsage).forEach(([api, count]) => {
                if (api.includes('scripting')) {
                    console.log(`  - ${api}: ${count}回`);
                }
            });
        } else {
            console.log('\n✅ scripting権限は検出されませんでした');
        }
        
        if (results.permissions.includes('activeTab')) {
            console.log('\n❌ エラー: activeTab権限が誤検出されました');
        } else {
            console.log('✅ activeTab権限は検出されませんでした');
        }
        
        // compareWithManifestの結果
        console.log('\n=== manifest.jsonとの比較 ===');
        const comparison = detector.compareWithManifest(manifest, results);
        
        console.log('未使用の権限:', comparison.unusedPermissions);
        console.log('不足している権限:', comparison.missingPermissions);
        
        // ファイルごとの分析結果
        console.log('\n=== ファイルごとの分析 ===');
        const contentFile = {
            path: path.join(testExtensionPath, 'content.js'),
            content: fs.readFileSync(path.join(testExtensionPath, 'content.js'), 'utf8')
        };
        
        const fileResults = detector.analyzeFile(contentFile);
        console.log('content.jsで検出された権限:', Array.from(fileResults.permissions));
        console.log('content.jsで検出されたAPI:');
        fileResults.apis.forEach((count, api) => {
            console.log(`  - ${api}: ${count}回`);
        });
        
    } catch (error) {
        console.error('エラー:', error);
    } finally {
        // クリーンアップ
        if (fs.existsSync(testExtensionPath)) {
            fs.rmSync(testExtensionPath, { recursive: true, force: true });
        }
    }
}

runDebug();