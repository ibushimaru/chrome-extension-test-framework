/**
 * TestSuite - 関連するテストケースをグループ化
 */

const fs = require('fs');
const path = require('path');

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
        const fullPath = path.join(this.config.extensionPath, dirPath);
        
        if (!fs.existsSync(fullPath)) {
            return fileList;
        }

        const files = fs.readdirSync(fullPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const fullFilePath = path.join(this.config.extensionPath, filePath);
            const stat = fs.statSync(fullFilePath);
            
            // ExcludeManagerがある場合は除外チェック（オプションでスキップ可能）
            if (!options.skipExclude && this.config.excludeManager) {
                if (stat.isDirectory() && this.config.excludeManager.shouldExcludeDirectory(fullFilePath)) {
                    continue;
                }
                if (!stat.isDirectory() && this.config.excludeManager.shouldExclude(fullFilePath)) {
                    continue;
                }
            }
            
            if (stat.isDirectory()) {
                await this.getAllFiles(filePath, fileList, options);
            } else {
                fileList.push(filePath);
            }
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