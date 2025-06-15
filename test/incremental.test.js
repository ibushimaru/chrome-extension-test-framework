/**
 * インクリメンタルテスト機能のテスト
 */

const IncrementalTester = require('../lib/IncrementalTester');
const fs = require('fs');
const path = require('path');

console.log('🧪 Incremental Test Feature Tests\n');

// テスト用の一時ディレクトリ
const TEST_DIR = path.join(__dirname, 'temp-incremental-test');
const CACHE_FILE = path.join(TEST_DIR, '.cext-cache.json');

// ディレクトリをクリーンアップ
function cleanupTestDir() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true });
    }
}

// テスト用ディレクトリを準備
function setupTestDir() {
    cleanupTestDir();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    
    // テスト用ファイルを作成
    fs.writeFileSync(path.join(TEST_DIR, 'manifest.json'), JSON.stringify({
        manifest_version: 3,
        name: "Test Extension",
        version: "1.0.0"
    }, null, 2));
    
    fs.mkdirSync(path.join(TEST_DIR, 'js'), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, 'js/background.js'), '// background script');
    fs.writeFileSync(path.join(TEST_DIR, 'js/content.js'), '// content script');
    
    fs.mkdirSync(path.join(TEST_DIR, 'css'), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, 'css/style.css'), 'body { margin: 0; }');
}

// キャッシュ機能のテスト
async function testCacheManagement() {
    console.log('📋 Testing cache management...');
    setupTestDir();
    
    const tester = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    // 初期状態の確認
    console.log('   Testing initial state:');
    const initialCache = tester.loadCache();
    if (!initialCache.lastRun && Object.keys(initialCache.fileHashes).length === 0) {
        console.log('   ✅ Initial cache is empty');
    } else {
        console.log('   ❌ Initial cache should be empty');
    }
    
    // キャッシュの保存
    tester.cache.lastRun = new Date().toISOString();
    tester.cache.fileHashes['test.js'] = 'abc123';
    tester.saveCache();
    
    if (fs.existsSync(CACHE_FILE)) {
        console.log('   ✅ Cache file created');
    } else {
        console.log('   ❌ Failed to create cache file');
    }
    
    // キャッシュの読み込み
    const tester2 = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    if (tester2.cache.fileHashes['test.js'] === 'abc123') {
        console.log('   ✅ Cache loaded correctly');
    } else {
        console.log('   ❌ Failed to load cache');
    }
    
    // キャッシュのクリア
    tester2.clearCache();
    if (!fs.existsSync(CACHE_FILE)) {
        console.log('   ✅ Cache cleared successfully');
    } else {
        console.log('   ❌ Failed to clear cache');
    }
    
    console.log('');
}

// ファイルハッシュのテスト
async function testFileHashing() {
    console.log('📋 Testing file hashing...');
    setupTestDir();
    
    const tester = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    const testFile = path.join(TEST_DIR, 'js/background.js');
    const hash1 = tester.calculateFileHash(testFile);
    
    if (hash1 && typeof hash1 === 'string' && hash1.length === 32) {
        console.log(`   ✅ File hash calculated: ${hash1.substring(0, 8)}...`);
    } else {
        console.log('   ❌ Failed to calculate file hash');
    }
    
    // ファイルを変更
    fs.writeFileSync(testFile, '// modified background script');
    const hash2 = tester.calculateFileHash(testFile);
    
    if (hash2 && hash2 !== hash1) {
        console.log('   ✅ Hash changed after file modification');
    } else {
        console.log('   ❌ Hash should change after modification');
    }
    
    console.log('');
}

// 変更検出のテスト
async function testChangeDetection() {
    console.log('📋 Testing change detection...');
    setupTestDir();
    
    const tester = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    // 初回実行（すべてのファイルが新規）
    const hashChanges = tester.getHashChangedFiles();
    console.log(`   Detected ${hashChanges.length} changed files on first run`);
    
    if (hashChanges.length > 0) {
        console.log('   ✅ Initial files detected as changed');
    } else {
        console.log('   ❌ Should detect initial files as changed');
    }
    
    // キャッシュを保存
    tester.saveCache();
    
    // 再度チェック（変更なし）
    const tester2 = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    const noChanges = tester2.getHashChangedFiles();
    if (noChanges.length === 0) {
        console.log('   ✅ No changes detected on second run');
    } else {
        console.log(`   ❌ Incorrectly detected ${noChanges.length} changes`);
    }
    
    // ファイルを変更
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(TEST_DIR, 'js/content.js'), '// modified content');
    
    const withChanges = tester2.getHashChangedFiles();
    if (withChanges.length === 1) {
        console.log('   ✅ Detected 1 file change correctly');
    } else {
        console.log(`   ❌ Expected 1 change, found ${withChanges.length}`);
    }
    
    console.log('');
}

