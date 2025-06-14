# Contributing to Chrome Extension Test Framework

## 開発環境のセットアップ

### 1. リポジトリのフォーク
```bash
# GitHubでフォークボタンをクリック
# または GitHub CLI を使用
gh repo fork yourusername/chrome-extension-test-framework
```

### 2. ローカル開発環境の構築
```bash
# フォークしたリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/chrome-extension-test-framework.git
cd chrome-extension-test-framework

# アップストリームリモートを追加
git remote add upstream https://github.com/yourusername/chrome-extension-test-framework.git

# 依存関係をインストール
npm install

# 開発用にリンク
npm link
```

## コーディング規約

### JavaScriptスタイルガイド
```javascript
// ✅ 良い例
class TestRunner {
    constructor(config) {
        this.config = config;
    }
    
    async runTest(test) {
        // 4スペースインデント
        const result = await test.run();
        return result;
    }
}

// ❌ 悪い例
class TestRunner{
  constructor(config){
    this.config=config;
  }
  
  async runTest(test){
    // 2スペースインデント
    const result=await test.run();
    return result;
  }
}
```

### 命名規則
- クラス: PascalCase（例: `TestSuite`）
- 関数・メソッド: camelCase（例: `runTest`）
- 定数: UPPER_SNAKE_CASE（例: `DEFAULT_TIMEOUT`）
- ファイル名: PascalCase（クラス）またはkebab-case（その他）

### コメント規則
```javascript
/**
 * クラスまたは関数の説明
 * @param {string} name - パラメータの説明
 * @returns {Promise<Object>} 戻り値の説明
 */
async function example(name) {
    // 実装の説明（必要な場合）
    return { name };
}
```

## プルリクエストの作成方法

### 1. ブランチの作成
```bash
# 最新のmainブランチを取得
git checkout main
git pull upstream main

# 機能ブランチを作成
git checkout -b feature/your-feature-name

# バグ修正ブランチを作成
git checkout -b fix/bug-description
```

### 2. 変更の実装
```bash
# コードを変更

# テストを実行
npm test

# 変更をステージング
git add .

# コミット（詳細なメッセージを記載）
git commit -m "feat: Add new validation for manifest permissions

- Added permission level checking
- Added warning for dangerous permissions
- Updated tests for new validation"
```

### 3. プルリクエストの送信
```bash
# ブランチをプッシュ
git push origin feature/your-feature-name

# GitHub でプルリクエストを作成
# またはCLIを使用
gh pr create --title "Add new validation for manifest permissions" \
  --body "## Description
  
  This PR adds new validation for checking dangerous permissions.
  
  ## Changes
  - Added permission level checking
  - Added warning for dangerous permissions
  - Updated tests
  
  ## Testing
  - [ ] All tests pass
  - [ ] Added new tests for the feature
  - [ ] Manual testing completed"
```

## テストの追加

### 新しいテストスイートの追加
```javascript
// suites/MyNewTestSuite.js
const TestSuite = require('../lib/TestSuite');

class MyNewTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'My New Test Suite',
            description: 'Description of what this suite tests'
        });
        
        this.setupTests();
    }
    
    setupTests() {
        this.test('Test case name', async (config) => {
            // テストロジック
        });
    }
}

module.exports = MyNewTestSuite;
```

### 既存のスイートへのテスト追加
```javascript
// 既存のsetupTests()メソッドに追加
this.test('New test case', async (config) => {
    const manifestPath = path.join(config.extensionPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // 新しい検証ロジック
    if (!manifest.new_field) {
        throw new Error('new_field is required');
    }
});
```

## ドキュメントの更新

### READMEの更新が必要な場合
- 新機能の追加
- APIの変更
- 使用例の追加
- 設定オプションの追加

### 更新例
```markdown
### 新機能: カスタムバリデーション

```javascript
framework.addValidator('custom-check', {
    validate: (manifest) => {
        return manifest.custom_field === 'expected';
    },
    message: 'Custom field validation failed'
});
```
```

