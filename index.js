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
const ParallelRunner = require('./lib/ParallelRunner');
const ExcludeManager = require('./lib/ExcludeManager');
const WarningManager = require('./lib/WarningManager');
const ProfileManager = require('./lib/ProfileManager');
const IncrementalTester = require('./lib/IncrementalTester');

// フレームワークのバージョン
const VERSION = '1.6.0';

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
        
        // 新しいマネージャーを初期化
        this.excludeManager = new ExcludeManager(this.config);
        this.warningManager = new WarningManager(this.config);
        this.profileManager = new ProfileManager(this.config);
        this.incrementalTester = new IncrementalTester({
            extensionPath: this.config.extensionPath,
            excludeManager: this.excludeManager
        });
        
        // プロファイルが指定されている場合は適用
        if (this.config.profile) {
            this.applyProfile(this.config.profile);
        }
    }

    /**
     * 設定ファイルから読み込み
     */
    async loadConfig(configPath) {
        const loadedConfig = await this.configLoader.load(configPath);
        this.config = { ...this.config, ...loadedConfig };
        this.testRunner.updateConfig(this.config);
        
        // マネージャーを更新
        this.excludeManager = new ExcludeManager(this.config);
        this.warningManager.updateConfig(this.config);
        
        return this;
    }
    
    /**
     * プロファイルを適用
     */
    applyProfile(profileName) {
        this.config = this.profileManager.applyProfile(profileName, this.config);
        
        // マネージャーを更新
        this.excludeManager = new ExcludeManager(this.config);
        this.warningManager.updateConfig(this.config);
        this.testRunner.updateConfig(this.config);
        
        console.log(`📋 Using profile: ${profileName}`);
        const profile = this.profileManager.getProfile(profileName);
        if (profile.description) {
            console.log(`   ${profile.description}`);
        }
        
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
        const startTime = Date.now();
        
        // 並列実行の判定
        if (this.config.parallel && this.suites.length > 1) {
            return this.runParallel(startTime);
        } else {
            return this.runSequential(startTime);
        }
    }

    /**
     * 順次実行
     */
    async runSequential(startTime) {
        // プログレス表示の開始
        const totalTests = this.suites.reduce((sum, suite) => sum + suite.tests.length, 0);
        this.testRunner.progressReporter.start(this.suites.length, totalTests);
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

            // プログレス表示の完了
            this.testRunner.progressReporter.complete(results.summary);

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
     * 並列実行
     */
    async runParallel(startTime) {
        console.log('\n🚀 Running tests in parallel mode...\n');
        
        // 並列実行がサポートされているかチェック
        if (!ParallelRunner.isSupported()) {
            console.warn('⚠️  Parallel execution not supported, falling back to sequential mode');
            return this.runSequential(startTime);
        }

        const parallelRunner = new ParallelRunner({
            maxWorkers: ParallelRunner.getOptimalWorkerCount(this.suites.length)
        });

        // プログレスレポートのイベントリスナー
        parallelRunner.on('suite-start', (info) => {
            console.log(`🔄 Worker ${info.workerId}: Starting ${info.suite}`);
        });

        parallelRunner.on('progress', (info) => {
            if (info.status === 'passed') {
                console.log(`   ✅ ${info.test}`);
            } else if (info.status === 'failed') {
                console.log(`   ❌ ${info.test}`);
            }
        });

        parallelRunner.on('suite-complete', (info) => {
            console.log(`✅ Worker ${info.workerId}: Completed ${info.suite} (${info.passed} passed, ${info.failed} failed)`);
        });

        try {
            // 並列実行
            const parallelResults = await parallelRunner.runSuites(this.suites, this.config);
            
            // 結果を整形
            const results = {
                framework: VERSION,
                timestamp: new Date().toISOString(),
                config: this.config,
                suites: parallelResults.suites,
                summary: parallelResults.summary,
                duration: parallelResults.execution.duration,
                execution: parallelResults.execution
            };

            // レポートを生成
            await this.reporter.generate(results);

            return results;

        } catch (error) {
            console.error('❌ Parallel test execution failed:', error);
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