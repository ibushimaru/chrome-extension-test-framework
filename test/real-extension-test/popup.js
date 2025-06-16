// Chrome拡張機能のポップアップスクリプト

// 1行目から始まるテスト
function updateStatus(message) {
    // この行は5行目
    document.getElementById('status').innerHTML = message;
}

// いくつかの空行


// 12行目
async function loadUserData() {
    try {
        const response = await fetch('https://api.example.com/user');
        const data = await response.json();
        
        // 18行目: ユーザーデータを直接innerHTML
        document.querySelector('.user-info').innerHTML = data.html;
        
        // 21行目: テンプレートリテラルで動的コンテンツ
        document.getElementById('greeting').innerHTML = `Welcome, ${data.name}!`;
        
    } catch (error) {
        // 25行目: エラーメッセージ
        document.getElementById('error').innerHTML = error.message;
    }
}

// より複雑なケース
function renderList(items) {
    const container = document.getElementById('list');
    
    // 34行目: map結合でHTML生成
    container.innerHTML = items.map(item => 
        `<li>${item.title}</li>`
    ).join('');
    
    // 39行目: 条件付きレンダリング
    if (items.length === 0) {
        container.innerHTML = '<p>No items found</p>';
    }
}

// Chrome API使用例
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateContent') {
        // 48行目: メッセージからのコンテンツ
        document.body.innerHTML = request.content;
    }
});