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
- 💡 **詳細なエラーメッセージ** - エラーコード、修正提案、コード例、ドキュメントリンク付き (v1.2.0+)
- 🔧 **自動修正機能** - 一般的な問題を自動的に修正 (v1.3.0+)
- 👀 **ウォッチモード** - ファイル変更時の自動テスト (v1.4.0+)
- ⚡ **並列実行** - 複数のテストスイートを並列で実行 (v1.4.0+)
- 📋 **プロファイル機能** - 事前定義された設定セットの利用 (v1.5.0+)
- 🔄 **インクリメンタルテスト** - 変更されたファイルのみテスト (v1.5.0+)
- 🛡️ **高度なセキュリティ分析** - APIキー検出、安全でないストレージ検出 (v1.7.0+)
- 📈 **パフォーマンス分析** - メモリリーク、重い処理、DOM操作の検出 (v1.8.0+)
- ✅ **Manifest V3完全対応** - 最新のChrome拡張機能仕様に準拠 (v1.8.0+)

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

# 問題を自動修正
cext-test --fix

# 修正内容をプレビュー（実際には変更しない）
cext-test --fix-dry-run

# ウォッチモード（ファイル変更時に自動実行）
cext-test --watch

# 並列実行（高速化）
cext-test --parallel

# 変更されたファイルのみテスト
cext-test --changed

# プロファイルを使用 (v1.9.0+)
cext-test --profile development  # 開発用（緩いルール）
cext-test --profile production   # 本番用（厳しいルール）  
cext-test --profile quick        # 高速チェック

# 現在の設定を表示 (v1.9.0+)
cext-test --show-config

# 詳細モード
cext-test --verbose

# プログレス表示を無効化
cext-test --no-progress

# ヘルプを表示
cext-test --help
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

## 自動修正機能 (v1.3.0+)

このフレームワークは、一般的な問題を自動的に修正する機能を提供します：

### 修正可能な問題

#### manifest.json
- Manifest V2からV3への移行
- 不正なバージョン形式の修正
- 必須フィールドの追加
- 長すぎる名前・説明の短縮
- CSPの形式変換とunsafe-eval/unsafe-inlineの削除
- browser_actionからactionへの変換

#### ファイル名
- スペースをアンダースコアに置換
- 特殊文字の削除
- 大文字を小文字に変換（README、LICENSE、CHANGELOGを除く）

### 使用方法

```bash
# 修正内容をプレビュー
cext-test --fix-dry-run

# 実際に修正を適用
cext-test --fix

# 詳細な修正内容を表示
cext-test --fix --verbose
```

### 修正例

```bash
$ cext-test samples/broken-extension --fix

🔧 Running auto-fix on: samples/broken-extension

📊 Auto-fix Summary:
   Total fixes: 11

   By type:
   - UPDATE_FIELD: 1
   - FIX_VERSION: 1
   - TRUNCATE_FIELD: 2
   - MIGRATE_V2_TO_V3: 2
   - RENAME_FILE: 2
   - MIGRATE_CSP: 1
   - REMOVE_UNSAFE: 2

✅ Fixes applied successfully!
💡 Run tests again to verify the fixes
```

## ビルトインテストスイート

### 1. Manifest Validation (強化版)
- ✅ Manifest V3準拠チェック
- ✅ 必須フィールドの存在確認
- ✅ バージョン形式の検証
- ✅ アイコンファイルの存在確認
- ✅ Service Worker設定の検証
- 🆕 chrome.action API検証（browser_action廃止警告）
- 🆕 Declarative Net Request API検証
- 🆕 chrome.scripting API検証（executeScript/insertCSS廃止警告）
- 🆕 最小Chromeバージョン検証（v88以上推奨）

