/**
 * 除外機能のテスト
 */

const ExcludeManager = require('../lib/ExcludeManager');
const WarningManager = require('../lib/WarningManager');
const ProfileManager = require('../lib/ProfileManager');

console.log('🧪 Exclude and Filter Tests\n');

// ExcludeManager のテスト
async function testExcludeManager() {
    console.log('📋 Testing ExcludeManager...');
    
    const config = {
        exclude: ['test/**', '*.test.js', 'docs/**'],
        excludePatterns: {
            directories: ['screenshot', 'build'],
            files: ['*.tmp', '*.log'],
            byContext: {
                development: ['*.dev.js', 'debug/**'],
                production: ['test/**', 'docs/**']
            }
        },
        context: 'development'
    };
    
    const excludeManager = new ExcludeManager(config);
    
    // テストケース
    const testCases = [
        { file: 'src/index.js', shouldExclude: false },
        { file: 'test/app.test.js', shouldExclude: true },
        { file: 'docs/README.md', shouldExclude: true },
        { file: 'screenshot/test.png', shouldExclude: true },
        { file: 'app.test.js', shouldExclude: true },
        { file: 'debug/test.js', shouldExclude: true },
        { file: 'app.dev.js', shouldExclude: true },
        { file: 'temp.tmp', shouldExclude: true },
        { file: 'node_modules/test.js', shouldExclude: true },
        { file: '.git/config', shouldExclude: true }
    ];
    
    let passed = 0;
    testCases.forEach(({ file, shouldExclude }) => {
        const result = excludeManager.shouldExclude(file);
        if (result === shouldExclude) {
            console.log(`   ✅ ${file} → ${shouldExclude ? 'excluded' : 'included'}`);
            passed++;
        } else {
            console.log(`   ❌ ${file} → ${result ? 'excluded' : 'included'} (expected ${shouldExclude ? 'excluded' : 'included'})`);
        }
    });
    
    console.log(`   📊 Passed: ${passed}/${testCases.length}\n`);
}

// WarningManager のテスト
async function testWarningManager() {
    console.log('📋 Testing WarningManager...');
    
    const config = {
        warningLevels: {
            'console-logging': 'warn',
            'innerHTML-usage': {
                severity: 'error',
                excludeFiles: ['test/**', '*.test.js']
            },
            'excessive-logging': {
                severity: 'warn',
                threshold: 10
            },
            'debug-code': 'ignore-in-test-files'
        },
        knownIssues: [
            {
                file: 'manual-test.html',
                issue: 'inline-script',
                reason: 'Test file only'
            },
            {
                file: 'legacy/*.js',
                issue: 'eval-usage',
                reason: 'Legacy code - will be refactored'
            }
        ]
    };
    
    const warningManager = new WarningManager(config);
    
    // 警告レベルのテスト
    console.log('   Testing warning levels:');
    const levelTests = [
        { type: 'console-logging', context: {}, expected: 'warn' },
        { type: 'innerHTML-usage', context: { file: 'app.js' }, expected: 'error' },
        { type: 'innerHTML-usage', context: { file: 'test/app.test.js' }, expected: 'ignore' },
        { type: 'excessive-logging', context: { count: 5 }, expected: 'ignore' },
        { type: 'excessive-logging', context: { count: 15 }, expected: 'warn' },
        { type: 'debug-code', context: { file: 'app.test.js' }, expected: 'ignore' },
        { type: 'debug-code', context: { file: 'app.js' }, expected: 'warn' }
    ];
    
    let levelPassed = 0;
    levelTests.forEach(({ type, context, expected }) => {
        const level = warningManager.getWarningLevel(type, context);
        if (level === expected) {
            console.log(`   ✅ ${type} (${JSON.stringify(context)}) → ${level}`);
            levelPassed++;
        } else {
            console.log(`   ❌ ${type} (${JSON.stringify(context)}) → ${level} (expected ${expected})`);
        }
    });
    
    // 既知の問題のテスト
    console.log('\n   Testing known issues:');
    const knownTests = [
        { file: 'manual-test.html', issue: 'inline-script', shouldBeKnown: true },
        { file: 'legacy/old.js', issue: 'eval-usage', shouldBeKnown: true },
        { file: 'app.js', issue: 'inline-script', shouldBeKnown: false }
    ];
    
    let knownPassed = 0;
    knownTests.forEach(({ file, issue, shouldBeKnown }) => {
        const isKnown = warningManager.isKnownIssue(file, issue);
        if (isKnown === shouldBeKnown) {
            console.log(`   ✅ ${file} + ${issue} → ${isKnown ? 'known' : 'unknown'}`);
            knownPassed++;
        } else {
            console.log(`   ❌ ${file} + ${issue} → ${isKnown ? 'known' : 'unknown'} (expected ${shouldBeKnown ? 'known' : 'unknown'})`);
        }
    });
    
    console.log(`   📊 Level tests: ${levelPassed}/${levelTests.length}`);
    console.log(`   📊 Known issues: ${knownPassed}/${knownTests.length}\n`);
}

