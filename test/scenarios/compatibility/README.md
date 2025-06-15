# Compatibility Test Scenarios

このディレクトリには、Chrome拡張機能の互換性問題のテストシナリオが含まれています。

## シナリオ一覧

### 1. old-chrome-version
- 古いChrome バージョンでのみ動作する機能
- minimum_chrome_versionが低すぎる設定

### 2. experimental-apis
- 実験的なAPIの使用
- 安定していないAPI

### 3. cross-browser
- Chrome以外のブラウザ固有のAPI使用
- WebExtensions APIとの混在

### 4. platform-specific
- 特定のOSでのみ動作する機能
- プラットフォーム依存のコード

### 5. deprecated-permissions
- 廃止予定の権限
- 古い権限形式

### 6. mixed-manifest-versions
- Manifest V2とV3の機能の混在
- 移行中の拡張機能

### 7. future-apis
- まだ実装されていないAPI
- 将来のChrome バージョン向けの機能