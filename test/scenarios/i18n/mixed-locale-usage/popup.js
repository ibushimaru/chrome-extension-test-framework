// 混在するローカライゼーション使用法
document.getElementById('greeting').textContent = chrome.i18n.getMessage('greeting');

// ハードコードされたメッセージ
console.log('Extension loaded');
alert('Settings saved successfully!');

// 部分的にローカライズされたメッセージ
const status = 'Status: ' + chrome.i18n.getMessage('statusActive');