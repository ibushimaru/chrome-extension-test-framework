/**
 * TestCase - 個別のテストケース
 */

class TestCase {
    constructor(options) {
        // 必須プロパティ
        this.name = options.name;
        this.test = options.test;

        // オプションプロパティ
        this.description = options.description || '';
        this.skip = options.skip || false;
        this.timeout = options.timeout;
        this.condition = options.condition;
        this.tags = options.tags || [];
        this.severity = options.severity || 'normal'; // critical, high, normal, low
        this.metadata = options.metadata || {};
    }

    /**
     * テストケースを実行
     */
    async run(config) {
        if (typeof this.test !== 'function') {
            throw new Error(`Test "${this.name}" must be a function`);
        }

        return await this.test(config);
    }

    /**
     * テストケースをスキップすべきか判定
     */
    shouldSkip(config) {
        if (this.skip) return true;
        if (this.condition && typeof this.condition === 'function') {
            return !this.condition(config);
        }
        return false;
    }

    /**
     * タグでフィルタリング
     */
    hasTag(tag) {
        return this.tags.includes(tag);
    }

    /**
     * 静的メソッド: 簡易的なテストケース作成
     */
    static create(name, test, options = {}) {
        return new TestCase({
            name,
            test,
            ...options
        });
    }

    /**
     * 静的メソッド: アサーション付きテストケース作成
     */
    static assertion(name, assertion, options = {}) {
        return new TestCase({
            name,
            test: async (config) => {
                const result = await assertion(config);
                if (!result) {
                    throw new Error(`Assertion failed: ${name}`);
                }
            },
            ...options
        });
    }

    /**
     * 静的メソッド: 期待値比較テストケース作成
     */
    static expect(name, getter, expected, options = {}) {
        return new TestCase({
            name,
            test: async (config) => {
                const actual = await getter(config);
                if (actual !== expected) {
                    throw new Error(
                        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
                    );
                }
            },
            ...options
        });
    }

    /**
     * 静的メソッド: パターンマッチングテストケース作成
     */
    static match(name, getter, pattern, options = {}) {
        return new TestCase({
            name,
            test: async (config) => {
                const value = await getter(config);
                const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
                if (!regex.test(value)) {
                    throw new Error(
                        `Value "${value}" does not match pattern ${regex}`
                    );
                }
            },
            ...options
        });
    }

    /**
     * 静的メソッド: 存在確認テストケース作成
     */
    static exists(name, checker, options = {}) {
        return new TestCase({
            name,
            test: async (config) => {
                const exists = await checker(config);
                if (!exists) {
                    throw new Error(`${name} does not exist`);
                }
            },
            ...options
        });
    }

    /**
     * 静的メソッド: 範囲チェックテストケース作成
     */
    static range(name, getter, min, max, options = {}) {
        return new TestCase({
            name,
            test: async (config) => {
                const value = await getter(config);
                if (value < min || value > max) {
                    throw new Error(
                        `Value ${value} is out of range [${min}, ${max}]`
                    );
                }
            },
            ...options
        });
    }
}

module.exports = TestCase;