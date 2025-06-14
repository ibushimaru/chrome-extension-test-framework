/**
 * TestRunner - テストの実行を管理
 */

const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor(config) {
        this.config = config;
        this.results = [];
        this.currentSuite = null;
    }

    updateConfig(config) {
        this.config = { ...this.config, ...config };
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
            tests: []
        };

        console.log(`\n📋 ${suite.name}`);
        if (suite.description) {
            console.log(`   ${suite.description}`);
        }

        // beforeAllフックを実行
        if (suite.beforeAll) {
            try {
                await suite.beforeAll(this.config);
            } catch (error) {
                console.error(`   ❌ beforeAll failed: ${error.message}`);
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
                console.error(`   ❌ afterAll failed: ${error.message}`);
            }
        }

        suiteResult.endTime = Date.now();
        suiteResult.duration = suiteResult.endTime - suiteResult.startTime;

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

        // スキップ判定
        if (testCase.skip || (testCase.condition && !testCase.condition(this.config))) {
            testResult.status = 'skipped';
            console.log(`   ⏭️  ${testCase.name} (skipped)`);
            return testResult;
        }

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
            console.log(`   ✅ ${testCase.name}`);

            // afterEachフックを実行
            if (suite.afterEach) {
                await suite.afterEach(this.config);
            }

        } catch (error) {
            testResult.status = 'failed';
            testResult.error = {
                message: error.message,
                stack: error.stack
            };
            console.log(`   ❌ ${testCase.name}`);
            console.log(`      ${error.message}`);
        }

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;

        return testResult;
    }

    /**
     * 拡張機能のファイルを読み込み
     */
    async loadExtensionFile(filePath) {
        const fullPath = path.join(this.config.extensionPath, filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        return fs.readFileSync(fullPath, 'utf8');
    }

    /**
     * 拡張機能のJSONファイルを読み込み
     */
    async loadExtensionJSON(filePath) {
        const content = await this.loadExtensionFile(filePath);
        return JSON.parse(content);
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
}

module.exports = TestRunner;