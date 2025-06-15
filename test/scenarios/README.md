# Chrome Extension Test Framework - テストシナリオ

このディレクトリには、様々な実際の使用シナリオを想定したテストケースが含まれています。

## 📁 シナリオ一覧

### 1. エッジケース拡張機能
- **empty-extension**: 最小限の空の拡張機能
- **huge-extension**: 巨大なファイルサイズの拡張機能
- **deep-nesting**: 深いディレクトリ構造を持つ拡張機能
- **special-chars**: 特殊文字を含むファイル名の拡張機能
- **circular-deps**: 循環依存を持つ拡張機能
- **malformed-json**: 不正なJSONファイルを含む拡張機能

### 2. セキュリティ問題
- **unsafe-eval**: eval()を使用する拡張機能
- **external-scripts**: 外部スクリプトを読み込む拡張機能
- **mixed-content**: HTTPとHTTPSが混在する拡張機能
- **excessive-permissions**: 過剰な権限を要求する拡張機能

### 3. パフォーマンス問題
- **memory-leak**: メモリリークの可能性がある拡張機能
- **large-assets**: 大きな画像やリソースを含む拡張機能
- **slow-startup**: 起動時に重い処理を行う拡張機能
- **blocking-scripts**: ブロッキングスクリプトを含む拡張機能

### 4. 国際化問題
- **missing-locales**: 一部のロケールが欠けている拡張機能
- **inconsistent-translations**: 翻訳の不整合がある拡張機能
- **rtl-issues**: RTL言語の問題がある拡張機能
- **encoding-problems**: エンコーディング問題がある拡張機能

### 5. 互換性問題
- **legacy-apis**: 廃止予定のAPIを使用する拡張機能
- **browser-specific**: ブラウザ固有の機能を使用する拡張機能
- **manifest-v2**: Manifest V2の拡張機能
- **mixed-versions**: V2とV3の機能が混在する拡張機能

### 6. 構造的問題
- **monorepo**: モノレポ構造の拡張機能
- **multi-extension**: 複数の拡張機能を含むプロジェクト
- **symlinks**: シンボリックリンクを使用する拡張機能
- **generated-files**: ビルド生成ファイルを含む拡張機能

### 7. 実際のユースケース
- **e-commerce**: ECサイト用拡張機能
- **productivity**: 生産性向上ツール
- **developer-tools**: 開発者ツール拡張機能
- **social-media**: ソーシャルメディア連携拡張機能
- **ad-blocker**: 広告ブロッカー拡張機能

## 🎯 テストの目的

1. **フレームワークの堅牢性向上**
   - エラーハンドリングの改善
   - エッジケースへの対応
   - より詳細なエラーメッセージ

2. **新機能の発見**
   - 実際の使用で必要な機能の特定
   - ユーザビリティの向上
   - より高度な検証機能

3. **パフォーマンスの最適化**
   - ボトルネックの特定
   - メモリ使用量の削減
   - 実行速度の向上

4. **ドキュメントの充実**
   - よくある問題とその解決策
   - ベストプラクティスガイド
   - トラブルシューティング

## 🚀 実行方法

```bash
# すべてのシナリオをテスト
node test/scenarios/run-all.js

# 特定のカテゴリをテスト
node test/scenarios/run-all.js --category edge-cases

# 個別のシナリオをテスト
cext-test test/scenarios/edge-cases/empty-extension

# 詳細なレポート付き
node test/scenarios/run-all.js --detailed-report
```

## 📊 期待される結果

各シナリオには `expected-results.json` ファイルが含まれており、以下の情報が記載されています：

- 予想されるエラー/警告
- 推奨される修正方法
- フレームワークの改善点
- 関連するGitHub Issue

## 🔄 継続的な改善

新しいシナリオは定期的に追加され、実際のユーザーフィードバックに基づいて更新されます。