### 2. Security Validation (v1.7.0で大幅強化)
- ✅ CSP（Content Security Policy）の検証
- ✅ 外部スクリプトの検出
- ✅ eval()使用の検出
- ✅ HTTPS強制の確認
- ✅ 最小権限の原則チェック
- 🆕 **詳細な権限分析** (v1.9.0+)
  - 各権限の具体的な説明を表示
  - 危険度レベルで分類（high/moderate/low）
  - 権限使用の推奨事項を提示
- 🆕 **高度なセキュリティ分析** (SecurityAnalyzer)
  - APIキー・シークレットの検出（30種類以上のパターン）
  - 安全でないストレージパターン検出
  - 危険なJavaScriptパターン検出（eval、Function構造体）
  - XSS脆弱性検出
  - 安全でない通信パターン検出
- 🆕 **Chrome Storage API使用分析** (StorageAnalyzer)
  - localStorage/sessionStorage使用警告
  - chrome.storage APIへの移行提案

### 3. Performance Validation (v1.8.0で大幅強化)
- ✅ ファイルサイズの制限チェック
- ✅ 画像最適化の確認
- ✅ JavaScript/CSSの最適化
- ✅ アニメーションパフォーマンス
- 🆕 **包括的なパフォーマンス分析** (PerformanceAnalyzer)
  - メモリリークパターン検出（15種類以上）
  - 重い計算処理検出（ネストループ、再帰）
  - 過剰なDOM操作検出
  - バンドルサイズと最適化分析
  - CSSパフォーマンス問題検出
  - 重複コード検出

### 4. Structure Validation (v1.6.0で強化)
- ✅ ディレクトリ構造の検証
- ✅ ファイル命名規則
- ✅ 開発用ファイルの除外確認
- ✅ モジュール構造の検証
- ✅ 重複ファイルの検出
- 🆕 **ファイル検証の強化**
  - FileSizeAnalyzer: 個別ファイル・拡張子別のサイズ分析
  - FileNameValidator: プラットフォーム互換性、特殊文字検出
  - DirectoryAnalyzer: ディレクトリ深度・複雑度分析

### 5. Localization Validation
- ✅ 多言語対応の構造確認
- ✅ messages.jsonの形式検証
- ✅ ロケール間の一貫性チェック
- ✅ RTL言語サポートの確認
- ✅ 国際化APIの使用状況
- 🆕 ハードコードされたテキストの検出
- 🆕 プレースホルダー使用の検証

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
    // 除外パターン (v1.9.0+)
    exclude: [
        'test/**',
        'docs/**',
        '*.test.js'
    ],
    // console.log使用の閾値設定 (v1.9.0+)
    consoleThresholds: {
        development: 100,   // 開発ファイルでの許容数
        production: 10,     // 本番コードでの許容数
        test: Infinity      // テストファイルでは無制限
    },
    // プロファイル設定 (v1.9.0+)
    profile: 'development',
    rules: [
        // カスタムルール
    ],
    timeout: 30000
};
```

## 高度な機能

### ウォッチモード (v1.4.0+)
ファイル変更を監視し、自動的にテストを再実行します。

```bash
# ウォッチモードで起動
cext-test --watch

# 特定のディレクトリのみ監視
cext-test --watch --watch-dirs src,manifest.json
```

### 並列実行 (v1.4.0+)
複数のテストスイートを並列で実行し、テスト時間を短縮します。

```bash
# 並列実行（CPUコア数に基づく最適化）
cext-test --parallel

# ワーカー数を指定
cext-test --parallel --max-workers 4
```

### プロファイル機能 (v1.5.0+)
事前定義された設定セットを使用して、特定の観点でテストを実行します。

```bash
# セキュリティ重視のテスト
cext-test --profile security-focused

# パフォーマンス重視のテスト
cext-test --profile performance

# 最小限のテスト
cext-test --profile minimal

# CI/CD向け設定
cext-test --profile ci
```

### インクリメンタルテスト (v1.5.0+)
前回のテスト以降に変更されたファイルのみをテストします。

```bash
# 変更されたファイルのみテスト
cext-test --changed

