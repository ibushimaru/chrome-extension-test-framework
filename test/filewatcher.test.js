/**
 * FileWatcher テスト
 */

const FileWatcher = require('../lib/FileWatcher');
const fs = require('fs');
const path = require('path');

// テスト用の一時ディレクトリ
const TEST_DIR = path.join(__dirname, 'temp-watcher-test');

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
    
    // テスト用のディレクトリ構造を作成
    fs.mkdirSync(path.join(TEST_DIR, 'js'), { recursive: true });
    fs.mkdirSync(path.join(TEST_DIR, 'css'), { recursive: true });
    fs.mkdirSync(path.join(TEST_DIR, '_locales/en'), { recursive: true });
    
    // テスト用ファイルを作成
    fs.writeFileSync(path.join(TEST_DIR, 'manifest.json'), JSON.stringify({
        manifest_version: 3,
        name: "Test Extension",
        version: "1.0.0"
    }, null, 2));
    
    fs.writeFileSync(path.join(TEST_DIR, 'js/background.js'), '// background script');
    fs.writeFileSync(path.join(TEST_DIR, 'js/content.js'), '// content script');
    fs.writeFileSync(path.join(TEST_DIR, 'css/style.css'), 'body { margin: 0; }');
}

console.log('🧪 FileWatcher Tests\n');

// FileWatcher初期化テスト
async function testFileWatcherInitialization() {
    console.log('📋 Testing FileWatcher initialization...');
    setupTestDir();
    
    const watcher = new FileWatcher({
        extensionPath: TEST_DIR,
        debounceTime: 100
    });
    
    if (watcher.extensionPath === TEST_DIR && watcher.debounceTime === 100) {
        console.log('   ✅ FileWatcher initialized correctly');
    } else {
        console.log('   ❌ FileWatcher initialization failed');
    }
    
    watcher.stop();
}

// ファイル変更検出テスト
async function testChangeDetection() {
    console.log('\n📋 Testing change detection...');
    setupTestDir();
    
    const watcher = new FileWatcher({
        extensionPath: TEST_DIR,
        debounceTime: 100
    });
    
    let changeDetected = false;
    let changeInfo = null;
    
    watcher.on('change', (info) => {
        changeDetected = true;
        changeInfo = info;
    });
    
    // ウォッチャーを開始
    watcher.start();
    
    // ファイルを変更
    await new Promise(resolve => setTimeout(resolve, 200));
    fs.writeFileSync(path.join(TEST_DIR, 'js/background.js'), '// modified');
    
    // 変更が検出されるまで待つ
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (changeDetected && changeInfo && changeInfo.files.length > 0) {
        console.log('   ✅ File changes detected');
        console.log(`   ✅ Changed files: ${changeInfo.files.join(', ')}`);
    } else {
        console.log('   ❌ Failed to detect file changes');
    }
    
    watcher.stop();
}

// デバウンステスト
async function testDebouncing() {
    console.log('\n📋 Testing debouncing...');
    setupTestDir();
    
    const watcher = new FileWatcher({
        extensionPath: TEST_DIR,
        debounceTime: 200
    });
    
    let changeCount = 0;
    
    watcher.on('change', () => {
        changeCount++;
    });
    
    watcher.start();
    
    // 短時間に複数のファイルを変更
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(TEST_DIR, 'js/background.js'), '// change 1');
    fs.writeFileSync(path.join(TEST_DIR, 'js/content.js'), '// change 2');
    fs.writeFileSync(path.join(TEST_DIR, 'css/style.css'), '/* change 3 */');
    
    // デバウンス時間より長く待つ
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (changeCount === 1) {
        console.log('   ✅ Debouncing works correctly (1 event for 3 changes)');
    } else {
        console.log(`   ❌ Debouncing failed (${changeCount} events for 3 changes)`);
    }
    
    watcher.stop();
}

// ファイルタイプ検出テスト
async function testFileTypeDetection() {
    console.log('\n📋 Testing file type detection...');
    setupTestDir();
    
    const watcher = new FileWatcher({
        extensionPath: TEST_DIR,
        debounceTime: 100
    });
    
    // ファイルタイプのテスト
    const testCases = [
        { file: 'manifest.json', expected: 'manifest' },
        { file: 'background.js', expected: 'background' },
        { file: 'content-script.js', expected: 'content-script' },
        { file: 'popup.html', expected: 'popup' },
        { file: 'style.css', expected: 'stylesheet' },
        { file: 'icon.png', expected: 'image' }
    ];
    
    let allPassed = true;
    
    testCases.forEach(({ file, expected }) => {
        const detected = watcher.getFileType(path.join(TEST_DIR, file));
        if (detected === expected) {
            console.log(`   ✅ ${file} → ${expected}`);
        } else {
            console.log(`   ❌ ${file} → ${detected} (expected ${expected})`);
            allPassed = false;
        }
    });
    
    watcher.stop();
}

// 統計収集テスト
async function testStatistics() {
    console.log('\n📋 Testing statistics collection...');
    setupTestDir();
    
    const watcher = new FileWatcher({
        extensionPath: TEST_DIR,
        debounceTime: 100
    });
    
    watcher.start();
    
    // 複数の変更を行う
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(TEST_DIR, 'js/background.js'), '// change 1');
    await new Promise(resolve => setTimeout(resolve, 200));
    fs.writeFileSync(path.join(TEST_DIR, 'manifest.json'), '{"version": "1.0.1"}');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stats = watcher.getStats();
    
    if (stats.totalChanges > 0 && stats.changedFiles.size > 0) {
        console.log('   ✅ Statistics collected correctly');
        console.log(`      Total changes: ${stats.totalChanges}`);
        console.log(`      Unique files: ${stats.changedFiles.size}`);
    } else {
        console.log('   ❌ Statistics collection failed');
    }
    
    watcher.stop();
}

// 無視パターンテスト
async function testIgnorePatterns() {
    console.log('\n📋 Testing ignore patterns...');
    
    const watcher = new FileWatcher({
        extensionPath: TEST_DIR,
        ignorePatterns: ['*.log', 'node_modules', '.git']
    });
    
    const testCases = [
        { file: 'test.js', shouldWatch: true },
        { file: 'test.log', shouldWatch: false },
        { file: 'node_modules/test.js', shouldWatch: false },
        { file: '.git/config', shouldWatch: false },
        { file: 'manifest.json', shouldWatch: true }
    ];
    
    let allPassed = true;
    
    testCases.forEach(({ file, shouldWatch }) => {
        const result = watcher.shouldWatch(file);
        if (result === shouldWatch) {
            console.log(`   ✅ ${file} → ${shouldWatch ? 'watched' : 'ignored'}`);
        } else {
            console.log(`   ❌ ${file} → ${result ? 'watched' : 'ignored'} (expected ${shouldWatch ? 'watched' : 'ignored'})`);
            allPassed = false;
        }
    });
    
    watcher.stop();
}

// すべてのテストを実行
async function runAllTests() {
    try {
        await testFileWatcherInitialization();
        await testChangeDetection();
        await testDebouncing();
        await testFileTypeDetection();
        await testStatistics();
        await testIgnorePatterns();
        
        console.log('\n✅ All FileWatcher tests completed!');
        
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