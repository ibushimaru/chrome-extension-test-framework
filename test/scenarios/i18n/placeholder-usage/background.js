// プレースホルダーの使用例
const userName = 'Alice';
const welcomeMessage = chrome.i18n.getMessage('welcomeUser', userName);
console.log(welcomeMessage);

const count = 10;
const itemType = 'notifications';
const countMessage = chrome.i18n.getMessage('itemCount', [count, itemType]);
console.log(countMessage);

// 不正なプレースホルダー使用
const invalidMessage = chrome.i18n.getMessage('invalidPlaceholder', 'value');
console.log(invalidMessage);