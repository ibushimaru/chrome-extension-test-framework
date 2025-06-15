/**
 * AutoFixer テスト
 */

const AutoFixer = require('../lib/AutoFixer');
const fs = require('fs');
const path = require('path');

// テスト用の一時ディレクトリ
const TEST_DIR = path.join(__dirname, 'temp-autofix-test');

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
}

console.log('🧪 AutoFixer Tests\n');

// manifest.json の自動修正テスト
async function testManifestFixes() {
    console.log('📋 Testing manifest.json fixes...');
    setupTestDir();
    
    // テスト1: manifest.jsonが存在しない場合
    {
        const fixer = new AutoFixer({ dryRun: false });
        const result = await fixer.fixManifest(TEST_DIR);
        
        const manifestPath = path.join(TEST_DIR, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (manifest.manifest_version === 3 && manifest.name && manifest.version) {
                console.log('   ✅ Created missing manifest.json');
            } else {
                console.log('   ❌ Created manifest.json with incorrect content');
            }
        } else {
            console.log('   ❌ Failed to create manifest.json');
        }
    }
    
    // テスト2: manifest_versionの修正
    {
        const badManifest = {
            manifest_version: 2,
            name: "Test Extension",
            version: "1.0.0"
        };
        fs.writeFileSync(
            path.join(TEST_DIR, 'manifest.json'),
            JSON.stringify(badManifest, null, 2)
        );
        
        const fixer = new AutoFixer({ dryRun: false });
        await fixer.fixManifest(TEST_DIR);
        
        const manifest = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'manifest.json'), 'utf8'));
        if (manifest.manifest_version === 3) {
            console.log('   ✅ Fixed manifest_version from 2 to 3');
        } else {
            console.log('   ❌ Failed to fix manifest_version');
        }
    }
    
    // テスト3: 不正なバージョン形式の修正
    {
        const badManifest = {
            manifest_version: 3,
            name: "Test Extension",
            version: "1.0.0-beta.1"
        };
        fs.writeFileSync(
            path.join(TEST_DIR, 'manifest.json'),
            JSON.stringify(badManifest, null, 2)
        );
        
        const fixer = new AutoFixer({ dryRun: false });
        await fixer.fixManifest(TEST_DIR);
        
        const manifest = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'manifest.json'), 'utf8'));
        if (/^\d+(\.\d+){0,3}$/.test(manifest.version)) {
            console.log('   ✅ Fixed invalid version format');
        } else {
            console.log('   ❌ Failed to fix version format');
        }
    }
    
    // テスト4: V2からV3への移行
    {
        const v2Manifest = {
            manifest_version: 2,
            name: "Test Extension",
            version: "1.0.0",
            browser_action: {
                default_popup: "popup.html"
            },
            background: {
                scripts: ["background.js"],
                persistent: false
            }
        };
        fs.writeFileSync(
            path.join(TEST_DIR, 'manifest.json'),
            JSON.stringify(v2Manifest, null, 2)
        );
        
        const fixer = new AutoFixer({ dryRun: false });
        await fixer.fixManifest(TEST_DIR);
        
        const manifest = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'manifest.json'), 'utf8'));
        if (manifest.action && !manifest.browser_action && 
            manifest.background.service_worker && !manifest.background.scripts) {
            console.log('   ✅ Migrated from Manifest V2 to V3');
        } else {
            console.log('   ❌ Failed to migrate from V2 to V3');
        }
    }
}

// ファイル名の自動修正テスト
async function testFileNameFixes() {
    console.log('\n📁 Testing file name fixes...');
    setupTestDir();
    
    // テストファイルを作成
    const testFiles = [
        'my file.js',           // スペースを含む
        'MY-SCRIPT.JS',         // 大文字
        'test@file!.html',      // 特殊文字
        'README.md',            // 許可される大文字
        'good_file.js'          // 正常なファイル名
    ];
    
    testFiles.forEach(file => {
        fs.writeFileSync(path.join(TEST_DIR, file), '// test content');
    });
    
    const fixer = new AutoFixer({ dryRun: false });
    const fixes = await fixer.fixFileNames(TEST_DIR);
    
    // 修正後のファイルを確認
    const expectedFixes = {
        'my file.js': 'my_file.js',
        'MY-SCRIPT.JS': 'my-script.js',
        'test@file!.html': 'testfile.html'
    };
    
    let fixedCount = 0;
    for (const [oldName, newName] of Object.entries(expectedFixes)) {
        if (!fs.existsSync(path.join(TEST_DIR, oldName)) && 
            fs.existsSync(path.join(TEST_DIR, newName))) {
            fixedCount++;
        }
    }
    
    if (fixedCount === Object.keys(expectedFixes).length) {
        console.log('   ✅ Fixed all problematic file names');
    } else {
        console.log(`   ❌ Fixed only ${fixedCount}/${Object.keys(expectedFixes).length} file names`);
    }
    
    // README.mdが変更されていないことを確認
    if (fs.existsSync(path.join(TEST_DIR, 'README.md'))) {
        console.log('   ✅ Preserved allowed uppercase files');
    } else {
        console.log('   ❌ Incorrectly renamed allowed uppercase files');
    }
}

// CSPの自動修正テスト
async function testCSPFixes() {
    console.log('\n🔒 Testing CSP fixes...');
    setupTestDir();
    
    // V2形式のCSPを持つmanifest
    const v2CSPManifest = {
        manifest_version: 3,
        name: "Test Extension",
        version: "1.0.0",
        content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'"
    };
    
    fs.writeFileSync(
        path.join(TEST_DIR, 'manifest.json'),
        JSON.stringify(v2CSPManifest, null, 2)
    );
    
    const fixer = new AutoFixer({ dryRun: false });
    await fixer.fixCSP(TEST_DIR);
    
    const manifest = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'manifest.json'), 'utf8'));
    
    if (typeof manifest.content_security_policy === 'object' &&
        manifest.content_security_policy.extension_pages &&
        !manifest.content_security_policy.extension_pages.includes('unsafe-eval')) {
        console.log('   ✅ Fixed CSP format and removed unsafe-eval');
    } else {
        console.log('   ❌ Failed to fix CSP');
    }
}

// Dry-runモードのテスト
async function testDryRunMode() {
    console.log('\n🏃 Testing dry-run mode...');
    setupTestDir();
    
    // manifest.jsonを作成
    const manifest = {
        manifest_version: 2,
        name: "Test Extension",
        version: "1.0.0"
    };
    fs.writeFileSync(
        path.join(TEST_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    // Dry-runモードで実行
    const fixer = new AutoFixer({ dryRun: true, verbose: false });
    await fixer.fixAll(TEST_DIR);
    
    // ファイルが変更されていないことを確認
    const afterManifest = JSON.parse(fs.readFileSync(path.join(TEST_DIR, 'manifest.json'), 'utf8'));
    if (afterManifest.manifest_version === 2) {
        console.log('   ✅ Dry-run mode: files not modified');
    } else {
        console.log('   ❌ Dry-run mode: files were modified');
    }
    
    // 修正が記録されていることを確認
    if (fixer.fixes.length > 0) {
        console.log('   ✅ Dry-run mode: fixes recorded');
    } else {
        console.log('   ❌ Dry-run mode: no fixes recorded');
    }
}

// すべてのテストを実行
async function runAllTests() {
    try {
        await testManifestFixes();
        await testFileNameFixes();
        await testCSPFixes();
        await testDryRunMode();
        
        console.log('\n✅ All AutoFixer tests completed!');
        
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