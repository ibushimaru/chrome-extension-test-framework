/**
 * TestSuite - 関連するテストケースをグループ化
 */

const fs = require('fs');
const path = require('path');
const PerformanceMonitor = require('./PerformanceMonitor');

class TestSuite {
    constructor(options = {}) {
        this.name = options.name || 'Unnamed Suite';
        this.description = options.description || '';
        this.tests = [];
        this.beforeAll = options.beforeAll;
        this.afterAll = options.afterAll;
        this.beforeEach = options.beforeEach;
        this.afterEach = options.afterEach;
        this.enabled = options.enabled !== false;
        this.config = options.config || {};
    }

    /**
     * テストケースを追加
     */
    addTest(testCase) {
        if (typeof testCase === 'function') {
            // 関数から簡易的にテストケースを作成
            this.tests.push({
                name: testCase.name || 'Anonymous Test',
                test: testCase
            });
        } else {
            // TestCaseオブジェクトまたはプレーンオブジェクト
            this.tests.push(testCase);
        }
        return this;
    }

    /**
     * 複数のテストケースを一度に追加
     */
    addTests(testCases) {
        testCases.forEach(testCase => this.addTest(testCase));
        return this;
    }

    /**
     * テストケースを定義（fluent API）
     */
    test(name, testFn, options = {}) {
        this.addTest({
            name,
            test: testFn,
            ...options
        });
        return this;
    }

    /**
     * スキップするテスト
     */
    skip(name, testFn, options = {}) {
        this.addTest({
            name,
            test: testFn,
            skip: true,
            ...options
        });
        return this;
    }

    /**
     * 条件付きテスト
     */
    testIf(condition, name, testFn, options = {}) {
        this.addTest({
            name,
            test: testFn,
            condition,
            ...options
        });
        return this;
    }

    /**
     * beforeAllフックを設定
     */
    before(fn) {
        this.beforeAll = fn;
        return this;
    }

    /**
     * afterAllフックを設定
     */
    after(fn) {
        this.afterAll = fn;
        return this;
    }

    /**
     * beforeEachフックを設定
     */
    beforeEachTest(fn) {
        this.beforeEach = fn;
        return this;
    }

    /**
     * afterEachフックを設定
     */
    afterEachTest(fn) {
        this.afterEach = fn;
        return this;
    }

    /**
     * スイートを有効/無効化
     */
    enable() {
        this.enabled = true;
        return this;
    }

    disable() {
        this.enabled = false;
        return this;
    }

    /**
     * テストケースの数を取得
     */
    get testCount() {
        return this.tests.length;
    }

    /**
     * スイートが空かどうか
     */
    get isEmpty() {
        return this.tests.length === 0;
    }

    // =========== ヘルパーメソッド ===========

    /**
     * 拡張機能のファイルを読み込み
     */
    async loadFile(filePath) {
        const fullPath = path.join(this.config.extensionPath, filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        return fs.readFileSync(fullPath, 'utf8');
    }

    /**
     * 拡張機能のJSONファイルを読み込み
     */
    async loadJSON(filePath) {
        const content = await this.loadFile(filePath);
        return JSON.parse(content);
    }

    /**
     * manifest.jsonを読み込み
     */
    async loadManifest(config) {
        const configToUse = config || this.config;
        const manifestPath = path.join(configToUse.extensionPath, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            throw new Error('manifest.json not found');
        }

        const content = fs.readFileSync(manifestPath, 'utf8');
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

    /**
     * ファイルサイズを取得（バイト）
     */
    async getFileSize(filePath) {
        const fullPath = path.join(this.config.extensionPath, filePath);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = fs.statSync(fullPath);
        return stats.size;
    }

    /**
     * ファイル内容を検索
     */
    async searchInFile(filePath, pattern) {
        const content = await this.loadFile(filePath);
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g');
        return content.match(regex) || [];
    }

    /**
     * 全ファイルを再帰的に取得
     */
    async getAllFiles(dirPath = '', fileList = [], options = {}) {
        // パフォーマンスモニターを初期化（最初の呼び出し時のみ）
        if (!this._perfMonitor) {
            this._perfMonitor = new PerformanceMonitor();
            this._fileScanStats = {
                totalFiles: 0,
                scannedFiles: 0,
                excludedFiles: 0,
                excludedByNodeModules: 0
            };
            this._perfMonitor.start('file-scanning');
        }
        
        // パフォーマンス最適化: node_modules を早期除外
        if (dirPath.includes('node_modules') || dirPath.includes('.git')) {
            this._fileScanStats.excludedByNodeModules++;
            return fileList;
        }
        
        const fullPath = path.join(this.config.extensionPath, dirPath);
        
        if (!fs.existsSync(fullPath)) {
            return fileList;
        }
        
        // フレームワーク自身のディレクトリを除外
        const frameworkPath = path.resolve(__dirname, '..');
        // Only exclude if it's exactly the framework path or its core directories
        if (fullPath === frameworkPath || 
            fullPath === path.join(frameworkPath, 'lib') ||
            fullPath === path.join(frameworkPath, 'suites') ||
            fullPath === path.join(frameworkPath, 'bin')) {
            return fileList;
        }

        const files = fs.readdirSync(fullPath);
        
        for (const file of files) {
            // パフォーマンス最適化: node_modules と .git を早期スキップ
            if (file === 'node_modules' || file === '.git') {
                this._fileScanStats.excludedByNodeModules++;
                continue;
            }
            
            const filePath = path.join(dirPath, file);
            const fullFilePath = path.join(this.config.extensionPath, filePath);
            
            // ファイルが存在しない場合はスキップ（シンボリックリンクなど）
            if (!fs.existsSync(fullFilePath)) {
                continue;
            }
            
            const stat = fs.statSync(fullFilePath);
            this._fileScanStats.totalFiles++;
            
            // ExcludeManagerがある場合は除外チェック（オプションでスキップ可能）
            if (!options.skipExclude && this.config.excludeManager) {
                // ExcludeManagerには相対パスを渡す
                if (stat.isDirectory() && this.config.excludeManager.shouldExcludeDirectory(filePath)) {
                    this._fileScanStats.excludedFiles++;
                    continue;
                }
                if (!stat.isDirectory() && this.config.excludeManager.shouldExclude(filePath)) {
                    this._fileScanStats.excludedFiles++;
                    continue;
                }
            }
            
            if (stat.isDirectory()) {
                await this.getAllFiles(filePath, fileList, options);
            } else {
                this._fileScanStats.scannedFiles++;
                fileList.push(filePath);
            }
        }
        
        // ルートディレクトリに戻ってきたら（最初の呼び出しが完了したら）統計を記録
        if (dirPath === '') {
            this._perfMonitor.end('file-scanning');
            this._perfMonitor.recordFileScan(this._fileScanStats);
            
            // 次回の呼び出しのためにリセット
            this._perfMonitor = null;
            this._fileScanStats = null;
        }
        
        return fileList;
    }
    
    /**
     * 簡易的なglobマッチング
     */
    simpleGlobMatch(pattern, str) {
        // 基本的なglobパターンを正規表現に変換
        let regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]');
        
        // 完全一致で検証
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(str);
    }
}

module.exports = TestSuite;