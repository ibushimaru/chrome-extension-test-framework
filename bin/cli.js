#!/usr/bin/env node

/**
 * Chrome Extension Test Framework CLI
 */

const path = require('path');
const fs = require('fs');
const ChromeExtensionTestFramework = require('../index');

// CLIのバージョン
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// コマンドライン引数の解析
const args = process.argv.slice(2);
const options = {
    help: false,
    version: false,
    config: null,
    output: {
        format: ['console', 'json', 'html'],
        directory: './test-results'
    },
    extensionPath: process.cwd(),
    suites: ['all'],
    parallel: false,
    watch: false,
    fix: false,
    fixDryRun: false
};

// 引数を解析
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
        case '-h':
        case '--help':
            options.help = true;
            break;
            
        case '-v':
        case '--version':
            options.version = true;
            break;
            
        case '-c':
        case '--config':
            options.config = args[++i];
            break;
            
        case '-o':
        case '--output':
            options.output.format = args[++i].split(',');
            break;
            
        case '-d':
        case '--output-dir':
            options.output.directory = args[++i];
            break;
            
        case '-p':
        case '--path':
            options.extensionPath = path.resolve(args[++i]);
            break;
            
        case '-s':
        case '--suites':
            options.suites = args[++i].split(',');
            break;
            
        case '--parallel':
            options.parallel = true;
            break;
            
        case '-w':
        case '--watch':
            options.watch = true;
            break;
            
        case '--no-progress':
            options.progress = false;
            break;
            
        case '--verbose':
            options.verbose = true;
            break;
            
        case '--fix':
            options.fix = true;
            break;
            
        case '--fix-dry-run':
            options.fixDryRun = true;
            options.fix = true;
            break;
            
        default:
            if (!arg.startsWith('-')) {
                options.extensionPath = path.resolve(arg);
            }
    }
}

// ヘルプを表示
if (options.help) {
    console.log(`
Chrome Extension Test Framework v${VERSION}

Usage: cext-test [options] [extension-path]

Options:
  -h, --help              Show this help message
  -v, --version           Show version number
  -c, --config <file>     Path to config file
  -o, --output <formats>  Output formats (comma-separated: console,json,html,markdown)
  -d, --output-dir <dir>  Output directory for reports (default: ./test-results)
  -p, --path <path>       Path to Chrome extension (default: current directory)
  -s, --suites <suites>   Test suites to run (comma-separated or 'all')
  --parallel              Run tests in parallel
  -w, --watch             Watch mode - re-run tests on file changes
  --no-progress           Disable progress display
  --verbose               Show detailed progress information
  --fix                   Automatically fix common issues
  --fix-dry-run           Show what would be fixed without making changes

Test Suites:
  manifest      - Validate manifest.json
  security      - Security checks
  performance   - Performance optimization
  structure     - File structure validation
  localization  - i18n support validation
  all           - Run all test suites (default)

Examples:
  cext-test                           # Test current directory
  cext-test /path/to/extension        # Test specific extension
  cext-test -o json,html              # Generate JSON and HTML reports
  cext-test -s manifest,security      # Run specific test suites
  cext-test -c my-config.json         # Use custom config file
  cext-test --fix                     # Automatically fix issues
  cext-test --fix-dry-run             # Preview fixes without applying them

Configuration:
  Create a cext-test.config.js or .cextrc.json file for custom settings:
  
  module.exports = {
    extensionPath: './src',
    output: {
      format: ['console', 'json', 'html'],
      directory: './reports'
    },
    validation: {
      manifest: true,
      permissions: true,
      csp: true
    },
    rules: [
      // Custom validation rules
    ]
  };
`);
    process.exit(0);
}

// バージョンを表示
if (options.version) {
    console.log(`v${VERSION}`);
    process.exit(0);
}

// 拡張機能パスの検証
if (!fs.existsSync(options.extensionPath)) {
    console.error(`❌ Extension path not found: ${options.extensionPath}`);
    process.exit(1);
}

