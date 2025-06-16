/**
 * ChromePatternRecognizer - Chrome拡張機能特有のパターンを認識
 * 
 * Issue #18: Framework doesn't understand Chrome extension context
 * Chrome拡張機能で一般的に使用される安全なパターンを認識し、
 * 誤検知を減らすためのモジュール
 */

class ChromePatternRecognizer {
    constructor() {
        // Chrome APIの安全なメソッド
        this.safeChromeMethods = new Set([
            'chrome.runtime.sendMessage',
            'chrome.runtime.onMessage.addListener',
            'chrome.runtime.getURL',
            'chrome.runtime.getManifest',
            'chrome.runtime.id',
            'chrome.runtime.lastError',
            'chrome.storage.sync.get',
            'chrome.storage.sync.set',
            'chrome.storage.local.get',
            'chrome.storage.local.set',
            'chrome.tabs.query',
            'chrome.tabs.sendMessage',
            'chrome.tabs.create',
            'chrome.tabs.update',
            'chrome.i18n.getMessage',
            'chrome.i18n.getUILanguage',
            'chrome.extension.getURL',
            'chrome.action.setIcon',
            'chrome.action.setBadgeText',
            'chrome.action.setBadgeBackgroundColor'
        ]);

        // メッセージパッシングの安全なパターン
        this.safeMessagePatterns = [
            // 送信者の検証
            /if\s*\(\s*sender\.tab\s*\)/,
            /if\s*\(\s*sender\.id\s*===\s*chrome\.runtime\.id\s*\)/,
            /sender\.origin\s*===\s*['"]chrome-extension:\/\//,
            /sender\.url\.startsWith\s*\(\s*chrome\.runtime\.getURL/,
            
            // メッセージタイプの検証
            /switch\s*\(\s*(?:message|msg|request)\.type\s*\)/,
            /if\s*\(\s*(?:message|msg|request)\.action\s*===/,
            /const\s+{\s*type\s*,\s*.*?\s*}\s*=\s*(?:message|msg|request)/
        ];

        // localStorage/sessionStorageの安全な使用パターン
        this.safeStoragePatterns = [
            // Chrome storage APIへの移行コメント
            /\/\/\s*TODO:\s*migrate\s*to\s*chrome\.storage/i,
            /\/\/\s*DEPRECATED:\s*use\s*chrome\.storage/i,
            
            // 一時的なデータのみ
            /localStorage\.setItem\s*\(\s*['"]temp_/,
            /localStorage\.setItem\s*\(\s*['"]cache_/,
            /sessionStorage\.setItem/,
            
            // 開発/デバッグ用
            /if\s*\(\s*(?:DEBUG|DEV|DEVELOPMENT)\s*\)\s*{[^}]*localStorage/,
            /console\.\w+\s*\(\s*.*localStorage\.getItem/
        ];

        // innerHTMLの安全な使用パターン
        this.safeInnerHTMLPatterns = [
            // DOMPurifyなどのサニタイザー使用
            /DOMPurify\.sanitize\s*\(/,
            /sanitizeHTML\s*\(/,
            /purify\s*\(/,
            
            // Chrome i18n API
            /chrome\.i18n\.getMessage\s*\(/,
            
            // 定数文字列のみ
            /innerHTML\s*=\s*['"`]\s*<(?:div|span|p|h[1-6]|ul|li|a|button)[^>]*>\s*(?:<\/|['"`])/,
            /innerHTML\s*=\s*['"`]\s*(?:<\/?\w+>|\s)*['"`]/,
            
            // テンプレートリテラルだが変数を含まない
            /innerHTML\s*=\s*`[^$]*`/,
            
            // 空文字列への設定（クリア）
            /innerHTML\s*=\s*['"`]\s*['"`]/
        ];

        // evalの例外的に許可されるパターン
        this.safeEvalPatterns = [
            // JSONパースのフォールバック（古いコード）
            /try\s*{\s*JSON\.parse.*catch.*eval\s*\(/,
            
            // 開発ツール関連
            /if\s*\(\s*chrome\.devtools\s*\)/,
            
            // テスト環境
            /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]test['"]\s*\)/
        ];

        // Chrome拡張機能特有のセキュアなパターン
        this.extensionSecurePatterns = {
            // Content Script Injection
            contentScriptInjection: [
                /chrome\.scripting\.executeScript/,
                /chrome\.tabs\.executeScript/
            ],
            
            // Web Accessible Resources
            webAccessibleResources: [
                /chrome\.runtime\.getURL\s*\(\s*['"](?:images|assets|fonts)\//,
                /manifest\.web_accessible_resources/
            ],
            
            // Host Permissions
            hostPermissions: [
                /chrome\.permissions\.request/,
                /chrome\.permissions\.contains/
            ]
        };
    }

    /**
     * Chrome APIの使用が安全かチェック
     */
    isSafeChromeAPI(code, lineContent) {
        // Chrome APIメソッドの呼び出しをチェック
        for (const method of this.safeChromeMethods) {
            if (lineContent.includes(method)) {
                return true;
            }
        }
        
        // chrome.runtime.idなどのプロパティアクセス
        if (/chrome\.\w+\.\w+(?:\.\w+)*\s*[;,\)]/.test(lineContent)) {
            return true;
        }
        
        return false;
    }

    /**
     * メッセージパッシングが安全かチェック
     */
    isSafeMessagePassing(code, position) {
        // 周辺のコードを取得（前後100文字）
        const start = Math.max(0, position - 200);
        const end = Math.min(code.length, position + 200);
        const context = code.substring(start, end);
        
        // 安全なメッセージパターンをチェック
        return this.safeMessagePatterns.some(pattern => pattern.test(context));
    }

    /**
     * localStorageの使用が安全かチェック
     */
    isSafeStorageUsage(code, lineContent, filePath) {
        // ファイルパスから判断
        if (filePath.includes('test/') || filePath.includes('spec/')) {
            return true; // テストファイルでは許可
        }
        
        // 安全なパターンをチェック
        return this.safeStoragePatterns.some(pattern => pattern.test(code));
    }

    /**
     * innerHTMLの使用が安全かチェック
     */
    isSafeInnerHTMLUsage(code, position) {
        // 代入される値を取得
        const match = code.substring(position).match(/innerHTML\s*=\s*([^;]+);/);
        if (!match) return false;
        
        const assignedValue = match[1].trim();
        
        // Chrome i18n APIの使用
        if (assignedValue.includes('chrome.i18n.getMessage')) {
            return true;
        }
        
        // 安全なパターンをチェック
        const context = code.substring(Math.max(0, position - 100), position + 200);
        return this.safeInnerHTMLPatterns.some(pattern => pattern.test(context));
    }

    /**
     * evalの使用が例外的に許可されるかチェック
     */
    isAcceptableEvalUsage(code, position, filePath) {
        // 開発/テストファイルでは警告レベルを下げる
        if (filePath.match(/\/(dev|test|spec|mock)\//)) {
            return true;
        }
        
        const context = code.substring(Math.max(0, position - 200), position + 200);
        return this.safeEvalPatterns.some(pattern => pattern.test(context));
    }

    /**
     * Chrome拡張機能のマニフェストから権限を取得
     */
    getManifestPermissions(manifest) {
        const permissions = new Set();
        
        // V3の権限
        if (manifest.permissions) {
            manifest.permissions.forEach(p => permissions.add(p));
        }
        if (manifest.optional_permissions) {
            manifest.optional_permissions.forEach(p => permissions.add(p));
        }
        if (manifest.host_permissions) {
            manifest.host_permissions.forEach(p => permissions.add('host:' + p));
        }
        
        // V2の権限（後方互換性）
        if (manifest.manifest_version === 2 && manifest.permissions) {
            manifest.permissions.forEach(p => {
                if (p.includes('://')) {
                    permissions.add('host:' + p);
                } else {
                    permissions.add(p);
                }
            });
        }
        
        return permissions;
    }

    /**
     * 使用されているChrome APIから必要な権限を推測
     */
    detectRequiredPermissions(code) {
        const requiredPermissions = new Set();
        
        // APIと権限のマッピング
        const apiPermissionMap = {
            'chrome.storage': 'storage',
            'chrome.tabs': 'tabs',
            'chrome.cookies': 'cookies',
            'chrome.history': 'history',
            'chrome.bookmarks': 'bookmarks',
            'chrome.downloads': 'downloads',
            'chrome.notifications': 'notifications',
            'chrome.contextMenus': 'contextMenus',
            'chrome.webRequest': 'webRequest',
            'chrome.webNavigation': 'webNavigation',
            'chrome.identity': 'identity',
            'chrome.management': 'management',
            'chrome.permissions': 'permissions',
            'chrome.proxy': 'proxy',
            'chrome.system': 'system.cpu',
            'chrome.tts': 'tts',
            'chrome.alarms': 'alarms',
            'chrome.gcm': 'gcm',
            'chrome.idle': 'idle',
            'chrome.power': 'power'
        };
        
        // コードからAPI使用を検出
        Object.entries(apiPermissionMap).forEach(([api, permission]) => {
            const regex = new RegExp(api.replace('.', '\\.') + '\\b');
            if (regex.test(code)) {
                requiredPermissions.add(permission);
            }
        });
        
        // 特殊なケース
        if (/chrome\.tabs\.executeScript/.test(code) || /chrome\.scripting\.executeScript/.test(code)) {
            requiredPermissions.add('activeTab');
        }
        
        if (/XMLHttpRequest|fetch\s*\(/.test(code)) {
            // ホスト権限が必要な可能性
            requiredPermissions.add('host:*');
        }
        
        return requiredPermissions;
    }

    /**
     * Chrome拡張機能のコンテキストを分析
     */
    analyzeExtensionContext(filePath, code) {
        const context = {
            type: 'unknown',
            isBackground: false,
            isContentScript: false,
            isPopup: false,
            isOptions: false,
            isDevtools: false,
            detectedAPIs: new Set(),
            securityLevel: 'standard'
        };
        
        // ファイルパスから判断
        const fileName = filePath.toLowerCase();
        if (fileName.includes('background')) {
            context.type = 'background';
            context.isBackground = true;
            context.securityLevel = 'high'; // バックグラウンドは高セキュリティ
        } else if (fileName.includes('content')) {
            context.type = 'content';
            context.isContentScript = true;
            context.securityLevel = 'medium'; // コンテンツスクリプトは中セキュリティ
        } else if (fileName.includes('popup')) {
            context.type = 'popup';
            context.isPopup = true;
        } else if (fileName.includes('options')) {
            context.type = 'options';
            context.isOptions = true;
        } else if (fileName.includes('devtools')) {
            context.type = 'devtools';
            context.isDevtools = true;
        }
        
        // 使用されているAPIを検出
        const apiPatterns = [
            /chrome\.runtime\.\w+/g,
            /chrome\.storage\.\w+/g,
            /chrome\.tabs\.\w+/g,
            /chrome\.extension\.\w+/g,
            /chrome\.\w+\.\w+/g
        ];
        
        apiPatterns.forEach(pattern => {
            const matches = code.match(pattern) || [];
            matches.forEach(api => context.detectedAPIs.add(api));
        });
        
        return context;
    }

    /**
     * セキュリティレベルに基づいた判定
     */
    shouldAllowBasedOnContext(issue, context) {
        // バックグラウンドスクリプトでは厳格に
        if (context.isBackground && issue === 'eval') {
            return false;
        }
        
        // コンテンツスクリプトでのinnerHTMLは特に注意
        if (context.isContentScript && issue === 'innerHTML') {
            return false;
        }
        
        // 開発ツールでは多少緩和
        if (context.isDevtools) {
            return ['localStorage', 'console.log'].includes(issue);
        }
        
        return false;
    }
}

module.exports = ChromePatternRecognizer;