/**
 * TestRunner - テストの実行を管理
 */

const fs = require('fs');
const path = require('path');
const ProgressReporter = require('./ProgressReporter');
const ErrorHandler = require('./ErrorHandler');
const WarningCollector = require('./WarningCollector');
const EssentialTests = require('./EssentialTests');
const PerformanceMonitor = require('./PerformanceMonitor');

class TestRunner {
    constructor(config) {
        this.config = config;
        this.results = [];
        this.currentSuite = null;
        this.progressReporter = new ProgressReporter({
            showProgress: config.progress !== false && !config.quiet,
            verbose: config.verbose || false,
            quiet: config.quiet || false
        });
        this.errorHandler = new ErrorHandler();
        this.warningCollector = new WarningCollector();
        this.performanceMonitor = new PerformanceMonitor();
    }

    updateConfig(config) {
        this.config = { ...this.config, ...config };
        // ProgressReporterの設定も更新
        this.progressReporter.showProgress = this.config.progress !== false && !this.config.quiet;
        this.progressReporter.verbose = this.config.verbose || false;
    }

    /**
     * テストスイートを実行
     */
    async runSuite(suite) {
        this.currentSuite = suite;
        const suiteResult = {
            name: suite.name,
            description: suite.description,
            startTime: Date.now(),
            tests: [],
            warnings: []
        };
        
        // パフォーマンス測定開始
        this.performanceMonitor.start(`suite-${suite.name}`);
        
        // 警告の収集を開始
        this.warningCollector.clear();
        this.warningCollector.startCapture();
        
        // quietモードの設定（開始時に設定）
        const wasQuietMode = global.__QUIET_MODE__;
        if (this.config.quiet) {
            global.__QUIET_MODE__ = true;
        }

        // プログレスレポーターでスイート開始を通知
        this.progressReporter.startSuite(suite, suite.tests.length);

        // beforeAllフックを実行
        if (suite.beforeAll) {
            try {
                await suite.beforeAll(this.config);
            } catch (error) {
                const enhanced = await this.errorHandler.handleError(error, {
                    suite: suite.name,
                    phase: 'beforeAll'
                });
                console.error(this.errorHandler.formatError(enhanced));
            }
        }

        // 各テストケースを実行
        for (const testCase of suite.tests) {
            const testResult = await this.runTest(testCase, suite);
            suiteResult.tests.push(testResult);
        }

        // afterAllフックを実行
        if (suite.afterAll) {
            try {
                await suite.afterAll(this.config);
            } catch (error) {
                const enhanced = await this.errorHandler.handleError(error, {
                    suite: suite.name,
                    phase: 'afterAll'
                });
                console.error(this.errorHandler.formatError(enhanced));
            }
        }

        suiteResult.endTime = Date.now();
        suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
        
        // 警告の収集を停止して結果に追加
        this.warningCollector.stopCapture();
        suiteResult.warnings = this.warningCollector.getWarnings();
        
        // quietモードを元に戻す
        global.__QUIET_MODE__ = wasQuietMode;

        // スイート完了を通知
        this.progressReporter.completeSuite(suite.name);
        
        // パフォーマンス測定終了
        this.performanceMonitor.end(`suite-${suite.name}`, {
            testCount: suite.tests.length,
            duration: suiteResult.duration
        });

        return suiteResult;
    }

    /**
     * 個別のテストを実行
     */
    async runTest(testCase, suite) {
        const testResult = {
            name: testCase.name,
            description: testCase.description,
            status: 'pending',
            error: null,
            startTime: Date.now()
        };
        
        // パフォーマンス測定開始
        this.performanceMonitor.start(`test-${testCase.name}`);

        // スキップ判定
        if (testCase.skip || (testCase.condition && !testCase.condition(this.config))) {
            testResult.status = 'skipped';
            this.progressReporter.completeTest(testCase.name, 'skipped');
            return testResult;
        }
        
        // プロファイルによるスキップ判定
        if (this.config.skipTests && this.config.skipTests.includes(testCase.name)) {
            testResult.status = 'skipped';
            testResult.skipReason = 'Skipped by profile';
            this.progressReporter.completeTest(testCase.name, 'skipped', 'Profile skip');
            return testResult;
        }
        
        // クイックモードによるスキップ判定
        if (this.config.quickMode || this.config.profile === 'quick') {
            const isEssential = EssentialTests.isEssential(this.currentSuite?.name, testCase.name);
            if (!isEssential) {
                testResult.status = 'skipped';
                testResult.skipReason = 'Skipped in quick mode';
                this.progressReporter.completeTest(testCase.name, 'skipped');
                return testResult;
            }
        }

        // テスト開始を通知
        this.progressReporter.startTest(testCase.name);

        try {
            // beforeEachフックを実行
            if (suite.beforeEach) {
                await suite.beforeEach(this.config);
            }

            // タイムアウト設定
            const timeout = testCase.timeout || this.config.timeout || 30000;
            const testPromise = testCase.test(this.config);
            
            // タイムアウトレースを実装
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
            });

            // テスト実行
            await Promise.race([testPromise, timeoutPromise]);

            testResult.status = 'passed';
            this.progressReporter.completeTest(testCase.name, 'passed');

            // afterEachフックを実行
            if (suite.afterEach) {
                await suite.afterEach(this.config);
            }

        } catch (error) {
            const enhanced = await this.errorHandler.handleError(error, {
                suite: this.currentSuite?.name,
                test: testCase.name,
                phase: 'test',
                file: testCase.file
            });
            
            testResult.status = 'failed';
            testResult.error = {
                message: error.message,
                stack: error.stack,
                enhanced: enhanced
            };
            
            // 詳細エラーをプログレスレポーターに渡す
            this.progressReporter.completeTest(testCase.name, 'failed', enhanced);
        }

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;
        
        // パフォーマンス測定終了
        this.performanceMonitor.end(`test-${testCase.name}`, {
            status: testResult.status,
            duration: testResult.duration
        });

        return testResult;
    }

    /**
     * 拡張機能のファイルを読み込み
     */
    async loadExtensionFile(filePath) {
        const fullPath = path.join(this.config.extensionPath, filePath);
        
        if (!fs.existsSync(fullPath)) {
            const error = new Error(`File not found: ${filePath}`);
            error.code = 'ENOENT';
            error.path = fullPath;
            throw error;
        }

        return fs.readFileSync(fullPath, 'utf8');
    }

    /**
     * 拡張機能のJSONファイルを読み込み
     */
    async loadExtensionJSON(filePath) {
        const content = await this.loadExtensionFile(filePath);
        try {
            return JSON.parse(content);
        } catch (error) {
            error.file = filePath;
            error.content = content;
            throw error;
        }
    }

    /**
     * ファイルの存在確認
     */
    async fileExists(filePath) {
        const fullPath = path.join(this.config.extensionPath, filePath);
        return fs.existsSync(fullPath);
    }

    /**
     * ディレクトリの内容を取得
     */
    async readDirectory(dirPath) {
        const fullPath = path.join(this.config.extensionPath, dirPath);
        
        if (!fs.existsSync(fullPath)) {
            return [];
        }

        return fs.readdirSync(fullPath);
    }
    
    /**
     * パフォーマンスモニターを取得
     */
    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
}

module.exports = TestRunner;