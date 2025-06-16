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
    fixDryRun: false,
    exclude: [],
    include: [],
    profile: null,
    failOnWarning: false,
    failOnError: false,
    changed: false,
    sinceLastRun: false,
    clearCache: false,
    noVersionCheck: false,
    showConfig: false,
    init: false,
    quiet: false
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
            
        case '--exclude':
            options.exclude = args[++i].split(',');
            break;
            
        case '--include':
            options.include = args[++i].split(',');
            break;
            
        case '--profile':
            options.profile = args[++i];
            break;
            
        case '--fail-on-warning':
            options.failOnWarning = true;
            break;
            
        case '--fail-on-error':
            options.failOnError = true;
            break;
            
        case '--changed':
            options.changed = true;
            break;
            
        case '--since-last-run':
            options.sinceLastRun = true;
            break;
            
        case '--clear-cache':
            options.clearCache = true;
            break;
            
        case '--no-version-check':
            options.noVersionCheck = true;
            break;
            
        case '--show-config':
            options.showConfig = true;
            break;
            
        case '--debug-config':
            options.debugConfig = true;
            break;
            
        case '--init':
            options.init = true;
            break;
            
        case '--quiet':
        case '-q':
            options.quiet = true;
            options.progress = false;
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
  --exclude <patterns>    Exclude files/directories (comma-separated glob patterns)
  --include <patterns>    Include only specific files/directories
  --profile <name>        Use a predefined profile (development, production, ci, quick)
  --fail-on-warning       Exit with error code if warnings are found
  --fail-on-error         Exit with error code if errors are found
  --changed               Test only changed files (requires git)
  --since-last-run        Test only files changed since last run
  --clear-cache           Clear the test cache
  --no-version-check      Disable update notifications
  --show-config           Show the current configuration and exit
  --debug-config          Show detailed configuration loading process
  --init                  Initialize a new configuration file
  -q, --quiet             Quiet mode for CI (errors/warnings only)

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
  cext-test --exclude "test/**,docs/**" # Exclude test and docs directories
  cext-test --include "js/**,css/**"    # Test only js and css files
  cext-test --profile production        # Use production profile
  cext-test --changed                   # Test only changed files (git)
  cext-test --since-last-run            # Test files changed since last run

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