// ProfileManager のテスト
async function testProfileManager() {
    console.log('📋 Testing ProfileManager...');
    
    const config = {
        profiles: {
            custom: {
                name: 'Custom Profile',
                description: 'Custom test profile',
                exclude: ['custom/**'],
                warningLevels: {
                    'custom-warning': 'error'
                }
            }
        }
    };
    
    const profileManager = new ProfileManager(config);
    
    // プロファイル一覧のテスト
    console.log('   Available profiles:');
    const profiles = profileManager.listProfiles();
    profiles.forEach(profile => {
        console.log(`   ${profile.isDefault ? '📦' : '⚙️'}  ${profile.key}: ${profile.name} - ${profile.description}`);
    });
    
    // プロファイル適用のテスト
    console.log('\n   Testing profile application:');
    const baseConfig = {
        exclude: ['base/**'],
        warningLevels: {
            'base-warning': 'warn'
        }
    };
    
    const testProfiles = ['development', 'production', 'ci', 'custom'];
    testProfiles.forEach(profileName => {
        try {
            const applied = profileManager.applyProfile(profileName, baseConfig);
            console.log(`   ✅ Applied ${profileName} profile`);
            if (applied.exclude && applied.exclude.length > baseConfig.exclude.length) {
                console.log(`      Added ${applied.exclude.length - baseConfig.exclude.length} exclude patterns`);
            }
        } catch (error) {
            console.log(`   ❌ Failed to apply ${profileName}: ${error.message}`);
        }
    });
    
    console.log('\n');
}

// Include パターンのテスト
async function testIncludePatterns() {
    console.log('📋 Testing include patterns...');
    
    const config = {
        include: ['js/**', 'css/**', 'manifest.json'],
        exclude: ['node_modules/**', '**/*.test.js']  // ** を追加
    };
    
    const excludeManager = new ExcludeManager(config);
    
    const testCases = [
        { file: 'js/app.js', shouldExclude: false },
        { file: 'css/style.css', shouldExclude: false },
        { file: 'manifest.json', shouldExclude: false },
        { file: 'index.html', shouldExclude: true }, // not in include
        { file: 'docs/README.md', shouldExclude: true }, // not in include
        { file: 'js/app.test.js', shouldExclude: true }, // excluded pattern
    ];
    
    let passed = 0;
    testCases.forEach(({ file, shouldExclude }) => {
        const result = excludeManager.shouldExclude(file);
        if (result === shouldExclude) {
            console.log(`   ✅ ${file} → ${shouldExclude ? 'excluded' : 'included'}`);
            passed++;
        } else {
            console.log(`   ❌ ${file} → ${result ? 'excluded' : 'included'} (expected ${shouldExclude ? 'excluded' : 'included'})`);
        }
    });
    
    console.log(`   📊 Passed: ${passed}/${testCases.length}\n`);
}

// 統計情報のテスト
async function testStatistics() {
    console.log('📋 Testing exclude statistics...');
    
    const config = {
        exclude: ['test/**', '*.test.js', 'node_modules/**']
    };
    
    const excludeManager = new ExcludeManager(config);
    
    const files = [
        'src/app.js',
        'src/utils.js',
        'test/app.test.js',
        'test/utils.test.js',
        'unit.test.js',
        'node_modules/lib/index.js',
        'README.md'
    ];
    
    const stats = excludeManager.getStats(files);
    
    console.log(`   Total files: ${stats.totalFiles}`);
    console.log(`   Included: ${stats.includedFiles}`);
    console.log(`   Excluded: ${stats.excludedFiles}`);
    console.log('\n   Excluded by pattern:');
    
    Object.entries(stats.excludedByPattern).forEach(([pattern, count]) => {
        console.log(`   - ${pattern}: ${count} files`);
    });
    
    console.log('\n');
}

// すべてのテストを実行
async function runAllTests() {
    try {
        await testExcludeManager();
        await testWarningManager();
        await testProfileManager();
        await testIncludePatterns();
        await testStatistics();
        
        console.log('✅ All exclude and filter tests completed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// テストを実行
runAllTests();