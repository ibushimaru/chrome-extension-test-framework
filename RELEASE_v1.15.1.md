# Release v1.15.1 - Emergency Fix & Diagnostics

## 🚀 リリース手順

### 1. GitHubへのプッシュ
```bash
# コミットをプッシュ
git push origin main

# タグをプッシュ
git push origin v1.15.1
```

### 2. npm公開
```bash
# npmにログイン（必要な場合）
npm login

# パッケージを公開
npm publish
```

### 3. GitHubリリースの作成
```bash
gh release create v1.15.1 \
  --title "v1.15.1 - Emergency Fix & Diagnostics" \
  --notes "$(cat <<'EOF'
## 🐛 Bug Fixes

### Critical Issues Fixed
- **Issue #45**: Fixed `detector.removeNonCodeContent` error that was breaking test execution
- **Issue #44**: Fixed version management inconsistency - now dynamically reads from package.json
- **Issue #46**: Added diagnostic mode for debugging line number accuracy issues

### 🔍 New Features
- **Diagnostic Mode**: Enable with `CEXT_DIAGNOSTIC=true` to debug line number mismatches
- **DiagnosticHelper**: New utility class for troubleshooting file analysis issues

## 📊 Test Results
- All tests passing (57/57 - 100% success rate)
- Framework stability restored
- No breaking changes

## 🔧 Usage

### Diagnostic Mode
If you encounter line number mismatches (e.g., errors reported at line 1413 in a 663-line file):

```bash
CEXT_DIAGNOSTIC=true cext-test your-extension-path
```

This will show:
- Actual file line count
- Calculated line numbers
- File encoding information
- Line ending types (CRLF/LF)

## 📝 Notes
- This is an emergency release to fix critical bugs
- No breaking changes from v1.15.0
- Diagnostic features help identify issues with bundled or preprocessed files

## 🙏 Acknowledgments
Thanks to the community testers who reported these issues!

---
🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

## 📋 完了したIssues

- ✅ Issue #45: detector.removeNonCodeContent error
- ✅ Issue #44: Version management inconsistency  
- ✅ Issue #46: Diagnostic support for line number issues

## 🔍 リリース前チェックリスト

- [x] すべてのテストが成功 (100% success rate)
- [x] package.json のバージョン更新 (1.15.1)
- [x] CHANGELOG.md の更新
- [x] README.md にトラブルシューティングセクション追加
- [x] Git タグの作成 (v1.15.1)
- [ ] GitHub へのプッシュ
- [ ] npm への公開
- [ ] GitHub Release の作成

## 📈 バージョン情報

- **現在のバージョン**: 1.15.1
- **前バージョン**: 1.15.0
- **リリース日**: 2025-06-16

## 🎯 次のステップ

1. 上記のコマンドを順番に実行
2. npm公開後、バージョンが正しく表示されることを確認
3. GitHub Issuesを確認し、修正されたIssuesをクローズ

---

このドキュメントは v1.15.1 リリースのガイドです。