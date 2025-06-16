/**
 * ImprovedErrorMessages - 具体的で実用的なエラーメッセージ
 * 
 * エラーメッセージをより分かりやすく、
 * 具体的な解決方法を提示するモジュール
 */

class ImprovedErrorMessages {
    constructor() {
        // エラータイプごとのメッセージテンプレート
        this.messageTemplates = {
            // セキュリティ関連
            'unsafe-innerHTML': {
                message: 'Unsafe innerHTML assignment detected',
                detailed: 'Direct assignment to innerHTML with user-controlled data can lead to XSS vulnerabilities',
                solutions: [
                    'Use textContent for plain text content',
                    'Use DOMPurify.sanitize() for HTML content',
                    'Use chrome.i18n.getMessage() for localized strings',
                    'Create DOM elements programmatically with createElement()'
                ],
                example: `// Bad:
element.innerHTML = userInput;

// Good:
element.textContent = userInput; // For plain text
element.innerHTML = DOMPurify.sanitize(userInput); // For HTML
element.innerHTML = chrome.i18n.getMessage('key'); // For i18n`
            },

            'eval': {
                message: 'Use of eval() detected',
                detailed: 'eval() executes arbitrary code and is a major security risk in Chrome extensions',
                solutions: [
                    'Use JSON.parse() for parsing JSON data',
                    'Use Function constructor only if absolutely necessary',
                    'Refactor code to avoid dynamic code execution',
                    'Use chrome.scripting.executeScript() for content script injection'
                ],
                example: `// Bad:
const result = eval(codeString);

// Good:
const data = JSON.parse(jsonString);
// Or use chrome.scripting for dynamic scripts:
chrome.scripting.executeScript({
  target: {tabId: tab.id},
  func: myFunction
});`
            },

            'localStorage': {
                message: 'localStorage usage detected',
                detailed: 'localStorage is not recommended for Chrome extensions. Use chrome.storage API instead',
                solutions: [
                    'Use chrome.storage.local for local storage',
                    'Use chrome.storage.sync for synced storage',
                    'Use chrome.storage.session for temporary storage',
                    'Encrypt sensitive data before storing'
                ],
                example: `// Bad:
localStorage.setItem('key', value);
const value = localStorage.getItem('key');

// Good:
chrome.storage.local.set({key: value});
chrome.storage.local.get(['key'], (result) => {
  console.log(result.key);
});`
            },

            'hardcoded-secret': {
                message: 'Hardcoded secret detected',
                detailed: 'Secrets should never be hardcoded in source code',
                solutions: [
                    'Use environment variables during build',
                    'Store secrets in a secure backend service',
                    'Use OAuth2 flow for API authentication',
                    'Implement proper key management'
                ],
                example: `// Bad:
const API_KEY = 'sk_live_abcd1234';

// Good:
// 1. Use OAuth2:
chrome.identity.getAuthToken({interactive: true}, (token) => {
  // Use token for API calls
});

// 2. Or fetch from secure backend:
const response = await fetch('https://your-backend.com/api/get-key', {
  headers: {'Authorization': 'Bearer ' + userToken}
});`
            },

            'missing-permission': {
                message: 'Required permission missing',
                detailed: 'The extension uses an API that requires a permission not declared in manifest.json',
                solutions: [
                    'Add the required permission to manifest.json',
                    'Use optional_permissions for runtime permissions',
                    'Check if the API is available before using it',
                    'Use alternative APIs that don\'t require permissions'
                ],
                example: `// manifest.json:
{
  "permissions": [
    "storage",
    "tabs"
  ],
  "optional_permissions": [
    "cookies",
    "history"
  ]
}

// Check permission before use:
chrome.permissions.contains({
  permissions: ['cookies']
}, (result) => {
  if (result) {
    // Use the API
  } else {
    // Request permission or use alternative
  }
});`
            },

            'console': {
                message: 'Console statement detected',
                detailed: 'Console statements should be removed from production code',
                solutions: [
                    'Remove console statements before release',
                    'Use a build tool to strip console statements',
                    'Implement a proper logging system',
                    'Use conditional logging for development'
                ],
                example: `// Bad:
console.log('Debug info:', data);

// Good:
// 1. Conditional logging:
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// 2. Custom logger:
class Logger {
  static log(...args) {
    if (isDevelopment) console.log(...args);
  }
}

// 3. Build-time removal with Terser/webpack`
            },

            'insecure-message-passing': {
                message: 'Insecure message passing detected',
                detailed: 'Message sender is not properly verified, allowing potential spoofing',
                solutions: [
                    'Always verify the sender in message listeners',
                    'Check sender.id against chrome.runtime.id',
                    'Validate sender.origin for web pages',
                    'Use specific message types/actions'
                ],
                example: `// Bad:
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // No sender verification!
  processMessage(request);
});

// Good:
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Verify sender
  if (sender.id !== chrome.runtime.id) return;
  
  // Validate message structure
  if (!request.type || !request.data) return;
  
  // Process based on type
  switch (request.type) {
    case 'GET_DATA':
      // Handle specific action
      break;
  }
});`
            },

            'csp-violation': {
                message: 'Content Security Policy violation',
                detailed: 'The code violates Chrome extension CSP restrictions',
                solutions: [
                    'Remove inline scripts and styles',
                    'Move JavaScript to external files',
                    'Use addEventListener instead of onclick',
                    'Avoid unsafe-eval and unsafe-inline'
                ],
                example: `<!-- Bad: -->
<button onclick="handleClick()">Click</button>
<script>function handleClick() {}</script>

<!-- Good: -->
<button id="myButton">Click</button>
<script src="popup.js"></script>

// popup.js:
document.getElementById('myButton').addEventListener('click', handleClick);`
            }
        };

        // コンテキスト別の追加情報
        this.contextualInfo = {
            'background-script': {
                tips: [
                    'Background scripts run in a privileged context',
                    'Use service workers in Manifest V3',
                    'Avoid DOM manipulation in background scripts',
                    'Use chrome.action API instead of browserAction/pageAction'
                ]
            },
            'content-script': {
                tips: [
                    'Content scripts run in web page context',
                    'Use chrome.runtime.sendMessage for communication',
                    'Be careful with page DOM manipulation',
                    'Isolate your code from the page\'s JavaScript'
                ]
            },
            'popup': {
                tips: [
                    'Popup scripts have limited lifetime',
                    'Save state before popup closes',
                    'Use chrome.storage for persistence',
                    'Keep initialization fast'
                ]
            }
        };
    }

