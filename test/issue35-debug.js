/**
 * Issue #35 のデバッグ
 * グローバルインストールでフレームワーク自身のファイルが検出される問題
 */

const path = require('path');
const ExcludeManager = require('../lib/ExcludeManager');
const SecurityAnalyzer = require('../lib/SecurityAnalyzer');

// ユーザーの拡張機能の設定を再現
const userConfig = {
    extensionPath: '/tmp/test-extension',  // ユーザーの拡張機能のパス
    exclude: [
        'node_modules/**',
        'test-framework/**',
        'extension.js/**'
    ]
};

console.log('=== Issue #35 Debug ===\n');

// ExcludeManagerの動作確認
console.log('1. ExcludeManagerのテスト');
const excludeManager = new ExcludeManager(userConfig);

// テストケース
const testPaths = [
    'test-framework/examples/config-advanced.js',
    'test-framework/lib/SecurityAnalyzer.js',
    'test-framework/suites/SecurityTestSuite.js',
    'node_modules/some-package/index.js',
    'src/content.js',
    'manifest.json'
];

console.log('\n除外パターン:', excludeManager.getPatterns());
console.log('\nテスト結果:');

testPaths.forEach(testPath => {
    const shouldExclude = excludeManager.shouldExclude(testPath);
    console.log(`  ${testPath}: ${shouldExclude ? '除外' : '含める'}`);
});

// フレームワーク自身のパスチェック
console.log('\n2. フレームワーク自身のパスチェック');
const frameworkPath = path.resolve(__dirname, '..');
console.log('フレームワークのパス:', frameworkPath);

// 絶対パスでのテスト
const absoluteTestPath = path.join(frameworkPath, 'lib/SecurityAnalyzer.js');
const shouldExcludeAbsolute = excludeManager.shouldExclude(absoluteTestPath);
console.log(`絶対パス ${absoluteTestPath}: ${shouldExcludeAbsolute ? '除外' : '含める'}`);

// SecurityAnalyzerの問題を確認
console.log('\n3. SecurityAnalyzerの問題確認');
const analyzer = new SecurityAnalyzer(userConfig);

// ExcludeManagerがセットされているか確認
console.log('analyzer.excludeManager が存在:', !!analyzer.excludeManager);
console.log('analyzer.excludeManager.basePath:', analyzer.excludeManager.basePath);

// 実際のスキャンディレクトリの動作を確認
console.log('\n4. 除外パターンのデバッグ');
const debugPaths = [
    { relative: 'test-framework/lib/SecurityAnalyzer.js', absolute: '/usr/lib/node_modules/chrome-extension-test-framework/lib/SecurityAnalyzer.js' },
    { relative: 'lib/SecurityAnalyzer.js', absolute: '/usr/lib/node_modules/chrome-extension-test-framework/lib/SecurityAnalyzer.js' },
    { relative: 'SecurityAnalyzer.js', absolute: '/usr/lib/node_modules/chrome-extension-test-framework/lib/SecurityAnalyzer.js' }
];

debugPaths.forEach(({ relative, absolute }) => {
    console.log(`\nパス: ${relative}`);
    console.log(`  shouldExclude(relative): ${excludeManager.shouldExclude(relative)}`);
    console.log(`  shouldExclude(absolute): ${excludeManager.shouldExclude(absolute)}`);
});

// 問題の根本原因
console.log('\n5. 問題の分析');
console.log('問題: SecurityAnalyzerがグローバルインストールされたフレームワークのファイルをスキャンしている');
console.log('原因: scanDirectory内でrelativePathが正しく計算されていない可能性');
console.log('解決策: フレームワーク自身のファイルを確実に除外する必要がある');