/**
 * ローカルインストールチェッカーのテスト
 */

const LocalInstallChecker = require('../lib/LocalInstallChecker');

console.log('🧪 LocalInstallChecker テスト開始\n');

// テスト用のチェッカーインスタンス
const checker = new LocalInstallChecker();

// グローバルインストール状態を表示
console.log('📦 インストール状態:');
console.log(`  - グローバル: ${checker.isGloballyInstalled ? '✅ インストール済み' : '❌ 未インストール'}`);
console.log(`  - ローカル: ${checker.checkLocalInstallation() ? '✅ インストール済み' : '❌ 未インストール'}\n`);

// ヒント表示テスト
console.log('💡 インストールヒント表示テスト:');
const hintShown = checker.showInstallationHint();

if (!hintShown) {
    console.log('✅ ヒントは表示されませんでした（グローバルインストール済み、またはローカルインストールなし）');
}

// コマンドが見つからない場合のメッセージテスト
console.log('\n📝 コマンドが見つからない場合のメッセージ:');
console.log(LocalInstallChecker.getCommandNotFoundMessage());

console.log('\n✅ テスト完了');