    /**
     * エラーメッセージを改善
     */
    improve(issue, context = {}) {
        const template = this.messageTemplates[issue.type];
        if (!template) {
            return this.createGenericMessage(issue);
        }

        const improved = {
            ...issue,
            message: template.message,
            detailed: template.detailed,
            solutions: template.solutions,
            example: template.example
        };

        // コンテキストに基づく追加情報
        if (context.fileType && this.contextualInfo[context.fileType]) {
            improved.contextTips = this.contextualInfo[context.fileType].tips;
        }

        // 具体的なコード位置の情報
        if (issue.context) {
            improved.codeContext = this.formatCodeContext(issue.context, issue.line, issue.column);
        }

        // 関連リンク
        improved.references = this.getReferences(issue.type);

        return improved;
    }

    /**
     * 汎用的なメッセージを生成
     */
    createGenericMessage(issue) {
        return {
            ...issue,
            message: issue.message || `Issue detected: ${issue.type}`,
            detailed: 'This issue may affect your extension\'s functionality or security',
            solutions: [
                'Review the code at the specified location',
                'Consult Chrome extension documentation',
                'Follow best practices for Chrome extensions'
            ],
            references: [
                'https://developer.chrome.com/docs/extensions/mv3/'
            ]
        };
    }

    /**
     * コードコンテキストをフォーマット
     */
    formatCodeContext(context, line, column) {
        const lines = context.split('\n');
        const formatted = lines.map((lineContent, index) => {
            const lineNum = line - Math.floor(lines.length / 2) + index;
            const isErrorLine = index === Math.floor(lines.length / 2);
            const prefix = isErrorLine ? '>' : ' ';
            
            let formattedLine = `${prefix} ${lineNum}: ${lineContent}`;
            
            // エラー位置を示す
            if (isErrorLine && column) {
                const spaces = ' '.repeat(prefix.length + lineNum.toString().length + 2 + column - 1);
                formattedLine += '\n' + spaces + '^';
            }
            
            return formattedLine;
        }).join('\n');

        return formatted;
    }

    /**
     * 参考リンクを取得
     */
    getReferences(issueType) {
        const references = {
            'unsafe-innerHTML': [
                'https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations',
                'https://github.com/cure53/DOMPurify'
            ],
            'localStorage': [
                'https://developer.chrome.com/docs/extensions/reference/storage/',
                'https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#storage'
            ],
            'eval': [
                'https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#remotely-hosted-code',
                'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!'
            ],
            'console': [
                'https://developer.chrome.com/docs/extensions/mv3/service_workers/#debugging'
            ],
            'missing-permission': [
                'https://developer.chrome.com/docs/extensions/mv3/declare_permissions/',
                'https://developer.chrome.com/docs/extensions/reference/permissions/'
            ],
            'csp-violation': [
                'https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy'
            ]
        };

        return references[issueType] || [
            'https://developer.chrome.com/docs/extensions/mv3/'
        ];
    }

    /**
     * 修正の難易度を評価
     */
    assessFixDifficulty(issue) {
        const difficulties = {
            'console': 'easy',        // 単純な削除
            'localStorage': 'medium', // APIの置き換え
            'eval': 'hard',          // ロジックの再設計が必要
            'unsafe-innerHTML': 'medium',
            'hardcoded-secret': 'hard',
            'missing-permission': 'easy'
        };

        return difficulties[issue.type] || 'medium';
    }

    /**
     * 自動修正可能かどうか
     */
    isAutoFixable(issue) {
        const autoFixable = [
            'console',           // 削除可能
            'missing-permission', // manifest.jsonに追加可能
            'trailing-spaces',   // 自動フォーマット可能
            'quotes'            // 引用符の統一
        ];

        return autoFixable.includes(issue.type);
    }

    /**
     * バッチメッセージを生成（複数の同じタイプのエラー）
     */
    createBatchMessage(issues) {
        if (issues.length === 0) return null;

        const type = issues[0].type;
        const template = this.messageTemplates[type];

        return {
            type: type,
            count: issues.length,
            message: `${issues.length} instances of ${template?.message || type}`,
            detailed: template?.detailed,
            locations: issues.map(i => ({
                file: i.file,
                line: i.line,
                column: i.column
            })),
            solutions: template?.solutions || [],
            example: template?.example
        };
    }
}

module.exports = ImprovedErrorMessages;