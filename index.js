/**
 * Chrome Extension Test Framework
 * 汎用的なChrome拡張機能テストフレームワーク
 */

const TestRunner = require('./lib/TestRunner');
const TestSuite = require('./lib/TestSuite');
const TestCase = require('./lib/TestCase');
const Validator = require('./lib/Validator');
const Reporter = require('./lib/Reporter');
const ConfigLoader = require('./lib/ConfigLoader');

// フレームワークのバージョン
const VERSION = '1.0.0';

// デフォルト設定
const DEFAULT_CONFIG = {
    // テスト対象のディレクトリ
    extensionPath: process.cwd(),
    
    // 出力設定
    output: {
        format: ['console', 'json', 'html'],
        directory: './test-results',
        filename: 'test-report'
    },
    
    // バリデーション設定
    validation: {
        manifest: true,
        permissions: true,
        csp: true,
        icons: true,
        locales: true
    },
    
    // カスタムルール
    rules: [],
    
    // プラグイン
    plugins: [],
    
    // 並列実行
    parallel: false,
    
    // タイムアウト
    timeout: 30000
};

/**
 * メインのフレームワーククラス
 */
class ChromeExtensionTestFramework {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.configLoader = new ConfigLoader();
        this.testRunner = new TestRunner(this.config);
        this.reporter = new Reporter(this.config);
        this.suites = [];
    }

    /**
     * 設定ファイルから読み込み
     */
    async loadConfig(configPath) {
        const loadedConfig = await this.configLoader.load(configPath);
        this.config = { ...this.config, ...loadedConfig };
        this.testRunner.updateConfig(this.config);
        return this;
    }

    /**
     * テストスイートを追加
     */
    addSuite(suite) {
        if (suite instanceof TestSuite) {
            this.suites.push(suite);
        } else if (typeof suite === 'object') {
            // オブジェクトからTestSuiteを作成
            this.suites.push(new TestSuite(suite));
        }
        return this;
    }

    /**
     * ビルトインテストを追加
     */
    useBuiltinTests() {
        const builtinSuites = [
            require('./suites/ManifestTestSuite'),
            require('./suites/SecurityTestSuite'),
            require('./suites/PerformanceTestSuite'),
            require('./suites/StructureTestSuite'),
            require('./suites/LocalizationTestSuite')
        ];

        builtinSuites.forEach(Suite => {
            this.addSuite(new Suite(this.config));
        });

        return this;
    }

    /**
     * プラグインを使用
     */
    use(plugin) {
        if (typeof plugin === 'function') {
            plugin(this);
        } else if (plugin.install) {
            plugin.install(this);
        }
        return this;
    }

    /**
     * カスタムバリデーターを追加
     */
    addValidator(name, validator) {
        Validator.register(name, validator);
        return this;
    }

    /**
     * カスタムレポーターを追加
     */
    addReporter(name, reporter) {
        this.reporter.register(name, reporter);
        return this;
    }

    /**
     * テストを実行
     */
    async run() {
        console.log(`🚀 Chrome Extension Test Framework v${VERSION}`);
        console.log(`📁 Testing: ${this.config.extensionPath}\n`);

        const startTime = Date.now();
        const results = {
            framework: VERSION,
            timestamp: new Date().toISOString(),
            config: this.config,
            suites: []
        };

        try {
            // 各テストスイートを実行
            for (const suite of this.suites) {
                const suiteResult = await this.testRunner.runSuite(suite);
                results.suites.push(suiteResult);
            }

            // 結果を集計
            results.summary = this.calculateSummary(results.suites);
            results.duration = Date.now() - startTime;

            // レポートを生成
            await this.reporter.generate(results);

            // 結果を返す
            return results;

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        }
    }

    /**
     * 結果を集計
     */
    calculateSummary(suites) {
        const summary = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        suites.forEach(suite => {
            suite.tests.forEach(test => {
                summary.total++;
                if (test.status === 'passed') summary.passed++;
                else if (test.status === 'failed') summary.failed++;
                else if (test.status === 'skipped') summary.skipped++;
                
                if (test.error) {
                    summary.errors.push({
                        suite: suite.name,
                        test: test.name,
                        error: test.error
                    });
                }
            });
        });

        summary.successRate = summary.total > 0 
            ? Math.round((summary.passed / summary.total) * 100) 
            : 0;

        return summary;
    }

    /**
     * 静的メソッド: クイックテスト
     */
    static async test(extensionPath, options = {}) {
        const framework = new ChromeExtensionTestFramework({
            extensionPath,
            ...options
        });
        
        return framework
            .useBuiltinTests()
            .run();
    }
}

// エクスポート
module.exports = ChromeExtensionTestFramework;
module.exports.TestSuite = TestSuite;
module.exports.TestCase = TestCase;
module.exports.Validator = Validator;
module.exports.VERSION = VERSION;