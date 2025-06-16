/**
 * LocalInstallChecker - ローカルインストールを検出して警告を表示
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LocalInstallChecker {
    constructor() {
        this.isGloballyInstalled = this.checkGlobalInstallation();
    }

    /**
     * グローバルインストールされているかチェック
     */
    checkGlobalInstallation() {
        try {
            // npmのグローバルパッケージリストを取得
            const globalPackages = execSync('npm list -g --depth=0 2>/dev/null', { 
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            return globalPackages.includes('chrome-extension-test-framework');
        } catch (error) {
            return false;
        }
    }

    /**
     * ローカルインストールされているかチェック
     */
    checkLocalInstallation() {
        try {
            // 現在のディレクトリから上位に向かってnode_modulesを探す
            let currentDir = process.cwd();
            const root = path.parse(currentDir).root;

            while (currentDir !== root) {
                const nodeModulesPath = path.join(currentDir, 'node_modules', 'chrome-extension-test-framework');
                if (fs.existsSync(nodeModulesPath)) {
                    return true;
                }
                currentDir = path.dirname(currentDir);
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 実行方法のヒントを表示
     */
    showInstallationHint() {
        const isLocal = this.checkLocalInstallation();
        const isGlobal = this.isGloballyInstalled;

        if (isLocal && !isGlobal) {
            console.log('\n' + '⚠️ '.repeat(20));
            console.log('\n⚠️  Chrome Extension Test Framework がローカルにインストールされています');
            console.log('⚠️  CLIコマンド "cext-test" を使用するには、グローバルインストールが必要です\n');
            console.log('📦 グローバルインストール方法:');
            console.log('   npm install -g chrome-extension-test-framework\n');
            console.log('📝 または、ローカルインストールの場合は以下の方法で実行できます:');
            console.log('   npx cext-test [options]');
            console.log('   node node_modules/.bin/cext-test [options]');
            console.log('   package.json の scripts に追加して npm run で実行\n');
            console.log('💡 推奨: グローバルインストールすることで、どこからでも cext-test コマンドが使用できます');
            console.log('\n' + '⚠️ '.repeat(20) + '\n');
            return true;
        }

        return false;
    }

    /**
     * コマンドが見つからない場合のエラーメッセージ
     */
    static getCommandNotFoundMessage() {
        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ エラー: 'cext-test' コマンドが見つかりません

Chrome Extension Test Framework を使用するには、グローバルインストールが必要です:

  npm install -g chrome-extension-test-framework

インストール後、以下のコマンドで確認できます:

  cext-test --version

詳細は https://github.com/ibushimaru/chrome-extension-test-framework を参照してください

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
}

module.exports = LocalInstallChecker;