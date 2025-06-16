/**
 * Issue #32: innerHTML検出の行番号が不正確
 * このテストファイルで行番号の検出精度を検証
 */

// 行番号テスト用のコメント
// 現在の行: 7

// 10行目でinnerHTMLを使用
document.getElementById('test').innerHTML = 'テスト1';

// いくつかの空行を追加




// 17行目でinnerHTMLを使用
const elem = document.querySelector('.example');
elem.innerHTML = userInput; // 危険: ユーザー入力を直接代入

// 複数行にまたがるケース
document
    .getElementById('multi')
    .innerHTML = '<div>複数行</div>';

// 三項演算子での使用 (26行目)
const content = isAdmin ? element.innerHTML = adminContent : element.innerHTML = userContent;

// テンプレートリテラル内 (29行目)
const dangerous = `${element.innerHTML = userVariable}`;

// 関数内での使用
function updateContent() {
    // 34行目
    container.innerHTML = fetchedData;
}

// メソッドチェーン
document.body
    .querySelector('#target')
    .innerHTML = dynamicContent; // 41行目

// コメント内は無視されるべき
// element.innerHTML = 'これは検出されないはず';

/* 
 * 複数行コメント内も無視
 * element.innerHTML = 'これも検出されない';
 */

// 文字列内も無視されるべき
const code = "element.innerHTML = 'これも検出されない'";
const template = `element.innerHTML = 'これも検出されない'`;

// 安全なパターン（空文字列）
element.innerHTML = '';

// 安全なパターン（DOMPurify）
element.innerHTML = DOMPurify.sanitize(userContent);

// 安全なパターン（Chrome i18n）
element.innerHTML = chrome.i18n.getMessage('welcomeMessage');