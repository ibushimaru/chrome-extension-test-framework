/**
 * Issue #24の直接テスト - 除外パターンの動作確認
 */

const fs = require('fs');
const path = require('path');
const StructureTestSuite = require('../suites/StructureTestSuite');
const ExcludeManager = require('../lib/ExcludeManager');

console.log('🧪 Issue #24 直接テスト\n');

// テストディレクトリを作成
const testDir = path.join(__dirname, 'issue-24-direct');
const nodeModulesDir = path.join(testDir, 'node_modules');

// ディレクトリ構造を作成
fs.mkdirSync(path.join(nodeModulesDir, 'some-package'), { recursive: true });

// 問題のあるファイルを作成
fs.writeFileSync(path.join(nodeModulesDir, 'some-package', 'index.js'), 'console.log("node_modules file");');
fs.writeFileSync(path.join(nodeModulesDir, 'some-package', 'README.md'), '# Package README');

// 拡張機能のファイル
fs.writeFileSync(path.join(testDir, 'manifest.json'), JSON.stringify({
    "manifest_version": 3,
    "name": "Test Extension",
    "version": "1.0.0"
}, null, 2));
fs.writeFileSync(path.join(testDir, 'background.js'), 'console.log("background");');

// 設定を作成
const config = {
    extensionPath: testDir,
    exclude: [
        "node_modules/**",
        "test-framework/**",
        "test-results/**"
    ]
};

// ExcludeManagerを作成
const excludeManager = new ExcludeManager(config);
config.excludeManager = excludeManager;

console.log('📁 除外パターン:');
config.exclude.forEach(pattern => console.log(`  - ${pattern}`));

console.log('\n🔍 除外テスト:');
console.log(`  node_modules/some-package/index.js: ${excludeManager.shouldExclude('node_modules/some-package/index.js') ? '除外される' : '除外されない'}`);
console.log(`  background.js: ${excludeManager.shouldExclude('background.js') ? '除外される' : '除外されない'}`);

// StructureTestSuiteを実行
const suite = new StructureTestSuite(config);
suite.run().then(results => {
    console.log('\n📊 構造テスト結果:');
    
    // 開発ファイルテストの結果を確認
    const devFilesTest = results.find(test => test.name === 'No development files');
    if (devFilesTest && devFilesTest.error) {
        console.log('❌ 開発ファイルが検出されました:');
        console.log(devFilesTest.error.message);
        
        // node_modulesが含まれているかチェック
        if (devFilesTest.error.message.includes('node_modules')) {
            console.log('\n🐛 Issue #24の問題が再現されました！');
            console.log('除外パターンにnode_modules/**があるのに、node_modulesのファイルが検出されています。');
        }
    } else if (devFilesTest && !devFilesTest.error) {
        console.log('✅ 開発ファイルテストに合格しました');
    }
    
    // クリーンアップ
    fs.rmSync(testDir, { recursive: true });
}).catch(error => {
    console.error('エラー:', error);
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
    }
});