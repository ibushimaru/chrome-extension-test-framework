/**
 * シンプルなテストで1660行目の問題を確認
 */

const ContextAwareDetector = require('../lib/ContextAwareDetector');

// まず小さなファイルで確認
console.log('=== 小さなファイルでのテスト ===');

const smallContent = `
line 1
line 2
div1660.innerHTML = fetchedContent1660;
line 4
`;

const detector = new ContextAwareDetector();
const smallIssues = detector.detectUnsafeInnerHTML(smallContent, 'small.js');

console.log('小さなファイルでの検出:', smallIssues.length);
if (smallIssues.length > 0) {
    console.log('行番号:', smallIssues[0].line);
    console.log('代入値:', smallIssues[0].assignedValue);
}

// 次に1660行のファイルを作成
console.log('\n=== 1660行のファイルでのテスト ===');

const lines = [];
for (let i = 1; i <= 1659; i++) {
    lines.push(`// Line ${i}`);
}
lines.push('div1660.innerHTML = fetchedContent1660;');
for (let i = 1661; i <= 1700; i++) {
    lines.push(`// Line ${i}`);
}

const largeContent = lines.join('\n');

// 行数確認
const lineCount = largeContent.split('\n').length;
console.log('総行数:', lineCount);

// 1660行目の内容を確認
const line1660 = largeContent.split('\n')[1659]; // 0ベース
console.log('1660行目の内容:', line1660);

// 検出実行
const largeIssues = detector.detectUnsafeInnerHTML(largeContent, 'large.js');

console.log('\n検出結果:', largeIssues.length, '件');
largeIssues.forEach(issue => {
    console.log(`  行 ${issue.line}: ${issue.assignedValue}`);
});

// 正規表現の直接テスト
console.log('\n=== 正規表現の直接テスト ===');
const regex = /\.innerHTML\s*=\s*/g;
let match;
let matchCount = 0;

while ((match = regex.exec(largeContent)) !== null) {
    matchCount++;
    const beforeMatch = largeContent.substring(0, match.index);
    const lineNumber = beforeMatch.split('\n').length;
    console.log(`マッチ ${matchCount}: 行 ${lineNumber}`);
}