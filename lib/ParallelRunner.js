/**
 * ParallelRunner - テストの並列実行を管理
 */

const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');
const EventEmitter = require('events');

class ParallelRunner extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // CPUコア数に基づいてワーカー数を決定
        this.maxWorkers = options.maxWorkers || Math.max(1, os.cpus().length - 1);
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
        this.results = new Map();
        this.startTime = null;
        
        // 統計情報
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            workerUtilization: new Map()
        };
    }

    /**
     * テストスイートを並列実行
     */
    async runSuites(suites, config) {
        this.startTime = Date.now();
        this.stats.totalTasks = suites.length;
        
        console.log(`\n🚀 Starting parallel execution with ${this.maxWorkers} workers`);
        console.log(`   Total test suites: ${suites.length}\n`);
        
        // タスクキューに追加
        suites.forEach((suite, index) => {
            this.taskQueue.push({
                id: index,
                suite: suite.constructor.name,
                config: config
            });
        });
        
        // ワーカープールを作成
        await this.createWorkerPool();
        
        // すべてのタスクが完了するまで待機
        await this.waitForCompletion();
        
        // 結果を集約
        return this.aggregateResults();
    }

    /**
     * ワーカープールを作成
     */
    async createWorkerPool() {
        const workerPath = path.join(__dirname, 'worker.js');
        
        for (let i = 0; i < this.maxWorkers; i++) {
            await this.createWorker(i, workerPath);
        }
    }

    /**
     * ワーカーを作成
     */
    async createWorker(workerId, workerPath) {
        const worker = new Worker(workerPath, {
            workerData: { workerId }
        });
        
        // ワーカーのイベントハンドラを設定
        worker.on('message', (message) => {
            this.handleWorkerMessage(workerId, message);
        });
        
        worker.on('error', (error) => {
            console.error(`❌ Worker ${workerId} error:`, error);
            this.handleWorkerError(workerId, error);
        });
        
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Worker ${workerId} exited with code ${code}`);
            }
            this.handleWorkerExit(workerId);
        });
        
        this.workers[workerId] = worker;
        this.stats.workerUtilization.set(workerId, 0);
        
        // 初期タスクを割り当て
        this.assignNextTask(workerId);
    }

    /**
     * ワーカーメッセージを処理
     */
    handleWorkerMessage(workerId, message) {
        switch (message.type) {
            case 'task-start':
                this.emit('suite-start', {
                    workerId,
                    suite: message.suite
                });
                break;
                
            case 'progress':
                this.emit('progress', {
                    workerId,
                    suite: message.suite,
                    test: message.test,
                    status: message.status
                });
                break;
                
            case 'task-complete':
                this.handleTaskComplete(workerId, message);
                break;
                
            case 'task-error':
                this.handleTaskError(workerId, message);
                break;
        }
    }

    /**
     * タスク完了を処理
     */
    handleTaskComplete(workerId, message) {
        const { taskId, result, duration } = message;
        
        // 結果を保存
        this.results.set(taskId, result);
        this.stats.completedTasks++;
        
        // ワーカーの使用率を更新
        const utilization = this.stats.workerUtilization.get(workerId) || 0;
        this.stats.workerUtilization.set(workerId, utilization + 1);
        
        console.log(`✅ Worker ${workerId} completed ${result.suite} (${duration}ms)`);
        
        this.emit('suite-complete', {
            workerId,
            suite: result.suite,
            duration,
            passed: result.summary.passed,
            failed: result.summary.failed
        });
        
        // 次のタスクを割り当て
        this.assignNextTask(workerId);
    }

    /**
     * タスクエラーを処理
     */
    handleTaskError(workerId, message) {
        const { taskId, error } = message;
        
        console.error(`❌ Worker ${workerId} task ${taskId} failed:`, error);
        
        this.stats.failedTasks++;
        this.results.set(taskId, {
            suite: 'Unknown',
            error: error,
            summary: { total: 0, passed: 0, failed: 0 }
        });
        
        // 次のタスクを割り当て
        this.assignNextTask(workerId);
    }

    /**
     * ワーカーエラーを処理
     */
    handleWorkerError(workerId, error) {
        // ワーカーを再起動
        console.log(`🔄 Restarting worker ${workerId}...`);
        this.workers[workerId] = null;
        
        setTimeout(() => {
            const workerPath = path.join(__dirname, 'worker.js');
            this.createWorker(workerId, workerPath);
        }, 1000);
    }

    /**
     * ワーカー終了を処理
     */
    handleWorkerExit(workerId) {
        this.activeWorkers--;
        this.workers[workerId] = null;
    }

    /**
     * 次のタスクを割り当て
     */
    assignNextTask(workerId) {
        if (this.taskQueue.length === 0) {
            this.activeWorkers--;
            return;
        }
        
        const task = this.taskQueue.shift();
        const worker = this.workers[workerId];
        
        if (worker) {
            this.activeWorkers++;
            worker.postMessage({
                type: 'run-task',
                task: task
            });
        }
    }

    /**
     * すべてのタスクの完了を待機
     */
    async waitForCompletion() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.stats.completedTasks + this.stats.failedTasks >= this.stats.totalTasks) {
                    clearInterval(checkInterval);
                    this.terminateWorkers();
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * ワーカーを終了
     */
    terminateWorkers() {
        this.workers.forEach((worker, workerId) => {
            if (worker) {
                worker.terminate();
                console.log(`🛑 Worker ${workerId} terminated`);
            }
        });
    }

    /**
     * 結果を集約
     */
    aggregateResults() {
        const duration = Date.now() - this.startTime;
        const results = Array.from(this.results.values());
        
        // サマリーを計算
        const summary = {
            total: 0,
            passed: 0,
            failed: 0
        };
        
        results.forEach(result => {
            if (result.summary) {
                summary.total += result.summary.total;
                summary.passed += result.summary.passed;
                summary.failed += result.summary.failed;
            }
        });
        
        // ワーカー使用率を計算
        const workerStats = [];
        this.stats.workerUtilization.forEach((tasks, workerId) => {
            workerStats.push({
                workerId,
                tasksCompleted: tasks,
                utilization: Math.round((tasks / this.stats.totalTasks) * 100)
            });
        });
        
        console.log('\n📊 Parallel Execution Summary:');
        console.log(`   Total duration: ${duration}ms`);
        console.log(`   Workers used: ${this.maxWorkers}`);
        console.log(`   Tasks completed: ${this.stats.completedTasks}`);
        console.log(`   Tasks failed: ${this.stats.failedTasks}`);
        
        console.log('\n   Worker utilization:');
        workerStats.forEach(stat => {
            console.log(`   - Worker ${stat.workerId}: ${stat.tasksCompleted} tasks (${stat.utilization}%)`);
        });
        
        return {
            suites: results,
            summary,
            execution: {
                duration,
                parallel: true,
                workers: this.maxWorkers,
                workerStats
            }
        };
    }

    /**
     * 並列実行が有効かチェック
     */
    static isSupported() {
        try {
            require('worker_threads');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 最適なワーカー数を計算
     */
    static getOptimalWorkerCount(suiteCount) {
        const cpuCount = os.cpus().length;
        const optimal = Math.min(
            Math.max(1, cpuCount - 1), // CPUコア数 - 1
            suiteCount // スイート数を超えない
        );
        return optimal;
    }
}

module.exports = ParallelRunner;