/**
 * Issue #32 の検証スクリプト
 * innerHTML検出の行番号が正確かテスト
 */

const fs = require('fs');
const path = require('path');
const ContextAwareDetector = require('../lib/ContextAwareDetector');

// テストファイルを読み込む
const testFile = path.join(__dirname, 'test-innerHTML-line-numbers.js');
const content = fs.readFileSync(testFile, 'utf8');

// 検出器を初期化
const detector = new ContextAwareDetector();

// innerHTML検出を実行
const issues = detector.detectUnsafeInnerHTML(content, testFile);

// 期待される検出結果
const expectedDetections = [
    { line: 10, safe: false, reason: '直接的な文字列代入' },
    { line: 19, safe: false, reason: 'ユーザー入力の直接代入' },
    { line: 24, safe: false, reason: '複数行にまたがる代入' },
    { line: 27, safe: false, reason: '三項演算子での使用（2箇所）' },
    { line: 30, safe: false, reason: 'テンプレートリテラル内' },
    { line: 35, safe: false, reason: '関数内での使用' },
    { line: 41, safe: false, reason: 'メソッドチェーン' }
];

console.log('=== Issue #32: innerHTML検出の行番号テスト ===\n');

// 検出結果を表示
console.log(`検出された問題: ${issues.length}件\n`);

issues.forEach((issue, index) => {
    console.log(`[${index + 1}] 行 ${issue.line}:`);
    console.log(`    メッセージ: ${issue.message}`);
    console.log(`    コンテキスト: ${issue.context}`);
    console.log(`    深刻度: ${issue.severity}`);
    console.log('');
});

// 期待される行番号との比較
console.log('\n=== 行番号の精度チェック ===\n');

const detectedLines = issues.map(i => i.line).sort((a, b) => a - b);
console.log('検出された行番号:', detectedLines);

// 実際のファイル内容で確認
const lines = content.split('\n');
console.log('\n=== 実際のファイル内容（該当行のみ） ===\n');

detectedLines.forEach(lineNum => {
    if (lineNum <= lines.length) {
        console.log(`行 ${lineNum}: ${lines[lineNum - 1].trim()}`);
    }
});

// Issue #32 の問題を再現できるか確認
console.log('\n=== Issue #32 の診断 ===\n');

// 正確性のチェック
let accuracyIssues = [];

issues.forEach(issue => {
    const actualLine = lines[issue.line - 1];
    if (!actualLine || !actualLine.includes('innerHTML')) {
        accuracyIssues.push({
            reportedLine: issue.line,
            actualContent: actualLine ? actualLine.trim() : '(行が存在しない)',
            issue: '報告された行にinnerHTMLが含まれていない'
        });
    }
});

if (accuracyIssues.length > 0) {
    console.log('❌ 行番号の不正確な検出が見つかりました:');
    accuracyIssues.forEach(issue => {
        console.log(`   行 ${issue.reportedLine}: ${issue.issue}`);
        console.log(`   実際の内容: "${issue.actualContent}"`);
    });
} else {
    console.log('✅ すべての検出で行番号が正確でした');
}

// コメントや文字列内の誤検出チェック
const falsePositives = issues.filter(issue => {
    const line = lines[issue.line - 1];
    return line && (line.trim().startsWith('//') || line.includes('/*') || line.includes('"element.innerHTML'));
});

if (falsePositives.length > 0) {
    console.log('\n❌ コメントまたは文字列内での誤検出:');
    falsePositives.forEach(fp => {
        console.log(`   行 ${fp.line}: ${lines[fp.line - 1].trim()}`);
    });
} else {
    console.log('\n✅ コメントと文字列内の検出は正しく除外されています');
}