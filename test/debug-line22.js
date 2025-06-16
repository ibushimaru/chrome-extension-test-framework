/**
 * 行22のテンプレートリテラル検出問題をデバッグ
 */

const fs = require('fs');
const path = require('path');

// テストコード
const testCode = `
// 21行目: テンプレートリテラルで動的コンテンツ  
document.getElementById('greeting').innerHTML = \`Welcome, \${data.name}!\`;
`;

// 正規表現でマッチを確認
const regex = /\.innerHTML\s*=\s*/g;
let match;

console.log('=== 正規表現マッチテスト ===');
console.log('テストコード:', testCode.trim());
console.log('');

while ((match = regex.exec(testCode)) !== null) {
    console.log('マッチ位置:', match.index);
    console.log('マッチ内容:', match[0]);
    
    // getAssignedValueのロジックを再現
    const afterAssignment = testCode.substring(match.index);
    const valueMatch = afterAssignment.match(/=\s*([^;]+);?/);
    if (valueMatch) {
        console.log('代入値:', valueMatch[1].trim());
    }
}

// popup.js全体でテスト
console.log('\n=== popup.js全体での検証 ===');
const popupPath = path.join(__dirname, 'real-extension-test/popup.js');
const content = fs.readFileSync(popupPath, 'utf8');
const lines = content.split('\n');

// 22行目周辺を表示
console.log('\n22行目周辺のコード:');
for (let i = 19; i < 25; i++) {
    if (i < lines.length) {
        console.log(`${i + 1}: ${lines[i]}`);
    }
}

// ContextAwareDetectorと同じロジックで検出
const ContextAwareDetector = require('../lib/ContextAwareDetector');
const detector = new ContextAwareDetector();

console.log('\n=== ContextAwareDetectorでの検出 ===');
const issues = detector.detectUnsafeInnerHTML(content, popupPath);

// 22行目付近の検出を探す
const line22Issues = issues.filter(i => i.line >= 20 && i.line <= 24);
console.log(`20-24行目の検出数: ${line22Issues.length}`);

if (line22Issues.length === 0) {
    console.log('\n22行目が検出されない理由を調査中...');
    
    // isSafeInnerHTMLAssignmentの判定を確認
    const testValue = '`Welcome, ${data.name}!`';
    const isSafe = detector.isSafeInnerHTMLAssignment(testValue, content);
    console.log(`代入値 "${testValue}" は安全と判定: ${isSafe}`);
    
    // 各安全パターンをチェック
    console.log('\n安全パターンのチェック:');
    console.log('- 空文字列:', testValue === '""' || testValue === "''" || testValue === '``');
    console.log('- サニタイザー:', /DOMPurify\.sanitize|sanitizeHTML|purify\(/.test(testValue));
    console.log('- Chrome i18n:', testValue.includes('chrome.i18n.getMessage'));
    console.log('- 定数文字列（HTMLタグなし）:', /^['"`][^'"`<>]*['"`]$/.test(testValue));
    
    // 深刻度の確認
    const severity = detector.getInnerHTMLSeverity(testValue, popupPath);
    console.log(`\n深刻度: ${severity}`);
}

// ChromePatternRecognizerのチェック
const ChromePatternRecognizer = require('../lib/ChromePatternRecognizer');
const chromeRecognizer = new ChromePatternRecognizer();

console.log('\n=== ChromePatternRecognizerのチェック ===');
// 22行目の位置を見つける
const line22Start = lines.slice(0, 21).join('\n').length + 1;
const line22Match = content.substring(line22Start).match(/\.innerHTML\s*=\s*/);
if (line22Match) {
    const position = line22Start + line22Match.index;
    const isSafe = chromeRecognizer.isSafeInnerHTMLUsage(content, position);
    console.log(`ChromePatternRecognizerで安全と判定: ${isSafe}`);
}