// コンテンツスクリプトでのハードコードされたテキスト
console.log('Content script injected');

// ハードコードされたDOM操作
const div = document.createElement('div');
div.textContent = 'This extension is active';
div.style.cssText = 'position: fixed; top: 10px; right: 10px; background: yellow;';
document.body.appendChild(div);