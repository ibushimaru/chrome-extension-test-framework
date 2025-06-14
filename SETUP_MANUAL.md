# Chrome Extension Test Framework - 完全セットアップマニュアル

## 前提条件

### 必須環境
- Node.js v12.0.0以上（推奨: v16以上）
- npm v6.0.0以上またはyarn v1.22.0以上
- Git（リポジトリクローン用）
- テキストエディタまたはIDE

### 環境確認コマンド
```bash
node --version  # v12.0.0以上であることを確認
npm --version   # v6.0.0以上であることを確認
git --version   # Gitがインストールされていることを確認
```

## インストール方法

### 方法1: npmから直接インストール（公開後）
```bash
# グローバルインストール（推奨）
npm install -g chrome-extension-test-framework

# ローカルインストール（プロジェクト単位）
npm install --save-dev chrome-extension-test-framework
```

### 方法2: GitHubからインストール
```bash
# HTTPSでクローン
git clone https://github.com/yourusername/chrome-extension-test-framework.git

# SSHでクローン（GitHubにSSHキー登録済みの場合）
git clone git@github.com:yourusername/chrome-extension-test-framework.git

# クローンしたディレクトリに移動
cd chrome-extension-test-framework

# 依存関係をインストール（現在は依存関係なし）
npm install

# グローバルにリンク
npm link
```

### 方法3: ローカルパスからインストール
```bash
# 絶対パスを指定
npm install /home/user/path/to/chrome-extension-test-framework

# 相対パスを指定
npm install ../chrome-extension-test-framework
```

## 使用方法

### 1. CLIとしての使用

#### 基本コマンド
```bash
# 現在のディレクトリの拡張機能をテスト
cext-test

# 特定のディレクトリを指定
cext-test /path/to/your/chrome-extension

# ヘルプを表示
cext-test --help
```

#### 詳細なオプション
```bash
# 出力形式を指定（複数可）
cext-test -o json,html,markdown

# 出力ディレクトリを指定
cext-test -d ./my-test-results

# 特定のテストスイートのみ実行
cext-test -s manifest,security

# 設定ファイルを使用
cext-test -c my-config.js

# すべてのオプションを組み合わせ
cext-test /path/to/extension -o json,html -d ./reports -s security,performance
```

### 2. プログラマティックAPIとしての使用

#### 基本的な使用例
```javascript
const ChromeExtensionTestFramework = require('chrome-extension-test-framework');

// 非同期関数内で使用
async function testMyExtension() {
    // 最も簡単な使用方法
    const results = await ChromeExtensionTestFramework.test('/path/to/extension');
    console.log('テスト結果:', results.summary);
}
```

#### 詳細な設定例
```javascript
const ChromeExtensionTestFramework = require('chrome-extension-test-framework');

async function advancedTest() {
    // フレームワークインスタンスを作成
    const framework = new ChromeExtensionTestFramework({
        extensionPath: './my-extension',
        output: {
            format: ['console', 'json', 'html'],
            directory: './test-reports',
            filename: 'extension-test-report'
        },
        validation: {
            manifest: true,
            permissions: true,
            csp: true,
            icons: true,
            locales: true
        },
        timeout: 60000  // 60秒のタイムアウト
    });

    // ビルトインテストを使用
    framework.useBuiltinTests();

    // テストを実行
    const results = await framework.run();

    // 結果を処理
    if (results.summary.failed > 0) {
        console.error('テストが失敗しました');
        process.exit(1);
    }
}
```

### 3. カスタムテストの追加

#### TestSuiteクラスの作成
```javascript
// my-custom-suite.js
const { TestSuite } = require('chrome-extension-test-framework');

class MyCustomTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'My Custom Tests',
            description: 'プロジェクト固有のテスト'
        });
        
        this.config = config;
        this.setupTests();
    }
    
    setupTests() {
        // テストケースを追加
        this.test('Custom field validation', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (!manifest.my_custom_field) {
                throw new Error('my_custom_field is required');
            }
        });
        
        // 条件付きテスト
        this.testIf(
            config => config.enableStrictMode,
            'Strict mode validation',
            async (config) => {
                // 厳格モードのテストロジック
            }
        );
    }
}

// 使用例
const framework = new ChromeExtensionTestFramework();
framework.addSuite(new MyCustomTestSuite(framework.config));
```

## 設定ファイル

### 設定ファイルの作成
```javascript
// cext-test.config.js
module.exports = {
    // 必須: テスト対象のパス
    extensionPath: process.cwd(),
    
    // 出力設定
    output: {
        format: ['console', 'json', 'html', 'markdown'],
        directory: './test-results',
        filename: 'test-report'
    },
    
    // バリデーション設定（true/falseで有効/無効を切り替え）
    validation: {
        manifest: true,
        permissions: true,
        csp: true,
        icons: true,
        locales: true
    },
    
    // カスタムルール（配列）
    rules: [
        {
            name: 'no-jquery',
            validate: (manifest, config) => {
                // jQueryの使用を禁止する例
                const jsFiles = fs.readdirSync(path.join(config.extensionPath, 'js'));
                return !jsFiles.some(file => file.includes('jquery'));
            },
            message: 'jQuery is not allowed in this project'
        }
    ],
    
    // タイムアウト（ミリ秒）
    timeout: 30000,
    
    // 並列実行
    parallel: false
};
```

### 設定ファイルの検索順序
1. コマンドラインで指定された設定ファイル（`-c`オプション）
2. `cext-test.config.js`
3. `cext-test.config.json`
4. `.cextrc.js`
5. `.cextrc.json`

