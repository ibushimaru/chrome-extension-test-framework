/**
 * Issue #33 - カスタムテストで危険な権限チェックを再現
 */

const fs = require('fs');
const path = require('path');

// テスト用のカスタムテストファイル
const customTestContent = `
const TestSuite = require('chrome-extension-test-framework/lib/TestSuite');

class CustomTests extends TestSuite {
    constructor(config) {
        super(config);
        this.name = 'NotebookLM Extension Custom Tests';
        this.description = 'Custom tests for Safe Browsing compliance';
    }

    async runTests() {
        // 危険な権限のチェック
        await this.test('Check No Dangerous Permissions', async () => {
            const manifestPath = path.join(this.config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            const dangerousPermissions = ['activeTab', 'scripting'];
            const foundDangerous = [];
            
            if (manifest.permissions) {
                manifest.permissions.forEach(perm => {
                    if (dangerousPermissions.includes(perm)) {
                        foundDangerous.push(perm);
                    }
                });
            }
            
            if (foundDangerous.length > 0) {
                throw new Error(\`Found dangerous permissions (Safe Browsing violation): \${foundDangerous.join(', ')}\`);
            }
        });
        
        // Safe Browsing準拠チェック
        await this.test('Safe Browsing Compliance Check', async () => {
            const manifestPath = path.join(this.config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            const permissions = manifest.permissions || [];
            
            // scriptingパーミッションのチェック
            if (permissions.includes('scripting')) {
                throw new Error('Extension uses "scripting" permission which violates Safe Browsing policy');
            }
        });
    }
}

module.exports = CustomTests;
`;

// テストディレクトリ作成
const testDir = path.join(__dirname, 'issue-33-extension');
const nodeModulesDir = path.join(testDir, 'node_modules', 'chrome-extension-test-framework');

// ディレクトリ構造作成
fs.mkdirSync(path.join(nodeModulesDir, 'lib'), { recursive: true });

// シンボリックリンクまたはコピーでフレームワークファイルを配置
const libPath = path.join(__dirname, '..', 'lib', 'TestSuite.js');
const destPath = path.join(nodeModulesDir, 'lib', 'TestSuite.js');
fs.copyFileSync(libPath, destPath);

// テスト拡張機能のファイル作成
const manifest = {
    "manifest_version": 3,
    "name": "Test Extension",
    "version": "1.0.0",
    "permissions": ["tabs", "storage", "sidePanel", "offscreen"],
    "background": {
        "service_worker": "background.js"
    }
};

fs.writeFileSync(
    path.join(testDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
);

fs.writeFileSync(
    path.join(testDir, 'background.js'),
    'console.log("Extension loaded");'
);

fs.writeFileSync(
    path.join(testDir, 'custom-tests.js'),
    customTestContent
);

// カスタムテストを直接実行
const CustomTests = eval(customTestContent.replace(/require\('chrome-extension-test-framework\/lib\/TestSuite'\)/, 'require("../lib/TestSuite")'));

console.log('🧪 Issue #33 カスタムテスト実行\n');
console.log('📝 manifest.json:');
console.log(JSON.stringify(manifest, null, 2));
console.log('\n');

const customTests = new CustomTests({ extensionPath: testDir });
customTests.runTests().then(() => {
    console.log('✅ すべてのテストに合格しました');
    // クリーンアップ
    fs.rmSync(testDir, { recursive: true });
}).catch(error => {
    console.log('❌ テストが失敗しました:');
    console.log(error.message);
    console.log('\n🐛 これがIssue #33の問題です！');
    console.log('manifest.jsonには"scripting"権限が含まれていないのに、エラーになっています。');
    // クリーンアップ
    fs.rmSync(testDir, { recursive: true });
});