// Auto-fix モード
if (options.fix) {
    const AutoFixer = require('../lib/AutoFixer');
    const fixer = new AutoFixer({
        dryRun: options.fixDryRun,
        verbose: options.verbose
    });

    (async () => {
        try {
            const result = await fixer.fixAll(options.extensionPath);
            
            console.log('\n📊 Auto-fix Summary:');
            console.log(`   Total fixes: ${result.summary.total}`);
            
            if (result.summary.total > 0) {
                console.log('\n   By type:');
                for (const [type, count] of Object.entries(result.summary.byType)) {
                    console.log(`   - ${type}: ${count}`);
                }
            }
            
            if (options.fixDryRun) {
                console.log('\n💡 Run with --fix (without --dry-run) to apply these fixes');
            } else if (result.summary.total > 0) {
                console.log('\n✅ Fixes applied successfully!');
                console.log('💡 Run tests again to verify the fixes');
            } else {
                console.log('\n✨ No issues found that can be auto-fixed');
            }
            
            process.exit(0);
        } catch (error) {
            console.error(`\n❌ Auto-fix failed: ${error.message}`);
            process.exit(1);
        }
    })();
    return;
}

const manifestPath = path.join(options.extensionPath, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
    console.error(`❌ manifest.json not found in: ${options.extensionPath}`);
    console.log('\n💡 Tip: Run with --fix to create a default manifest.json');
    process.exit(1);
}

// メイン実行関数
async function runTests() {
    try {
        // フレームワークのインスタンスを作成
        const framework = new ChromeExtensionTestFramework({
            extensionPath: options.extensionPath,
            output: options.output,
            parallel: options.parallel
        });

        // 設定ファイルを読み込み
        if (options.config) {
            await framework.loadConfig(options.config);
        }

        // テストスイートを選択
        if (options.suites.includes('all')) {
            framework.useBuiltinTests();
        } else {
            // 個別のスイートを追加
            const suiteMap = {
                'manifest': require('../suites/ManifestTestSuite'),
                'security': require('../suites/SecurityTestSuite'),
                'performance': require('../suites/PerformanceTestSuite'),
                'structure': require('../suites/StructureTestSuite'),
                'localization': require('../suites/LocalizationTestSuite')
            };

            options.suites.forEach(suiteName => {
                const Suite = suiteMap[suiteName.toLowerCase()];
                if (Suite) {
                    framework.addSuite(new Suite(framework.config));
                } else {
                    console.warn(`⚠️  Unknown test suite: ${suiteName}`);
                }
            });
        }

        // テストを実行
        const results = await framework.run();

        // 終了コードを設定
        process.exit(results.summary.failed > 0 ? 1 : 0);

    } catch (error) {
        console.error(`\n❌ Test execution failed: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// ウォッチモード
if (options.watch) {
    const FileWatcher = require('../lib/FileWatcher');
    
    // 初回実行
    console.log('🚀 Running initial tests...\n');
    runTests().then(() => {
        // ファイル監視を開始
        const watcher = new FileWatcher({
            extensionPath: options.extensionPath,
            debounceTime: 500,
            ignorePatterns: [
                'node_modules',
                '.git',
                'test-results',
                'test-output',
                '.DS_Store',
                'Thumbs.db',
                '*.log',
                '*.tmp'
            ]
        });

        // テスト実行中フラグ
        let isRunning = false;
        
        // 変更時の処理
        watcher.on('change', async (changeInfo) => {
            if (isRunning) {
                console.log('   ⏳ Test already running, skipping...');
                return;
            }

            isRunning = true;
            console.log('\n🔄 Re-running tests...\n');
            
            try {
                await runTests();
            } catch (error) {
                // エラーが発生してもウォッチモードは継続
                console.error('Test execution error:', error.message);
            } finally {
                isRunning = false;
            }
        });

        // 特定ファイルの変更に対する特別な処理
        watcher.on('manifest-change', () => {
            console.log('   ⚠️  manifest.json changed - full test suite will run');
        });

        // Ctrl+Cで終了
        process.on('SIGINT', () => {
            console.log('\n\n👋 Stopping watch mode...');
            watcher.stop();
            
            // 統計を表示
            const stats = watcher.getStats();
            console.log('\n📊 Watch Mode Statistics:');
            console.log(`   Total changes detected: ${stats.totalChanges}`);
            console.log(`   Unique files changed: ${stats.changedFiles.size}`);
            
            if (Object.keys(stats.fileTypes).length > 0) {
                console.log('\n   Changes by file type:');
                Object.entries(stats.fileTypes).forEach(([type, count]) => {
                    console.log(`   - ${type}: ${count}`);
                });
            }
            
            process.exit(0);
        });

        // ウォッチャーを開始
        watcher.start();
    }).catch(error => {
        console.error('Initial test run failed:', error.message);
        process.exit(1);
    });
} else {
    // 通常実行
    runTests();
}