## CI/CD統合

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Chrome Extension Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
    
    - name: Install framework
      run: npm install -g chrome-extension-test-framework
    
    - name: Run tests
      run: cext-test -o json,html -d ./test-results
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
    
    - name: Comment PR
      uses: actions/github-script@v6
      if: github.event_name == 'pull_request'
      with:
        script: |
          const fs = require('fs');
          const results = JSON.parse(fs.readFileSync('./test-results/test-report.json', 'utf8'));
          const comment = `## Chrome Extension Test Results
          - Total: ${results.summary.total}
          - Passed: ${results.summary.passed}
          - Failed: ${results.summary.failed}
          - Success Rate: ${results.summary.successRate}%`;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - test

chrome-extension-test:
  stage: test
  image: node:16
  script:
    - npm install -g chrome-extension-test-framework
    - cext-test -o json,html,markdown -d ./test-results
  artifacts:
    when: always
    paths:
      - test-results/
    reports:
      junit: test-results/test-report.xml
  only:
    - merge_requests
    - main
```

### Jenkins Pipeline
```groovy
pipeline {
    agent any
    
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install -g chrome-extension-test-framework'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'cext-test -o json,html -d ./test-results'
            }
        }
        
        stage('Archive Results') {
            steps {
                archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'test-results',
                    reportFiles: 'test-report.html',
                    reportName: 'Chrome Extension Test Report'
                ])
            }
        }
    }
    
    post {
        always {
            script {
                def results = readJSON file: 'test-results/test-report.json'
                if (results.summary.failed > 0) {
                    currentBuild.result = 'FAILED'
                }
            }
        }
    }
}
```

## npm公開手順

### 1. npm アカウントの準備
```bash
# npmアカウントを作成（未作成の場合）
# https://www.npmjs.com/signup

# npmにログイン
npm login
# Username, Password, Email, OTPを入力
```

### 2. パッケージ名の確認
```bash
# パッケージ名が利用可能か確認
npm view chrome-extension-test-framework

# 404エラーが出れば利用可能
```

### 3. 公開前チェック
```bash
# package.jsonの内容を確認
cat package.json

# テストを実行
npm test

# 公開されるファイルを確認
npm pack --dry-run
```

### 4. 公開
```bash
# 初回公開
npm publish

# アクセス権限を公開に設定
npm access public chrome-extension-test-framework
```

### 5. バージョン更新時
```bash
# パッチバージョンを上げる (1.0.0 -> 1.0.1)
npm version patch

# マイナーバージョンを上げる (1.0.0 -> 1.1.0)
npm version minor

# メジャーバージョンを上げる (1.0.0 -> 2.0.0)
npm version major

# 公開
npm publish
```

## トラブルシューティング

### エラー: command not found: cext-test
```bash
# グローバルインストールの確認
npm list -g chrome-extension-test-framework

# PATHの確認
echo $PATH

# npmのグローバルディレクトリを確認
npm config get prefix

# 解決策1: npmのbinディレクトリをPATHに追加
export PATH=$PATH:$(npm config get prefix)/bin

# 解決策2: npxを使用
npx cext-test
```

### エラー: Cannot find module
```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install

# キャッシュをクリア
npm cache clean --force
```

### エラー: Permission denied
```bash
# 実行権限を付与
chmod +x node_modules/.bin/cext-test

# sudoを使わずにグローバルインストール
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g chrome-extension-test-framework
```

## パフォーマンス最適化

### 大規模プロジェクトでの使用
```javascript
// 特定のディレクトリのみをテスト
const framework = new ChromeExtensionTestFramework({
    extensionPath: './extension',
    ignore: ['test/**', 'docs/**', 'examples/**']
});

// 特定のテストスイートのみ実行
framework.addSuite(new ManifestTestSuite());  // 他のスイートは追加しない

// タイムアウトを短く設定
framework.config.timeout = 5000;  // 5秒
```

## デバッグ

### 詳細なログ出力
```bash
# NODE_DEBUGを設定
NODE_DEBUG=* cext-test

# 特定のファイルのみデバッグ
DEBUG=TestRunner cext-test
```

### プログラムでのデバッグ
```javascript
// エラーの詳細を取得
framework.on('error', (error) => {
    console.error('Error details:', error.stack);
});

// 各テストの実行を監視
framework.on('test:start', (test) => {
    console.log('Starting test:', test.name);
});

framework.on('test:end', (test, result) => {
    console.log('Test completed:', test.name, result.status);
});
```

## 高度な使用方法

### プラグインシステム
```javascript
// my-plugin.js
module.exports = function myPlugin(framework) {
    // カスタムバリデーターを追加
    framework.addValidator('custom-check', {
        validate: (manifest) => {
            return manifest.version.startsWith('1.');
        },
        message: 'Version must start with 1.x'
    });
    
    // カスタムレポーターを追加
    framework.addReporter('slack', {
        generate: async (results) => {
            // Slackに結果を送信
            await sendToSlack(results);
        }
    });
};

// 使用
const framework = new ChromeExtensionTestFramework();
framework.use(require('./my-plugin'));
```

## 技術仕様

### サポートされているNode.jsバージョン
- v12.0.0 - v12.x.x
- v14.0.0 - v14.x.x
- v16.0.0 - v16.x.x（推奨）
- v18.0.0 - v18.x.x
- v20.0.0 - v20.x.x

### ファイルシステム要件
- 読み取り権限: 必須
- 書き込み権限: レポート生成に必要
- 実行権限: bin/cli.jsに必要

### メモリ使用量
- 基本: ~50MB
- 大規模プロジェクト: ~100-200MB

### 実行時間
- 小規模拡張機能: <100ms
- 中規模拡張機能: 100-300ms
- 大規模拡張機能: 300-1000ms

## ライセンス

MIT License - 詳細はLICENSEファイルを参照