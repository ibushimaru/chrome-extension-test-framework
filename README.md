# Chrome Extension Test Framework

[![npm version](https://badge.fury.io/js/chrome-extension-test-framework.svg)](https://www.npmjs.com/package/chrome-extension-test-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/ibushimaru/chrome-extension-test-framework)](https://github.com/ibushimaru/chrome-extension-test-framework/issues)
[![GitHub stars](https://img.shields.io/github/stars/ibushimaru/chrome-extension-test-framework)](https://github.com/ibushimaru/chrome-extension-test-framework/stargazers)

汎用的なChrome拡張機能テストフレームワーク - ブラウザ不要で高速な静的解析を実行

## 特徴

- 🚀 **高速実行** - ブラウザ不要で100ms以下での実行
- 🔍 **包括的な検証** - Manifest、セキュリティ、パフォーマンス、構造、多言語対応
- 📊 **複数の出力形式** - コンソール、JSON、HTML、Markdown
- 🛠️ **拡張可能** - カスタムテストスイートとバリデーターの追加が可能
- 🌍 **汎用性** - あらゆるChrome拡張機能に対応
- 🔧 **CI/CD対応** - 終了コードによる自動化サポート

## インストール

### npmからインストール（推奨）
```bash
# ローカルインストール
npm install chrome-extension-test-framework

# グローバルインストール
npm install -g chrome-extension-test-framework

# 開発依存としてインストール
npm install --save-dev chrome-extension-test-framework
```

### GitHubからインストール
```bash
# 最新版をインストール
npm install git+https://github.com/ibushimaru/chrome-extension-test-framework.git

# 特定のバージョンをインストール
npm install git+https://github.com/ibushimaru/chrome-extension-test-framework.git#v1.0.1
```

## クイックスタート

### サンプル拡張機能でテスト

このフレームワークには、動作を確認できるサンプル拡張機能が含まれています：

```bash
# 良い例（すべてのテストに合格）
cext-test samples/good-extension

# 悪い例（多くの問題を検出）
cext-test samples/bad-extension

# 最小限の例
cext-test samples/minimal-extension

# すべてのサンプルをテスト
node samples/test-all.js
```

詳細は[samples/README.md](samples/README.md)を参照してください。

## 使い方

### CLIとして使用

```bash
# 現在のディレクトリをテスト
cext-test

# 特定の拡張機能をテスト
cext-test /path/to/extension

# 特定のテストスイートのみ実行
cext-test -s manifest,security

# カスタム出力形式
cext-test -o json,html -d ./reports
```

### プログラムとして使用

```javascript
const ChromeExtensionTestFramework = require('chrome-extension-test-framework');

// クイックテスト
ChromeExtensionTestFramework.test('/path/to/extension');

// カスタム設定でテスト
const framework = new ChromeExtensionTestFramework({
    extensionPath: './my-extension',
    output: {
        format: ['console', 'json'],
        directory: './test-results'
    }
});

// ビルトインテストを使用
framework.useBuiltinTests();

// カスタムテストスイートを追加
framework.addSuite({
    name: 'My Custom Tests',
    tests: [
        {
            name: 'Custom validation',
            test: async (config) => {
                // カスタム検証ロジック
            }
        }
    ]
});

// テスト実行
const results = await framework.run();
```

## ビルトインテストスイート

### 1. Manifest Validation
- Manifest V3準拠チェック
- 必須フィールドの存在確認
- バージョン形式の検証
- アイコンファイルの存在確認
- Service Worker設定の検証

### 2. Security Validation
- CSP（Content Security Policy）の検証
- 外部スクリプトの検出
- eval()使用の検出
- HTTPS強制の確認
- 最小権限の原則チェック

### 3. Performance Validation
- ファイルサイズの制限チェック
- 画像最適化の確認
- JavaScript/CSSの最適化
- メモリリークの潜在的リスク検出
- アニメーションパフォーマンス

### 4. Structure Validation
- ディレクトリ構造の検証
- ファイル命名規則
- 開発用ファイルの除外確認
- モジュール構造の検証
- 重複ファイルの検出

### 5. Localization Validation
- 多言語対応の構造確認
- messages.jsonの形式検証
- ロケール間の一貫性チェック
- RTL言語サポートの確認
- 国際化APIの使用状況

## カスタムテストの作成

### TestSuiteクラスを使用

```javascript
const { TestSuite } = require('chrome-extension-test-framework');

class MyTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'My Custom Suite',
            description: 'カスタム検証スイート'
        });
        
        this.setupTests();
    }
    
    setupTests() {
        this.test('My test', async (config) => {
            // テストロジック
            const manifest = await this.loadManifest(config);
            if (!manifest.my_field) {
                throw new Error('my_field is required');
            }
        });
    }
}
```

### TestCaseクラスを使用

```javascript
const { TestCase } = require('chrome-extension-test-framework');

// 簡単なアサーション
const myTest = TestCase.assertion(
    'Check custom field',
    async (config) => {
        const manifest = require(path.join(config.extensionPath, 'manifest.json'));
        return manifest.custom_field === 'expected_value';
    }
);

// 期待値の比較
const versionTest = TestCase.expect(
    'Version check',
    async (config) => {
        const manifest = require(path.join(config.extensionPath, 'manifest.json'));
        return manifest.version;
    },
    '1.0.0'
);
```

## 設定ファイル

`cext-test.config.js`または`.cextrc.json`を作成:

```javascript
module.exports = {
    extensionPath: './src',
    output: {
        format: ['console', 'json', 'html'],
        directory: './test-reports',
        filename: 'extension-test'
    },
    validation: {
        manifest: true,
        permissions: true,
        csp: true,
        icons: true,
        locales: true
    },
    rules: [
        // カスタムルール
    ],
    timeout: 30000
};
```

## CI/CD統合

### GitHub Actions

```yaml
- name: Test Chrome Extension
  run: |
    npm install chrome-extension-test-framework
    npx cext-test ./extension -o json
```

### GitLab CI

```yaml
test:
  script:
    - npm install chrome-extension-test-framework
    - npx cext-test ./extension -o json,html
  artifacts:
    paths:
      - test-results/
```

## API リファレンス

### ChromeExtensionTestFramework

#### Constructor
```javascript
new ChromeExtensionTestFramework(config)
```

#### Methods
- `loadConfig(configPath)` - 設定ファイルを読み込み
- `addSuite(suite)` - テストスイートを追加
- `useBuiltinTests()` - ビルトインテストを使用
- `use(plugin)` - プラグインを使用
- `addValidator(name, validator)` - カスタムバリデーターを追加
- `run()` - テストを実行

### TestSuite

#### Methods
- `test(name, testFn, options)` - テストケースを追加
- `skip(name, testFn, options)` - スキップするテストを追加
- `before(fn)` - beforeAllフックを設定
- `after(fn)` - afterAllフックを設定

### TestCase

#### Static Methods
- `TestCase.create(name, test, options)` - 基本的なテストケース作成
- `TestCase.assertion(name, assertion, options)` - アサーションテスト
- `TestCase.expect(name, getter, expected, options)` - 期待値比較テスト
- `TestCase.match(name, getter, pattern, options)` - パターンマッチングテスト

## トラブルシューティング

### Q: ブラウザがインストールされていなくても動作しますか？
A: はい、このフレームワークは静的解析のみを使用するため、ブラウザは不要です。

### Q: 実際のDOM操作やchrome.* APIのテストはできますか？
A: いいえ、このフレームワークは静的解析に特化しています。実際のブラウザ環境でのテストには別のツールが必要です。

### Q: カスタムルールを追加するには？
A: `addValidator`メソッドを使用するか、カスタムTestSuiteクラスを作成してください。

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。