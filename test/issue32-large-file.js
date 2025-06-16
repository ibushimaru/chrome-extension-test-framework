/**
 * Issue #32 - 大きなファイルでの行番号検出テスト
 */

const fs = require('fs');
const path = require('path');
const ContextAwareDetector = require('../lib/ContextAwareDetector');

// 2000行の大きなファイルを生成
function generateLargeFile() {
    const lines = [];
    
    // 最初の行を追加
    for (let i = 1; i <= 1412; i++) {
        lines.push(`// Line ${i}: Normal code`);
    }
    
    // 1413行目に innerHTML
    lines.push('document.getElementById("test1413").innerHTML = userInput1413;');
    
    // さらに通常のコード
    for (let i = 1414; i <= 1499; i++) {
        lines.push(`// Line ${i}: More code`);
    }
    
    // 1500行目に innerHTML
    lines.push('element1500.innerHTML = `<div>${data1500}</div>`;');
    
    // さらにコード
    for (let i = 1501; i <= 1547; i++) {
        lines.push(`// Line ${i}: Additional code`);
    }
    
    // 1548行目に innerHTML
    lines.push('container1548.innerHTML = items.map(item => `<li>${item}</li>`).join("");');
    
    // さらにコード
    for (let i = 1549; i <= 1659; i++) {
        lines.push(`// Line ${i}: Even more code`);
    }
    
    // 1660行目に innerHTML
    lines.push('div1660.innerHTML = fetchedContent1660;');
    
    // 1661-1665行目
    for (let i = 1661; i <= 1665; i++) {
        lines.push(`// Line ${i}: More code`);
    }
    
    // 1666行目に innerHTML
    lines.push('span1666.innerHTML = DOMPurify.sanitize(userContent1666);');
    
    // 最後まで埋める
    for (let i = 1667; i <= 2000; i++) {
        lines.push(`// Line ${i}: Final code`);
    }
    
    return lines.join('\n');
}

console.log('=== Issue #32 大きなファイルテスト ===\n');

const largeContent = generateLargeFile();
const detector = new ContextAwareDetector();

// innerHTML検出を実行
const issues = detector.detectUnsafeInnerHTML(largeContent, 'large-file.js');

console.log(`検出されたinnerHTML: ${issues.length}件\n`);

// 期待される行番号
const expectedLines = [1413, 1500, 1548, 1660, 1666];

// 検出結果を表示
issues.forEach((issue, index) => {
    console.log(`[${index + 1}] 行 ${issue.line}:`);
    console.log(`    深刻度: ${issue.severity}`);
    console.log(`    代入値: ${issue.assignedValue}`);
    const lineContent = largeContent.split('\n')[issue.line - 1];
    console.log(`    実際の行: ${lineContent ? lineContent.trim() : '(見つかりません)'}`);
    console.log('');
});

// 精度チェック
console.log('=== 行番号の精度チェック ===');

const detectedLines = issues.map(i => i.line).sort((a, b) => a - b);
console.log('検出された行番号:', detectedLines);
console.log('期待される行番号:', expectedLines);

// 各期待される行番号の検出状況
expectedLines.forEach(line => {
    const detected = detectedLines.includes(line);
    const actualLine = largeContent.split('\n')[line - 1];
    console.log(`\n行 ${line}: ${detected ? '✅ 検出' : '❌ 未検出'}`);
    if (actualLine) {
        console.log(`  内容: ${actualLine.trim()}`);
    }
});

// 予期しない検出
const unexpected = detectedLines.filter(line => !expectedLines.includes(line));
if (unexpected.length > 0) {
    console.log('\n⚠️  予期しない行番号での検出:', unexpected);
}