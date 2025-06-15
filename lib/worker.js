/**
 * Worker - テストスイートを実行するワーカープロセス
 */

const { parentPort, workerData } = require('worker_threads');
const path = require('path');

// ワーカーID
const workerId = workerData.workerId;

// メッセージハンドラ
parentPort.on('message', async (message) => {
    if (message.type === 'run-task') {
        await runTask(message.task);
    }
});

/**
 * タスクを実行
 */
async function runTask(task) {
    const { id: taskId, suite: suiteName, config } = task;
    const startTime = Date.now();
    
    try {
        // タスク開始を通知
        parentPort.postMessage({
            type: 'task-start',
            workerId,
            taskId,
            suite: suiteName
        });
        
        // テストスイートを動的にロード
        const Suite = loadSuite(suiteName);
        const suite = new Suite(config);
        
        // プログレスレポーターの代替実装
        const progressHandler = createProgressHandler(suiteName);
        
        // テストを実行
        const results = await executeTests(suite, progressHandler);
        
        // 実行時間を計算
        const duration = Date.now() - startTime;
        
        // 結果を返送
        parentPort.postMessage({
            type: 'task-complete',
            workerId,
            taskId,
            result: {
                suite: suiteName,
                tests: results.tests,
                summary: results.summary
            },
            duration
        });
        
    } catch (error) {
        // エラーを返送
        parentPort.postMessage({
            type: 'task-error',
            workerId,
            taskId,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
    }
}

/**
 * テストスイートをロード
 */
function loadSuite(suiteName) {
    const suiteMap = {
        'ManifestTestSuite': '../suites/ManifestTestSuite',
        'SecurityTestSuite': '../suites/SecurityTestSuite',
        'PerformanceTestSuite': '../suites/PerformanceTestSuite',
        'StructureTestSuite': '../suites/StructureTestSuite',
        'LocalizationTestSuite': '../suites/LocalizationTestSuite'
    };
    
    const suitePath = suiteMap[suiteName];
    if (!suitePath) {
        throw new Error(`Unknown test suite: ${suiteName}`);
    }
    
    return require(suitePath);
}

/**
 * プログレスハンドラを作成
 */
function createProgressHandler(suiteName) {
    return {
        onTestComplete: (testName, status, error) => {
            parentPort.postMessage({
                type: 'progress',
                workerId,
                suite: suiteName,
                test: testName,
                status: status,
                error: error ? {
                    message: error.message,
                    code: error.code
                } : null
            });
        },
        onSuiteStart: () => {
            // スイート開始時の処理
        },
        onSuiteComplete: () => {
            // スイート完了時の処理
        }
    };
}

/**
 * テストを実行
 */
async function executeTests(suite, progressHandler) {
    const results = {
        tests: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        }
    };
    
    // beforeAllフックを実行
    if (suite.beforeAll) {
        await suite.beforeAll();
    }
    
    // テストランナーのrun()メソッドがある場合は使用
    if (suite.run && typeof suite.run === 'function') {
        try {
            const suiteResults = await suite.run();
            return {
                tests: suiteResults.tests || [],
                summary: {
                    total: suiteResults.tests ? suiteResults.tests.length : 0,
                    passed: suiteResults.tests ? suiteResults.tests.filter(t => t.status === 'passed').length : 0,
                    failed: suiteResults.tests ? suiteResults.tests.filter(t => t.status === 'failed').length : 0,
                    skipped: suiteResults.tests ? suiteResults.tests.filter(t => t.status === 'skipped').length : 0
                }
            };
        } catch (error) {
            console.error('Suite run failed:', error);
        }
    }
    
    // すべてのテストメソッドを取得
    const testMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(suite))
        .filter(method => method.startsWith('test'));
    
    results.summary.total = testMethods.length;
    
    // 各テストを実行
    for (const testMethod of testMethods) {
        const testResult = await runSingleTest(suite, testMethod, progressHandler);
        results.tests.push(testResult);
        
        // サマリーを更新
        if (testResult.status === 'passed') {
            results.summary.passed++;
        } else if (testResult.status === 'failed') {
            results.summary.failed++;
        } else if (testResult.status === 'skipped') {
            results.summary.skipped++;
        }
    }
    
    // afterAllフックを実行
    if (suite.afterAll) {
        await suite.afterAll();
    }
    
    return results;
}

/**
 * 単一のテストを実行
 */
async function runSingleTest(suite, testMethod, progressHandler) {
    const startTime = Date.now();
    const testName = formatTestName(testMethod);
    
    try {
        // beforeEach フックを実行
        if (suite.beforeEach) {
            await suite.beforeEach();
        }
        
        // テストを実行
        await suite[testMethod]();
        
        // afterEach フックを実行
        if (suite.afterEach) {
            await suite.afterEach();
        }
        
        const duration = Date.now() - startTime;
        
        // 成功を通知
        progressHandler.onTestComplete(testName, 'passed', null);
        
        return {
            name: testName,
            status: 'passed',
            duration: duration
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        // 失敗を通知
        progressHandler.onTestComplete(testName, 'failed', error);
        
        return {
            name: testName,
            status: 'failed',
            duration: duration,
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code || 'TEST_FAILED'
            }
        };
    }
}

/**
 * テスト名をフォーマット
 */
function formatTestName(methodName) {
    // testSomething -> Something
    // testSomeComplexName -> Some Complex Name
    return methodName
        .replace(/^test/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
}

// ワーカー開始を通知
console.log(`Worker ${workerId} started`);

// エラーハンドリング
process.on('uncaughtException', (error) => {
    console.error(`Worker ${workerId} uncaught exception:`, error);
    parentPort.postMessage({
        type: 'worker-error',
        workerId,
        error: {
            message: error.message,
            stack: error.stack
        }
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`Worker ${workerId} unhandled rejection:`, reason);
    parentPort.postMessage({
        type: 'worker-error',
        workerId,
        error: {
            message: reason?.message || String(reason),
            stack: reason?.stack
        }
    });
});