/**
 * バージョンチェッカー
 * 新しいバージョンが利用可能かチェックし、ユーザーに通知する
 */

const https = require('https');
const { execSync } = require('child_process');

class VersionChecker {
    constructor() {
        this.currentVersion = require('../package.json').version;
        this.packageName = 'chrome-extension-test-framework';
    }

    /**
     * npmレジストリから最新バージョンを取得
     */
    async getLatestVersion() {
        return new Promise((resolve) => {
            https.get(`https://registry.npmjs.org/${this.packageName}/latest`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.version);
                    } catch (e) {
                        resolve(null);
                    }
                });
            }).on('error', () => resolve(null));
        });
    }

    /**
     * バージョンを比較
     */
    compareVersions(current, latest) {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (latestParts[i] > currentParts[i]) return true;
            if (latestParts[i] < currentParts[i]) return false;
        }
        return false;
    }

    /**
     * 新機能の情報を取得
     */
    getNewFeatures(currentVersion, latestVersion) {
        const features = {
            '1.1.0': [
                '✨ プログレス表示機能',
                '✨ --verbose オプション'
            ],
            '1.2.0': [
                '✨ 詳細なエラーメッセージ（修正提案付き）',
                '✨ エラー優先度の表示（Critical/High/Medium/Low）'
            ],
            '1.3.0': [
                '✨ 自動修正機能（--fix）',
                '✨ ドライラン機能（--fix-dry-run）'
            ],
            '1.4.0': [
                '✨ ウォッチモード（--watch）',
                '✨ 並列実行（--parallel）',
                '✨ プログレスバー表示'
            ],
            '1.5.0': [
                '✨ プロファイル機能（--profile）',
                '✨ インクリメンタルテスト（--changed）',
                '✨ 設定ファイルサポート（.cextrc.json）',
                '✨ 除外設定（.cextignore）'
            ],
            '1.6.0': [
                '✨ FileSizeAnalyzer（詳細なファイルサイズ分析）',
                '✨ FileNameValidator（プラットフォーム互換性チェック）',
                '✨ DirectoryAnalyzer（ディレクトリ構造分析）'
            ],
            '1.7.0': [
                '✨ SecurityAnalyzer（APIキー・シークレット検出）',
                '✨ 安全でないストレージパターン検出',
                '✨ XSS脆弱性の高度な検出'
            ],
            '1.8.0': [
                '✨ PerformanceAnalyzer（メモリリーク検出）',
                '✨ Manifest V3完全対応',
                '✨ StorageAnalyzer（非推奨API検出）',
                '✨ chrome.action/declarativeNetRequest対応'
            ]
        };

        const newFeatures = [];
        const versions = Object.keys(features).sort();
        
        for (const version of versions) {
            if (this.compareVersions(currentVersion, version) && 
                !this.compareVersions(latestVersion, version)) {
                newFeatures.push(...features[version].map(f => `  ${f}`));
            }
        }
        
        return newFeatures;
    }

    /**
     * アップデート通知を表示
     */
    async checkAndNotify() {
        try {
            const latestVersion = await this.getLatestVersion();
            if (!latestVersion) return;

            if (this.compareVersions(this.currentVersion, latestVersion)) {
                console.log('\n' + '═'.repeat(60));
                console.log(`📢 新しいバージョンが利用可能です！`);
                console.log('═'.repeat(60));
                console.log(`現在: v${this.currentVersion} → 最新: v${latestVersion}`);
                
                const newFeatures = this.getNewFeatures(this.currentVersion, latestVersion);
                if (newFeatures.length > 0) {
                    console.log('\n🆕 新機能:');
                    newFeatures.forEach(feature => console.log(feature));
                }
                
                console.log('\n📦 アップデート方法:');
                console.log('  npm update -g chrome-extension-test-framework');
                console.log('  または');
                console.log('  npm install -g chrome-extension-test-framework@latest');
                
                // ユーザーのフィードバックに対する解決策を表示
                this.showSolutionsForCommonIssues();
                
                console.log('═'.repeat(60) + '\n');
            }
        } catch (error) {
            // バージョンチェックのエラーは静かに無視
        }
    }

    /**
     * よくある問題への解決策を表示
     */
    showSolutionsForCommonIssues() {
        console.log('\n💡 よくある問題の解決策:');
        
        // エラーメッセージが不親切
        console.log('\n1️⃣ "エラーメッセージが不親切" → v1.2.0で解決済み');
        console.log('   詳細なエラー説明と修正提案が表示されます');
        
        // false positiveが多い
        console.log('\n2️⃣ "false positiveが多い" → v1.5.0で解決済み');
        console.log('   .cextignoreファイルで除外設定が可能');
        console.log('   --profile minimalで最小限のチェックのみ実行');
        
        // 設定ファイルがない
        console.log('\n3️⃣ "設定ファイルがない" → v1.5.0で解決済み');
        console.log('   .cextrc.jsonで詳細な設定が可能');
        
        // 実行速度
        console.log('\n4️⃣ "実行速度が遅い" → v1.4.0/v1.5.0で解決済み');
        console.log('   --parallelで並列実行');
        console.log('   --changedで変更ファイルのみチェック');
        
        // 修正提案の不足
        console.log('\n5️⃣ "修正提案がない" → v1.2.0/v1.3.0で解決済み');
        console.log('   詳細な修正提案を表示');
        console.log('   --fixで自動修正も可能');
        
        // 優先度の明確化
        console.log('\n6️⃣ "優先度が不明確" → v1.2.0で解決済み');
        console.log('   Critical/High/Medium/Lowの優先度表示');
    }
}

module.exports = VersionChecker;