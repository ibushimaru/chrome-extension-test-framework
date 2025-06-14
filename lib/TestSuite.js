/**
 * TestSuite - 関連するテストケースをグループ化
 */

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
}

module.exports = TestSuite;