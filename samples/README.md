# Sample Chrome Extensions

このディレクトリには、Chrome Extension Test Frameworkのテスト対象として使用できるサンプル拡張機能が含まれています。

## サンプル一覧

### 1. good-extension
すべてのテストに合格する、ベストプラクティスに従った拡張機能の例です。

- ✅ Manifest V3準拠
- ✅ 適切なセキュリティ設定
- ✅ 最適化されたパフォーマンス
- ✅ 正しいファイル構造
- ✅ 多言語対応

### 2. bad-extension
一般的な問題を含む拡張機能の例です。テストフレームワークがどのような問題を検出できるかを示します。

- ❌ セキュリティの問題
- ❌ パフォーマンスの問題
- ❌ 構造の問題
- ❌ 多言語対応の不備

### 3. minimal-extension
最小限の機能を持つシンプルな拡張機能の例です。

## 使い方

```bash
# 良い例をテスト
cext-test samples/good-extension

# 悪い例をテスト（エラーが検出されます）
cext-test samples/bad-extension

# 最小限の例をテスト
cext-test samples/minimal-extension
```

## テスト結果の確認

各サンプルディレクトリには、期待されるテスト結果を記載した `EXPECTED_RESULTS.md` ファイルが含まれています。