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
    watch: false
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

const manifestPath = path.join(options.extensionPath, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
    console.error(`❌ manifest.json not found in: ${options.extensionPath}`);
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
    console.log(`👀 Watching for changes in: ${options.extensionPath}`);
    
    // 初回実行
    runTests();
    
    // ファイル変更を監視
    const watchDirs = [
        options.extensionPath,
        path.join(options.extensionPath, 'js'),
        path.join(options.extensionPath, 'css'),
        path.join(options.extensionPath, '_locales')
    ].filter(dir => fs.existsSync(dir));
    
    watchDirs.forEach(dir => {
        fs.watch(dir, { recursive: true }, (eventType, filename) => {
            if (filename && !filename.includes('test-results')) {
                console.log(`\n📝 File changed: ${filename}`);
                console.log('Re-running tests...\n');
                runTests();
            }
        });
    });
} else {
    // 通常実行
    runTests();
}