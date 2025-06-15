# Edge Cases Test Scenarios

このディレクトリには、Chrome拡張機能の異常系・エッジケースのテストシナリオが含まれています。

## シナリオ一覧

### 1. broken-manifest
- 不正なJSON形式のmanifest.json
- JSONは有効だが必須フィールドが欠落
- 型が間違っているフィールド

### 2. circular-dependencies
- 循環参照を含むスクリプト
- 自己参照するコンテンツスクリプト

### 3. empty-extension
- manifest.jsonのみで他のファイルがない
- 空のディレクトリ

### 4. corrupted-files
- バイナリデータを含むJavaScriptファイル
- 不正なエンコーディングのファイル
- 0バイトのファイル

### 5. permission-conflicts
- 矛盾する権限設定
- 廃止された権限の使用
- 過剰な権限要求

### 6. invalid-paths
- 存在しないファイルへの参照
- 相対パスの誤用
- シンボリックリンク

### 7. resource-limits
- 極端に大きなファイル
- 深いディレクトリ構造
- 大量のファイル数

### 8. encoding-issues
- 様々なエンコーディングのファイル
- BOMありUTF-8
- 混在するエンコーディング