// 設定ファイルの初期化
if (options.init) {
    const configPath = path.join(process.cwd(), '.cextrc.json');
    
    if (fs.existsSync(configPath)) {
        console.error('❌ Configuration file already exists: .cextrc.json');
        console.log('💡 Use --config to specify a different config file');
        process.exit(1);
    }
    
    const defaultConfig = {
        "$schema": "./node_modules/chrome-extension-test-framework/.cextrc.schema.json",
        "extensionPath": ".",
        "output": {
            "format": ["console", "json"],
            "directory": "./test-results"
        },
        "exclude": [
            "node_modules/**",
            "test/**",
            "tests/**",
            "*.test.js",
            "*.spec.js"
        ],
        "consoleThresholds": {
            "production": 10,
            "development": 50,
            "test": null
        },
        "profile": "development",
        "failOnError": true,
        "failOnWarning": false
    };
    
    try {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('✅ Created .cextrc.json configuration file');
        console.log('\n📝 Configuration includes:');
        console.log('   • VS Code autocomplete support ($schema)');
        console.log('   • Common exclude patterns');
        console.log('   • Console usage thresholds');
        console.log('   • Development profile by default');
        console.log('\n💡 Next steps:');
        console.log('   1. Edit .cextrc.json to customize settings');
        console.log('   2. Run: cext-test');
        console.log('\n📚 Documentation: https://github.com/ibushimaru/chrome-extension-test-framework');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Failed to create config file: ${error.message}`);
        process.exit(1);
    }
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
            parallel: options.parallel,
            exclude: options.exclude,
            include: options.include,
            failOnWarning: options.failOnWarning,
            failOnError: options.failOnError,
            profile: options.profile,
            progress: options.progress,
            verbose: options.verbose,
            quiet: options.quiet
        });

        // 設定ファイルを読み込み
        let defaultConfigPath = null;
        if (options.config) {
            await framework.loadConfig(options.config);
            defaultConfigPath = options.config;
        } else {
            // 設定ファイルの自動検出
            const ConfigLoader = require('../lib/ConfigLoader');
            const configLoader = new ConfigLoader();
            defaultConfigPath = configLoader.findDefaultConfig();
            
            if (defaultConfigPath) {
                console.log(`📄 Found config file: ${path.basename(defaultConfigPath)}`);
                await framework.loadConfig(defaultConfigPath);
            }
        }
        
        // プロファイルが指定されている場合（設定ファイル後に適用）
        if (options.profile && !framework.config.profile) {
            framework.applyProfile(options.profile);
        }
        
        // --debug-configオプションの処理
        if (options.debugConfig) {
            console.log('🔍 Configuration Debug Mode\n');
            
            console.log('1. Loading configuration...');
            console.log(`   ✅ Working directory: ${process.cwd()}`);
            console.log(`   ✅ Extension path: ${options.extensionPath}`);
            
            if (defaultConfigPath) {
                console.log(`   ✅ Config file found: ${defaultConfigPath}`);
                console.log(`   ✅ Config loaded from: ${path.basename(defaultConfigPath)}`);
            } else {
                console.log('   ℹ️  No config file found, using defaults');
            }
            
            if (options.profile) {
                console.log(`   ✅ Profile applied: ${options.profile}`);
            }
            
            console.log('\n2. File discovery...');
            // ファイル探索のシミュレーション
            const allFiles = await framework.suites[0]?.getAllFiles('', [], { skipExclude: true }) || [];
            console.log(`   ✅ Total files found: ${allFiles.length}`);
            
            if (framework.config.exclude && framework.config.exclude.length > 0) {
                console.log(`\n3. Applying exclude patterns: ${JSON.stringify(framework.config.exclude)}`);
                const excludedCount = allFiles.length - (await framework.suites[0]?.getAllFiles() || []).length;
                console.log(`   ✅ Files excluded: ${excludedCount}`);
            }
            
            console.log('\n4. Final configuration:');
            console.log(`   - Console thresholds:`);
            const thresholds = framework.config.consoleThresholds || {};
            console.log(`     • production: ${thresholds.production !== undefined ? thresholds.production : 10}`);
            console.log(`     • development: ${thresholds.development !== undefined ? thresholds.development : 100}`);
            console.log(`     • test: ${thresholds.test !== undefined ? thresholds.test : 'Infinity'}`);
            if (thresholds.warn !== undefined) {
                console.log(`     • warn: ${thresholds.warn}`);
            }
            if (thresholds.error !== undefined) {
                console.log(`     • error: ${thresholds.error}`);
            }
            
            if (framework.config.allowedDevFiles) {
                console.log(`   - Allowed dev files: ${JSON.stringify(framework.config.allowedDevFiles)}`);
            }
            
            console.log('\n5. Test execution plan:');
            const testSuites = options.suites.includes('all') ? 
                ['manifest', 'security', 'performance', 'structure', 'localization'] : 
                options.suites;
            console.log(`   - Test suites: ${testSuites.join(', ')}`);
            console.log(`   - Parallel execution: ${framework.config.parallel ? 'enabled' : 'disabled'}`);
            console.log(`   - Timeout: ${framework.config.timeout}ms`);
            
            process.exit(0);
        }
        
        // --show-configオプションの処理
        if (options.showConfig) {
            console.log('📄 Current Configuration:');
            
            // 基本設定
            const effectiveConfig = {
                extensionPath: framework.config.extensionPath,
                output: framework.config.output,
                validation: framework.config.validation,
                parallel: framework.config.parallel,
                timeout: framework.config.timeout,
                exclude: framework.config.exclude || [],
                include: framework.config.include || [],
                failOnWarning: framework.config.failOnWarning,
                failOnError: framework.config.failOnError
            };
            
            // プロファイル情報
            if (framework.config.profile) {
                effectiveConfig.profile = {
                    name: framework.config.profile.name,
                    description: framework.config.profile.description,
                    skipTests: framework.config.profile.skipTests || [],
                    warningLevels: framework.config.profile.warningLevels || {},
                    maxFileSize: framework.config.profile.maxFileSize
                };
            }
            
            // カスタム設定
            if (framework.config.consoleThresholds) {
                effectiveConfig.consoleThresholds = framework.config.consoleThresholds;
            }
            if (framework.config.allowedDevFiles) {
                effectiveConfig.allowedDevFiles = framework.config.allowedDevFiles;
            }
            
            console.log(JSON.stringify(effectiveConfig, null, 2));
            
            if (framework.config.profile) {
                console.log('\n📝 Active Profile:', framework.config.profile.name);
                console.log('   Description:', framework.config.profile.description);
                if (framework.config.profile.skipTests && framework.config.profile.skipTests.length > 0) {
                    console.log('   Skipped tests:', framework.config.profile.skipTests.join(', '));
                }
            }
            
            console.log('\n🔍 Exclude Patterns:');
            console.log(JSON.stringify(framework.excludeManager.getPatterns(), null, 2));
            
            console.log('\n📊 Settings Source:');
            console.log('   - Default values: Built-in framework defaults');
            if (defaultConfigPath) {
                console.log(`   - Config file: ${path.basename(defaultConfigPath)}`);
            }
            if (options.profile) {
                console.log(`   - Profile: ${options.profile}`);
            }
            console.log('   - CLI arguments: Override all above');
            
            process.exit(0);
        }
        
        // キャッシュクリアオプション
        if (options.clearCache) {
            console.log('🗑️  Clearing test cache...');
            framework.incrementalTester.clearCache();
            console.log('✅ Cache cleared');
            if (!options.changed && !options.sinceLastRun) {
                return;
            }
        }
        
        // インクリメンタルテストの判定
        if (options.changed || options.sinceLastRun) {
            const testTargets = await framework.incrementalTester.determineTestTargets({
                all: false,
                useGit: options.changed,
                sinceLastRun: options.sinceLastRun
            });
            
            console.log(`\n🔍 Incremental test mode: ${testTargets.reason}`);
            
            if (testTargets.mode === 'none') {
                console.log('✨ No changes detected - all tests are up to date!');
                process.exit(0);
            } else if (testTargets.mode === 'incremental') {
                console.log(`   Testing ${testTargets.files.length} affected files`);
                console.log(`   Suites: ${testTargets.suites.join(', ') || 'all'}`);
                
                // 特定のスイートのみ実行
                if (testTargets.suites.length > 0) {
                    options.suites = testTargets.suites;
                }
            }
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
                    const suiteConfig = {
                        ...framework.config,
                        excludeManager: framework.excludeManager
                    };
                    framework.addSuite(new Suite(suiteConfig));
                } else {
                    console.warn(`⚠️  Unknown test suite: ${suiteName}`);
                }
            });
        }

        // テストを実行
        const results = await framework.run();
        
        // インクリメンタルテストの結果を記録
        if (options.changed || options.sinceLastRun) {
            framework.incrementalTester.recordTestRun(results);
        }

        // 終了コードを設定
        let exitCode = 0;
        
        if (options.failOnError && results.summary.failed > 0) {
            exitCode = 1;
        }
        
        if (options.failOnWarning && results.warnings && results.warnings.length > 0) {
            exitCode = 1;
        }
        
        if (!options.failOnError && results.summary.failed > 0) {
            exitCode = 1;
        }
        
        process.exit(exitCode);

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