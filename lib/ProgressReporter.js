/**
 * ProgressReporter - テスト実行中のプログレス表示
 */

class ProgressReporter {
    constructor(options = {}) {
        this.totalTests = 0;
        this.completedTests = 0;
        this.currentSuite = null;
        this.showProgress = options.showProgress !== false;
        this.verbose = options.verbose || false;
        this.startTime = null;
        this.suiteProgress = new Map();
    }

    /**
     * テストスイートの開始
     */
    startSuite(suite, testCount) {
        this.currentSuite = suite.name;
        this.suiteProgress.set(suite.name, {
            total: testCount,
            completed: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        });

        if (this.showProgress) {
            console.log(`\n📋 ${suite.name}`);
            if (suite.description) {
                console.log(`   ${suite.description}`);
            }
            if (this.verbose) {
                console.log(`   📊 Tests: 0/${testCount}`);
            }
        }
    }

    /**
     * テストの開始
     */
    startTest(testName) {
        if (this.showProgress && this.verbose) {
            process.stdout.write(`   ⏳ ${testName}... `);
        }
    }

    /**
     * テストの完了
     */
    completeTest(testName, status, error = null) {
        this.completedTests++;
        
        const suiteProgress = this.suiteProgress.get(this.currentSuite);
        if (suiteProgress) {
            suiteProgress.completed++;
            suiteProgress[status]++;
        }

        if (this.showProgress) {
            if (this.verbose) {
                // 行をクリアして結果を表示
                if (process.stdout.clearLine && process.stdout.cursorTo) {
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                }
            }

            const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
            console.log(`   ${icon} ${testName}`);
            
            if (status === 'failed' && error) {
                console.log(`      ${error.message}`);
            }

            // プログレスバーを表示（詳細モードの場合）
            if (this.verbose && suiteProgress) {
                this.showProgressBar(suiteProgress);
            }
        }
    }

    /**
     * スイートの完了
     */
    completeSuite(suiteName) {
        const suiteProgress = this.suiteProgress.get(suiteName);
        if (this.showProgress && suiteProgress) {
            const percentage = Math.round((suiteProgress.passed / suiteProgress.total) * 100);
            console.log(`   ✨ Suite completed: ${suiteProgress.passed}/${suiteProgress.total} passed (${percentage}%)`);
        }
    }

    /**
     * プログレスバーを表示
     */
    showProgressBar(progress) {
        const percentage = Math.round((progress.completed / progress.total) * 100);
        const barLength = 30;
        const filled = Math.round((barLength * progress.completed) / progress.total);
        const empty = barLength - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const stats = `${progress.completed}/${progress.total} (${percentage}%)`;
        
        console.log(`   [${bar}] ${stats}`);
    }

    /**
     * 全体の開始
     */
    start(totalSuites, totalTests) {
        this.totalTests = totalTests;
        this.startTime = Date.now();
        
        if (this.showProgress) {
            const packageInfo = require('../package.json');
            console.log(`\n🚀 Chrome Extension Test Framework v${packageInfo.version}`);
            console.log(`📁 Testing: ${process.cwd()}`);
            if (this.verbose) {
                console.log(`📊 Total: ${totalSuites} suites, ${totalTests} tests`);
            }
        }
    }

    /**
     * 全体の完了
     */
    complete(summary) {
        if (this.showProgress) {
            const duration = Date.now() - this.startTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = ((duration % 60000) / 1000).toFixed(1);
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
            console.log(`\n⏱️  Total time: ${timeStr}`);
            
            // 簡易サマリー表示
            if (!this.verbose) {
                const passRate = Math.round((summary.passed / summary.total) * 100);
                console.log(`📈 Results: ${summary.passed}/${summary.total} passed (${passRate}%)`);
            }
        }
    }

    /**
     * リアルタイム更新（CI/CD環境用）
     */
    updateProgress(message) {
        if (this.showProgress && process.env.CI) {
            console.log(`::group::${message}`);
        }
    }
}

module.exports = ProgressReporter;