# 特定のコミット以降の変更をテスト
cext-test --changed --since HEAD~3
```

## テストシナリオ
フレームワークには40以上の実践的なテストシナリオが含まれています：

```bash
# エッジケースのテスト
cext-test test/scenarios/edge-cases/broken-manifest
cext-test test/scenarios/edge-cases/circular-dependencies

# セキュリティ問題のテスト
cext-test test/scenarios/security/api-keys
cext-test test/scenarios/security/eval-usage

# パフォーマンス問題のテスト
cext-test test/scenarios/performance/memory-leaks
cext-test test/scenarios/performance/large-dom

# 国際化のテスト
cext-test test/scenarios/i18n/missing-messages
cext-test test/scenarios/i18n/rtl-support

# Manifest V3互換性
cext-test test/scenarios/manifest-v3/deprecated-apis
cext-test test/scenarios/manifest-v3/modern-apis
```

## CI/CD統合

### GitHub Actions

```yaml
- name: Test Chrome Extension
  run: |
    npm install chrome-extension-test-framework
    npx cext-test ./extension -o json
    
- name: Test with Security Focus
  run: npx cext-test ./extension --profile security-focused
  
- name: Run Parallel Tests
  run: npx cext-test ./extension --parallel -o json,html
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
      
security-test:
  script:
    - npx cext-test ./extension --profile security-focused
  only:
    - merge_requests
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

### Q: テストが遅い場合は？
A: `--parallel`オプションを使用して並列実行を有効にするか、`--changed`オプションで変更されたファイルのみをテストしてください。

### Q: 特定の警告を無視したい場合は？
A: `.cextignore`ファイルを作成し、除外したいファイルやディレクトリを指定してください。

## バージョン履歴

### v1.9.0 (2025-06-15)
- 🆕 PermissionsAnalyzer: 詳細な権限分析と説明
- 🆕 CodeComplexityAnalyzer: 正確なネストループ検出
- 🆕 プロファイル機能の改善（意味のある違いを実装）
- 🆕 --show-configオプション
- 🆕 console.log使用の閾値設定（設定ファイルから読み込み可能）
- 🔧 設定ファイルのexcludeパターンが正しく動作するよう修正
- 🔧 Triple nested loopsの誤検出を修正

### v1.8.0 (2025-06-15)
- 🆕 PerformanceAnalyzer: 包括的なパフォーマンス分析
- 🆕 Manifest V3完全対応（chrome.action、declarativeNetRequest）
- 🆕 StorageAnalyzer: 非推奨ストレージAPI検出

### v1.7.0 (2025-06-15)
- 🆕 SecurityAnalyzer: 高度なセキュリティ脆弱性検出
- 🆕 APIキー・シークレット検出（30種類以上のパターン）

### v1.6.0 (2025-06-15)
- 🆕 FileSizeAnalyzer: 詳細なファイルサイズ分析
- 🆕 FileNameValidator: プラットフォーム互換性チェック
- 🆕 DirectoryAnalyzer: ディレクトリ構造分析

### v1.5.0 (2025-06-15)
- 🆕 プロファイル機能
- 🆕 インクリメンタルテスト
- 🆕 設定ファイルサポート強化

### v1.4.0 (2025-06-15)
- 🆕 ウォッチモード
- 🆕 並列実行
- 🆕 プログレスバー表示

### v1.3.0 (2025-06-15)
- 🆕 自動修正機能（--fix）
- 🆕 ドライラン機能（--fix-dry-run）

### v1.2.0 (2025-06-15)
- 🆕 詳細なエラーメッセージ
- 🆕 ErrorHandlerクラス

### v1.1.0 (2025-06-15)
- 🆕 プログレス表示機能
- 🆕 verboseオプション

### v1.0.0 (2025-06-14)
- 🎉 初回リリース

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。

## 関連リンク

- [GitHub リポジトリ](https://github.com/ibushimaru/chrome-extension-test-framework)
- [npm パッケージ](https://www.npmjs.com/package/chrome-extension-test-framework)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)