// テストターゲット決定のテスト
async function testTargetDetermination() {
    console.log('📋 Testing target determination...');
    setupTestDir();
    
    const tester = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    // 初回実行
    const firstRun = await tester.determineTestTargets({ sinceLastRun: true });
    if (firstRun.mode === 'full' && firstRun.reason.includes('No previous test run')) {
        console.log('   ✅ First run triggers full test');
    } else {
        console.log('   ❌ First run should trigger full test');
    }
    
    // テスト実行を記録
    tester.recordTestRun({
        summary: { total: 10, passed: 10, failed: 0 }
    });
    
    // 変更なしの場合
    const noChanges = await tester.determineTestTargets({ sinceLastRun: true });
    if (noChanges.mode === 'none') {
        console.log('   ✅ No changes detected correctly');
    } else {
        console.log('   ❌ Should detect no changes');
    }
    
    // manifest.json を変更（全テストトリガー）
    fs.writeFileSync(path.join(TEST_DIR, 'manifest.json'), JSON.stringify({
        manifest_version: 3,
        name: "Test Extension",
        version: "1.0.1"
    }, null, 2));
    
    const manifestChange = await tester.determineTestTargets({ useHash: true });
    if (manifestChange.mode === 'full' && manifestChange.reason.includes('Critical file')) {
        console.log('   ✅ manifest.json change triggers full test');
    } else {
        console.log('   ❌ manifest.json change should trigger full test');
    }
    
    console.log('');
}

// スイート決定のテスト
async function testSuiteDetermination() {
    console.log('📋 Testing suite determination...');
    setupTestDir();
    
    const tester = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    // 各ファイルタイプのテスト
    const testCases = [
        { files: ['manifest.json'], expectedSuites: ['manifest', 'structure'] },
        { files: ['background.js'], expectedSuites: ['security', 'performance', 'manifest'] },
        { files: ['style.css'], expectedSuites: ['performance'] },
        { files: ['popup.html'], expectedSuites: ['security', 'structure'] },
        { files: ['_locales/en/messages.json'], expectedSuites: ['localization'] }
    ];
    
    let passed = 0;
    testCases.forEach(({ files, expectedSuites }) => {
        const suites = tester.determineSuites(files);
        const hasAll = expectedSuites.every(suite => suites.includes(suite));
        
        if (hasAll) {
            console.log(`   ✅ ${files[0]} → ${suites.join(', ')}`);
            passed++;
        } else {
            console.log(`   ❌ ${files[0]} → ${suites.join(', ')} (expected ${expectedSuites.join(', ')})`);
        }
    });
    
    console.log(`   📊 Passed: ${passed}/${testCases.length}`);
    console.log('');
}

// 統計情報のテスト
async function testStatistics() {
    console.log('📋 Testing statistics...');
    setupTestDir();
    
    const tester = new IncrementalTester({
        cacheFile: CACHE_FILE,
        extensionPath: TEST_DIR
    });
    
    // テスト実行を記録
    tester.recordTestRun({
        summary: { total: 20, passed: 18, failed: 2 },
        mode: 'incremental'
    });
    
    const stats = tester.getStats();
    
    if (stats.lastRun && stats.cachedFiles >= 0) {
        console.log('   ✅ Statistics available:');
        console.log(`      Last run: ${stats.timeSinceLastRun || 'just now'}`);
        console.log(`      Cached files: ${stats.cachedFiles}`);
        console.log(`      Last mode: ${stats.lastTestMode}`);
        if (stats.lastTestSummary) {
            console.log(`      Last results: ${stats.lastTestSummary.passed}/${stats.lastTestSummary.total} passed`);
        }
    } else {
        console.log('   ❌ Failed to get statistics');
    }
    
    console.log('');
}

// すべてのテストを実行
async function runAllTests() {
    try {
        await testCacheManagement();
        await testFileHashing();
        await testChangeDetection();
        await testTargetDetermination();
        await testSuiteDetermination();
        await testStatistics();
        
        console.log('✅ All incremental test feature tests completed!');
        
        // クリーンアップ
        cleanupTestDir();
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        cleanupTestDir();
        process.exit(1);
    }
}

// テストを実行
runAllTests();