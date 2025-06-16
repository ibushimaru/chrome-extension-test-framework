#!/usr/bin/env node

/**
 * postinstall.js - インストール後の処理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CLIファイルのパーミッション修正
const cliPath = path.join(__dirname, '..', 'bin', 'cli.js');
if (fs.existsSync(cliPath)) {
    try {
        fs.chmodSync(cliPath, '755');
        console.log('✅ CLI実行権限を設定しました');
    } catch (error) {
        console.error('⚠️  CLI実行権限の設定に失敗しました:', error.message);
    }
}

// グローバルインストールかどうかをチェック
function isGlobalInstall() {
    // npm_config_globalがtrueの場合、グローバルインストール
    if (process.env.npm_config_global === 'true') {
        return true;
    }
    
    // インストールパスにnpm/node_modules/が含まれる場合
    const installPath = process.cwd();
    if (installPath.includes(path.join('npm', 'node_modules')) || 
        installPath.includes(path.join('npm', 'lib', 'node_modules'))) {
        return true;
    }
    
    return false;
}

// ローカルインストールの場合に警告を表示
if (!isGlobalInstall()) {
    console.log('\n' + '='.repeat(70));
    console.log('📦 Chrome Extension Test Framework がインストールされました');
    console.log('='.repeat(70));
    console.log('\n⚠️  ローカルインストールが検出されました\n');
    console.log('CLIコマンド "cext-test" を使用するには、以下のいずれかの方法で実行してください:\n');
    console.log('  1️⃣  npx を使用:');
    console.log('     npx cext-test [オプション]\n');
    console.log('  2️⃣  package.json の scripts に追加:');
    console.log('     "scripts": {');
    console.log('       "test:extension": "cext-test"');
    console.log('     }');
    console.log('     その後: npm run test:extension\n');
    console.log('  3️⃣  グローバルインストール（推奨）:');
    console.log('     npm install -g chrome-extension-test-framework');
    console.log('     その後: cext-test [オプション]\n');
    console.log('詳細は README.md を参照してください');
    console.log('='.repeat(70) + '\n');
} else {
    console.log('\n✅ Chrome Extension Test Framework がグローバルにインストールされました');
    console.log('📝 使い方: cext-test --help\n');
}