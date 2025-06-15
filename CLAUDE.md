# Chrome Extension Test Framework - Development Workflow

このドキュメントは、Chrome Extension Test Framework の開発・リリースワークフローを記載しています。

## 🚀 リリースフロー

新機能の追加やバグ修正を行い、新バージョンをリリースする際の標準的なフローです。

### 1. 開発ブランチの作成
```bash
git checkout -b feature/your-feature-name
```

### 2. 開発作業
- コードの変更
- テストの実行: `npm test`
- リンターの実行（将来的に追加予定）

### 3. コミット
```bash
git add .
git commit -m "feat: Your feature description

- Detailed change 1
- Detailed change 2

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. プルリクエストの作成
```bash
git push -u origin feature/your-feature-name
gh pr create --title "feat: Your feature" --body "## 概要\n..."
```

### 5. レビューとマージ
- CodeRabbit による自動レビューを確認
- 必要に応じて修正
- PR をマージ（Delete branch オプション付き）

### 6. バージョン更新
メインブランチで以下のファイルを更新：
- `package.json` - version フィールド
- `CHANGELOG.md` - 新バージョンのセクション追加

### 7. Git タグの作成
```bash
git tag -a v1.x.x -m "Release version 1.x.x

- Feature 1
- Feature 2
- Bug fix 1"

git push origin v1.x.x
```

### 8. npm への公開
```bash
npm publish
```

### 9. GitHub リリースの作成
```bash
gh release create v1.x.x \
  --title "v1.x.x - Release Title" \
  --notes "## Release Notes..."
```

## 📋 開発タスク管理

### 優先順位の高い改善項目（引き継ぎ資料より）

#### 即座に実装可能な改善
1. ✅ プログレス表示（テスト実行中の進捗）- v1.1.0 で実装済み
2. ✅ より詳細なエラーメッセージ - v1.2.0 で実装済み
3. ✅ 基本的な自動修正機能 - v1.3.0 で実装済み

#### 中期的な目標
1. ウォッチモード（ファイル変更時の自動テスト）
2. 並列実行オプション
3. より高度なメトリクス

#### 長期的な目標
1. VS Code 拡張機能の開発
2. コミュニティからのフィードバックに基づく機能追加

## 🛠️ 開発環境

### 必要なツール
- Node.js 14.0.0 以上
- npm
- Git
- GitHub CLI (`gh`)

### セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/ibushimaru/chrome-extension-test-framework.git
cd chrome-extension-test-framework

# 依存関係のインストール
npm install

# CLI のリンク（ローカルテスト用）
npm link
```

### テスト実行
```bash
# フレームワークのテスト
npm test

# サンプル拡張機能でのテスト
cext-test samples/good-extension
cext-test samples/bad-extension --verbose
cext-test samples/minimal-extension --no-progress

# すべてのサンプルをテスト
node samples/test-all.js
```

## 📝 コーディング規約

### JavaScript
- ES6+ の機能を使用
- セミコロンあり
- インデント: スペース 4 つ
- コメントは必要に応じて日本語 OK

### コミットメッセージ
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント更新
- refactor: リファクタリング
- test: テスト追加・修正
- chore: その他の変更

### ファイル構成
```
chrome-extension-test-framework/
├── bin/              # CLI 実行ファイル
├── lib/              # コアライブラリ
├── suites/           # ビルトインテストスイート
├── samples/          # サンプル拡張機能
├── test/             # フレームワークのテスト
└── docs/             # ドキュメント（将来的に）
```

## 🔍 デバッグ

### よくある問題

#### npm publish でエラー
- ログイン確認: `npm whoami`
- バージョン重複確認: `npm view chrome-extension-test-framework versions`

#### テストが失敗する
- サンプル拡張機能のパスを確認
- 正規表現のエスケープを確認

## 📊 メトリクス

### パッケージ情報
- npm: https://www.npmjs.com/package/chrome-extension-test-framework
- サイズ: 約 30KB (gzipped)
- 依存関係: なし（ゼロ依存）

### パフォーマンス目標
- テスト実行時間: 100ms 以下
- メモリ使用量: 50MB 以下

## 🤝 コントリビューション

1. Issue の作成または既存 Issue の確認
2. フィーチャーブランチの作成
3. 変更の実装とテスト
4. PR の作成
5. レビューとマージ

## 📚 参考リンク

- [GitHub リポジトリ](https://github.com/ibushimaru/chrome-extension-test-framework)
- [npm パッケージ](https://www.npmjs.com/package/chrome-extension-test-framework)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

## 🗓️ 更新履歴

- 2025-06-15: v1.3.0 リリース（自動修正機能）
- 2025-06-15: v1.2.0 リリース（詳細なエラーメッセージ）
- 2025-06-15: v1.1.0 リリース（プログレス表示機能）
- 2025-06-15: v1.0.1 npm 初回公開
- 2025-06-15: CLAUDE.md 作成、ワークフロー文書化

---

このドキュメントは開発の進行に応じて更新されます。