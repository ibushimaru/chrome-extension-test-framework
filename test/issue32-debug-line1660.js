/**
 * 1660行目が検出されない問題のデバッグ
 */

const ContextAwareDetector = require('../lib/ContextAwareDetector');

// 問題の行を含むコードサンプル
const testCode = `
// Line 1658
// Line 1659
div1660.innerHTML = fetchedContent1660;
// Line 1661
`;

console.log('=== 1660行目検出デバッグ ===\n');
console.log('テストコード:');
console.log(testCode);
console.log('');

const detector = new ContextAwareDetector();

// 正規表現のテスト
const regex = /\.innerHTML\s*=\s*/g;
let match;

console.log('正規表現マッチ:');
while ((match = regex.exec(testCode)) !== null) {
    console.log(`  位置: ${match.index}, マッチ: "${match[0]}"`);
    
    // getAssignedValueのテスト
    const afterAssignment = testCode.substring(match.index);
    const valueMatch = afterAssignment.match(/=\s*([^;]+);?/);
    if (valueMatch) {
        console.log(`  代入値: "${valueMatch[1].trim()}"`);
    }
}

// 別のパターンでテスト
console.log('\n別のテストケース:');
const testCases = [
    'div1660.innerHTML = fetchedContent1660;',
    'element.innerHTML = variable;',
    'document.getElementById("test").innerHTML = data;',
    'obj.prop.innerHTML = value;'
];

testCases.forEach(code => {
    console.log(`\nコード: ${code}`);
    const issues = detector.detectUnsafeInnerHTML(code, 'test.js');
    console.log(`検出: ${issues.length > 0 ? '✅' : '❌'}`);
    if (issues.length > 0) {
        console.log(`  深刻度: ${issues[0].severity}`);
        console.log(`  代入値: ${issues[0].assignedValue}`);
    }
});