## リリースプロセス

### 1. バージョン番号の更新
```bash
# セマンティックバージョニングに従う
# パッチリリース (バグ修正): 1.0.0 -> 1.0.1
npm version patch

# マイナーリリース (新機能): 1.0.0 -> 1.1.0
npm version minor

# メジャーリリース (破壊的変更): 1.0.0 -> 2.0.0
npm version major
```

### 2. 変更履歴の更新
```markdown
# CHANGELOG.md

## [1.1.0] - 2024-06-15

### Added
- New custom validator support
- Markdown report format

### Fixed
- File path resolution on Windows

### Changed
- Improved error messages
```

### 3. タグとリリース
```bash
# タグをプッシュ
git push origin --tags

# GitHub Releaseを作成
gh release create v1.1.0 --title "Release v1.1.0" \
  --notes "See CHANGELOG.md for details"
```

## Issue の報告方法

### バグレポートテンプレート
```markdown
**説明**
バグの明確で簡潔な説明

**再現手順**
1. '...'を実行
2. '...'をクリック
3. エラーが発生

**期待される動作**
正常に動作した場合の説明

**実際の動作**
実際に発生した動作

**環境**
- OS: [例: Ubuntu 20.04]
- Node.js: [例: v16.13.0]
- Framework version: [例: 1.0.0]

**追加情報**
スクリーンショット、エラーログなど
```

### 機能リクエストテンプレート
```markdown
**機能の説明**
追加したい機能の明確な説明

**解決する問題**
この機能が解決する問題や使用ケース

**提案する解決策**
機能の実装方法の提案

**代替案**
検討した他の解決策

**追加情報**
参考リンク、類似機能など
```

## コードレビューガイドライン

### レビュアーのチェックリスト
- [ ] コードがスタイルガイドに従っている
- [ ] 適切なテストが追加されている
- [ ] ドキュメントが更新されている
- [ ] 破壊的変更がない（またはメジャーバージョン更新）
- [ ] パフォーマンスへの影響を考慮している

### レビューコメントの例
```
// 建設的なフィードバック
✅ "この部分はasync/awaitを使うとより読みやすくなります"
❌ "このコードは悪い"

// 具体的な提案
✅ "ここでtry-catchを使ってエラーハンドリングを追加しましょう"
❌ "エラー処理が必要"
```

## 開発用コマンド

### テスト実行
```bash
# 全テストを実行
npm test

# 特定のファイルをテスト
node test/specific-test.js

# ウォッチモードでテスト
nodemon test/framework.test.js
```

### デバッグ
```bash
# Node.jsデバッガーを使用
node --inspect-brk test/framework.test.js

# VSCodeでデバッグ
# .vscode/launch.json を使用
```

### コード品質チェック
```bash
# ESLintを実行（設定されている場合）
npm run lint

# コードフォーマット（Prettierなど）
npm run format
```

## アーキテクチャ概要

```
chrome-extension-test-framework/
├── index.js              # メインエントリーポイント
├── lib/
│   ├── TestRunner.js     # テスト実行エンジン
│   ├── TestSuite.js      # テストスイート基底クラス
│   ├── TestCase.js       # テストケース実装
│   ├── Validator.js      # バリデーションユーティリティ
│   ├── Reporter.js       # レポート生成
│   └── ConfigLoader.js   # 設定読み込み
├── suites/              # ビルトインテストスイート
│   ├── ManifestTestSuite.js
│   ├── SecurityTestSuite.js
│   ├── PerformanceTestSuite.js
│   ├── StructureTestSuite.js
│   └── LocalizationTestSuite.js
├── bin/
│   └── cli.js          # CLIエントリーポイント
└── test/              # テストファイル
```

## サポート

### 質問がある場合
1. 既存のIssueを検索
2. Stack Overflowで`chrome-extension-test-framework`タグを確認
3. 新しいDiscussionを開始

### セキュリティ問題の報告
セキュリティ脆弱性を発見した場合は、公開Issueではなく、直接メールで報告してください: security@example.com