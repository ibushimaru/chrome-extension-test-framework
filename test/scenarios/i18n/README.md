# Internationalization (i18n) Test Scenarios

このディレクトリには、Chrome拡張機能の国際化・多言語対応のテストシナリオが含まれています。

## シナリオ一覧

### 1. missing-default-locale
- manifest.jsonでdefault_localeが指定されているが、対応するロケールファイルが存在しない

### 2. inconsistent-messages
- 各ロケール間でメッセージキーが一致しない
- 必須メッセージが一部のロケールで欠落

### 3. invalid-locale-structure
- 不正な形式のmessages.json
- 誤ったディレクトリ構造

### 4. mixed-locale-usage
- ハードコードされたテキストとi18n APIの混在
- 部分的なローカライゼーション

### 5. rtl-support
- RTL（右から左）言語のサポート
- アラビア語、ヘブライ語などの対応

### 6. locale-fallback
- フォールバック機構のテスト
- 存在しないロケールへのフォールバック

### 7. special-characters
- 特殊文字を含むメッセージ
- エスケープ処理の検証

### 8. placeholder-usage
- プレースホルダーの正しい使用法
- 動的なメッセージの生成