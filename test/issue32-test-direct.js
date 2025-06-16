/**
 * Issue #32 の直接的なテスト - ContextAwareDetectorを直接使用
 */

const fs = require('fs');
const path = require('path');
const ContextAwareDetector = require('../lib/ContextAwareDetector');

async function testIssue32Direct() {
    console.log('=== Issue #32: innerHTML検出の行番号テスト（直接実行） ===\n');
    
    // popup.jsの内容を読み込む
    const popupPath = path.join(__dirname, 'real-extension-test/popup.js');
    const content = fs.readFileSync(popupPath, 'utf8');
    
    // ContextAwareDetectorのインスタンスを作成
    const detector = new ContextAwareDetector();
    
    // innerHTML検出を実行
    const issues = detector.detectUnsafeInnerHTML(content, popupPath);
    
    console.log(`検出されたinnerHTML: ${issues.length}件\n`);
    
    // 各検出結果を表示
    issues.forEach((issue, index) => {
        console.log(`[${index + 1}] 行 ${issue.line}:`);
        console.log(`    深刻度: ${issue.severity}`);
        console.log(`    コンテキスト: ${issue.context}`);
        console.log(`    代入値: ${issue.assignedValue}`);
        console.log(`    提案: ${issue.suggestion}`);
        console.log('');
    });
    
    // 期待される検出行との比較
    console.log('=== 期待される検出行 ===');
    const expectedLines = [
        { line: 6, code: "document.getElementById('status').innerHTML = message;" },
        { line: 19, code: "document.querySelector('.user-info').innerHTML = data.html;" },
        { line: 22, code: "document.getElementById('greeting').innerHTML = `Welcome, ${data.name}!`;" },
        { line: 26, code: "document.getElementById('error').innerHTML = error.message;" },
        { line: 35, code: "container.innerHTML = items.map(item =>" },
        { line: 41, code: "container.innerHTML = '<p>No items found</p>';" },
        { line: 49, code: "document.body.innerHTML = request.content;" }
    ];
    
    expectedLines.forEach(expected => {
        console.log(`行 ${expected.line}: ${expected.code}`);
    });
    
    // 検出された行番号と期待される行番号の比較
    console.log('\n=== 行番号の精度分析 ===');
    
    const detectedLines = issues.map(i => i.line).sort((a, b) => a - b);
    const expectedLineNumbers = expectedLines.map(e => e.line);
    
    console.log('検出された行番号:', detectedLines);
    console.log('期待される行番号:', expectedLineNumbers);
    
    // 差分の確認
    const missing = expectedLineNumbers.filter(line => !detectedLines.includes(line));
    const extra = detectedLines.filter(line => !expectedLineNumbers.includes(line));
    
    if (missing.length > 0) {
        console.log('\n❌ 検出されなかった行:', missing);
    }
    
    if (extra.length > 0) {
        console.log('\n⚠️  予期しない検出行:', extra);
    }
    
    if (missing.length === 0 && extra.length === 0) {
        console.log('\n✅ すべての行番号が正確に検出されました');
    }
    
    // 実際のコード行との照合
    console.log('\n=== 実際のコード行との照合 ===');
    const lines = content.split('\n');
    
    issues.forEach(issue => {
        const actualLine = lines[issue.line - 1];
        const matches = actualLine && actualLine.includes('innerHTML');
        console.log(`行 ${issue.line}: ${matches ? '✅ 正確' : '❌ 不正確'}`);
        if (!matches && actualLine) {
            console.log(`  実際の内容: "${actualLine.trim()}"`);
            console.log(`  報告された内容: "${issue.context}"`);
        }
    });
}

// テストを実行
testIssue32Direct().catch(console.error);