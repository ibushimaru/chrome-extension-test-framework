/**
 * Issue #32 の直接的なテスト
 * SecurityTestSuite の innerHTML 検出の行番号を検証
 */

const path = require('path');
const SecurityTestSuite = require('../suites/SecurityTestSuite');

async function testIssue32() {
    console.log('=== Issue #32: innerHTML検出の行番号テスト ===\n');
    
    // SecurityTestSuiteのインスタンスを作成
    const suite = new SecurityTestSuite();
    
    // テスト用の設定
    const config = {
        extensionPath: path.join(__dirname, 'real-extension-test'),
        exclude: ['node_modules/**', '*.test.js'],
        severity: {
            innerHTML: 'error'
        }
    };
    
    try {
        // セキュリティテストを実行
        const results = await suite.run(config);
        
        // innerHTML関連の結果だけを抽出
        const innerHTMLResults = results.filter(r => 
            r.message && r.message.toLowerCase().includes('innerhtml')
        );
        
        console.log(`innerHTML関連の検出: ${innerHTMLResults.length}件\n`);
        
        // 各検出結果を表示
        innerHTMLResults.forEach((result, index) => {
            console.log(`[${index + 1}] ${result.file}:`);
            console.log(`    行番号: ${result.line || 'なし'}`);
            console.log(`    メッセージ: ${result.message}`);
            console.log(`    深刻度: ${result.severity}`);
            if (result.context) {
                console.log(`    コンテキスト: ${result.context}`);
            }
            console.log('');
        });
        
        // popup.js の実際の行番号と比較
        console.log('=== 期待される検出行 ===');
        const expectedLines = [
            { line: 6, desc: "document.getElementById('status').innerHTML = message;" },
            { line: 19, desc: "document.querySelector('.user-info').innerHTML = data.html;" },
            { line: 22, desc: "document.getElementById('greeting').innerHTML = `Welcome, ${data.name}!`;" },
            { line: 26, desc: "document.getElementById('error').innerHTML = error.message;" },
            { line: 35, desc: "container.innerHTML = items.map(...).join('');" },
            { line: 41, desc: "container.innerHTML = '<p>No items found</p>';" },
            { line: 49, desc: "document.body.innerHTML = request.content;" }
        ];
        
        expectedLines.forEach(expected => {
            console.log(`行 ${expected.line}: ${expected.desc}`);
        });
        
        // 行番号の精度チェック
        console.log('\n=== 行番号精度の分析 ===');
        
        const detectedLines = innerHTMLResults
            .filter(r => r.line)
            .map(r => r.line)
            .sort((a, b) => a - b);
            
        console.log('検出された行番号:', detectedLines);
        
        // ファイル内容を読み込んで確認
        const fs = require('fs');
        const popupContent = fs.readFileSync(path.join(__dirname, 'real-extension-test/popup.js'), 'utf8');
        const lines = popupContent.split('\n');
        
        // 検出された行の内容を確認
        console.log('\n=== 検出された行の実際の内容 ===');
        detectedLines.forEach(lineNum => {
            if (lineNum <= lines.length) {
                console.log(`行 ${lineNum}: ${lines[lineNum - 1].trim()}`);
            }
        });
        
    } catch (error) {
        console.error('テスト実行エラー:', error);
        console.error(error.stack);
    }
}

// テストを実行
testIssue32().catch(console.error);