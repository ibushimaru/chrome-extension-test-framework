# Chrome Extension Test Framework - 移行ガイド

## 独立リポジトリへの移行手順

### 1. プロジェクトの分離

#### 現在の場所
```
/home/ibushimaru/project/Unlimited-Shortcuts/chrome-extension-test-framework/
```

#### 独立リポジトリとして分離
```bash
# 1. フレームワークディレクトリを別の場所にコピー
cp -r /home/ibushimaru/project/Unlimited-Shortcuts/chrome-extension-test-framework ~/chrome-extension-test-framework

# 2. 新しいディレクトリに移動
cd ~/chrome-extension-test-framework

# 3. 新しいGitリポジトリを初期化
git init

# 4. 初回コミット
git add .
git commit -m "Initial commit: Chrome Extension Test Framework v1.0.0"
```

### 2. GitHubリポジトリの作成

#### GitHub CLIを使用する場合
```bash
# GitHubにリポジトリを作成
gh repo create chrome-extension-test-framework --public \
  --description "Universal testing framework for Chrome extensions" \
  --enable-issues --enable-wiki

# リモートを設定
git remote add origin https://github.com/YOUR_USERNAME/chrome-extension-test-framework.git

# プッシュ
git push -u origin main
```

#### GitHub Webインターフェースを使用する場合
1. https://github.com/new にアクセス
2. Repository name: `chrome-extension-test-framework`
3. Description: `Universal testing framework for Chrome extensions`
4. Public リポジトリを選択
5. "Create repository" をクリック

```bash
# リモートを追加してプッシュ
git remote add origin https://github.com/YOUR_USERNAME/chrome-extension-test-framework.git
git branch -M main
git push -u origin main
```

### 3. 既存プロジェクトからの削除

元のUnlimited Shortcutsプロジェクトから削除：
```bash
cd /home/ibushimaru/project/Unlimited-Shortcuts
rm -rf chrome-extension-test-framework
git add -A
git commit -m "Remove chrome-extension-test-framework (moved to separate repository)"
```

### 4. 既存プロジェクトでの使用方法

#### npmパッケージとして使用（公開後）
```bash
cd /home/ibushimaru/project/Unlimited-Shortcuts
npm install chrome-extension-test-framework
```

#### GitHubから直接インストール
```bash
npm install github:YOUR_USERNAME/chrome-extension-test-framework
```

#### package.jsonに追加
```json
{
  "devDependencies": {
    "chrome-extension-test-framework": "github:YOUR_USERNAME/chrome-extension-test-framework"
  }
}
```

### 5. CI/CD の更新

#### Unlimited Shortcutsの.github/workflows/test.yml
```yaml
name: Test Chrome Extension

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run extension tests
      run: npx cext-test -o json,html
```

### 6. ドキュメントの更新

#### Unlimited ShortcutsのREADMEに追加
```markdown
## Testing

This project uses [Chrome Extension Test Framework](https://github.com/YOUR_USERNAME/chrome-extension-test-framework) for quality assurance.

```bash
# Run tests
npm test

# Generate detailed report
npx cext-test -o html -d ./test-reports
```
```

### 7. 開発ワークフローの変更

#### フレームワーク開発時
```bash
# フレームワークのリポジトリで開発
cd ~/chrome-extension-test-framework
# 変更を加える
git add .
git commit -m "feat: Add new feature"
git push

# 使用側のプロジェクトで更新
cd /home/ibushimaru/project/Unlimited-Shortcuts
npm update chrome-extension-test-framework
```

#### ローカル開発リンク
```bash
# フレームワークをローカルでリンク
cd ~/chrome-extension-test-framework
npm link

# 使用側でリンクを使用
cd /home/ibushimaru/project/Unlimited-Shortcuts
npm link chrome-extension-test-framework
```

### 8. リリース管理

#### バージョンタグの作成
```bash
cd ~/chrome-extension-test-framework

# バージョンを更新
npm version minor

# タグをプッシュ
git push origin --tags

# GitHubリリースを作成
gh release create v1.1.0 --generate-notes
```

### 9. 公開チェックリスト

- [ ] package.jsonの`repository`、`author`、`homepage`を更新
- [ ] READMEのバッジとリンクを更新
- [ ] LICENSEファイルの著作権者を確認
- [ ] .gitignoreが適切に設定されている
- [ ] GitHub Actionsが正常に動作
- [ ] セキュリティポリシーを追加（SECURITY.md）
- [ ] Issue/PRテンプレートを追加
- [ ] npm公開の準備（オプション）

### 10. トラブルシューティング

#### 問題: Permission denied
```bash
# 実行権限を付与
chmod +x bin/cli.js
git add bin/cli.js
git commit -m "fix: Add execute permission to CLI"
```

#### 問題: モジュールが見つからない
```bash
# キャッシュをクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 問題: Gitの履歴を保持したい場合
```bash
# filter-branchを使用して履歴を抽出
cd /home/ibushimaru/project/Unlimited-Shortcuts
git subtree split --prefix=chrome-extension-test-framework -b framework-only

# 新しいリポジトリで
cd ~/chrome-extension-test-framework
git pull /home/ibushimaru/project/Unlimited-Shortcuts framework-only
```

## まとめ

この移行により、Chrome Extension Test Frameworkは：
- 独立したプロジェクトとして管理可能
- 他のプロジェクトから簡単に利用可能
- バージョン管理が明確
- コントリビューションが容易
- CI/CDパイプラインが独立

となります。