/**
 * ContextAwareDetector - コンテキストを考慮した検出
 * 
 * Issue #9: Too many false positives
 * コードのコンテキストを理解して、誤検知を減らすためのモジュール
 */

const ChromePatternRecognizer = require('./ChromePatternRecognizer');

class ContextAwareDetector {
    constructor() {
        // Chrome拡張機能パターン認識器
        this.chromeRecognizer = new ChromePatternRecognizer();
        
        // 安全なパターンのリスト
        this.safePatterns = {
            innerHTML: [
                // 空文字列への設定
                /innerHTML\s*=\s*['"]\s*['"]/,
                // DOMPurifyなどのサニタイザー
                /DOMPurify\.sanitize/,
                // Chrome i18n API
                /chrome\.i18n\.getMessage/
            ],
            localStorage: [
                // 開発環境チェック
                /if\s*\(.*NODE_ENV.*development.*\)/,
                // フォールバック処理
                /\|\|\s*localStorage/,
                // try-catch内
                /try\s*{[^}]*localStorage/
            ]
        };
    }

    /**
     * コメント内かどうかチェック
     */
    isInComment(content, position) {
        // 行の開始位置を見つける
        const lineStart = content.lastIndexOf('\n', position) + 1;
        const lineEnd = content.indexOf('\n', position);
        const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        
        // 単一行コメント
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1 && commentIndex < position - lineStart) {
            return true;
        }
        
        // 複数行コメント
        const beforePosition = content.substring(0, position);
        const lastCommentStart = beforePosition.lastIndexOf('/*');
        const lastCommentEnd = beforePosition.lastIndexOf('*/');
        
        return lastCommentStart > lastCommentEnd;
    }

    /**
     * 文字列リテラル内かどうかチェック
     */
    isInStringLiteral(content, position) {
        const beforePosition = content.substring(0, position);
        
        // 各種クォートの開閉をカウント
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplate = false;
        let escaped = false;
        
        for (let i = 0; i < beforePosition.length; i++) {
            const char = beforePosition[i];
            
            if (char === '\\' && !escaped) {
                escaped = true;
                continue;
            }
            
            if (!escaped) {
                if (char === "'" && !inDoubleQuote && !inTemplate) {
                    inSingleQuote = !inSingleQuote;
                } else if (char === '"' && !inSingleQuote && !inTemplate) {
                    inDoubleQuote = !inDoubleQuote;
                } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
                    inTemplate = !inTemplate;
                }
            }
            
            escaped = false;
        }
        
        return inSingleQuote || inDoubleQuote || inTemplate;
    }

    /**
     * 行番号を取得
     */
    getLineNumber(content, position) {
        return content.substring(0, position).split('\n').length;
    }

    /**
     * 列番号を取得
     */
    getColumnNumber(content, position) {
        const lineStart = content.lastIndexOf('\n', position) + 1;
        return position - lineStart + 1;
    }

    /**
     * 行の内容を取得
     */
    getLineContent(content, position) {
        const lineStart = content.lastIndexOf('\n', position) + 1;
        const lineEnd = content.indexOf('\n', position);
        return content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
    }

    /**
     * 代入される値を取得
     */
    getAssignedValue(content, position) {
        const afterAssignment = content.substring(position);
        const match = afterAssignment.match(/=\s*([^;]+);?/);
        return match ? match[1].trim() : '';
    }

    /**
     * innerHTMLの検出
     */
    detectUnsafeInnerHTML(content, filePath) {
        const issues = [];
        const regex = /\.innerHTML\s*=\s*/g;
        let match;
        
        // ファイルのコンテキストを分析
        const extensionContext = this.chromeRecognizer.analyzeExtensionContext(filePath, content);
        
        while ((match = regex.exec(content)) !== null) {
            const position = match.index;
            const lineNumber = this.getLineNumber(content, position);
            const lineContent = this.getLineContent(content, position);
            
            // コンテキストをチェック
            if (this.isInComment(content, position)) {
                continue;
            }
            
            if (this.isInStringLiteral(content, position)) {
                continue;
            }
            
            // Chrome拡張機能の安全なパターンかチェック
            if (this.chromeRecognizer.isSafeInnerHTMLUsage(content, position)) {
                continue;
            }
            
            // 代入される値を取得
            const assignedValue = this.getAssignedValue(content, position);
            
            // 安全なパターンかチェック
            const isSafe = this.isSafeInnerHTMLAssignment(assignedValue, content);
            const severity = this.getInnerHTMLSeverity(assignedValue, filePath, extensionContext);
            
            if (!isSafe && severity !== 'ignore') {
                issues.push({
                    type: 'innerHTML',
                    severity: severity,
                    line: lineNumber,
                    column: this.getColumnNumber(content, position),
                    message: `Potentially unsafe innerHTML assignment`,
                    context: lineContent.trim(),
                    assignedValue: assignedValue,
                    suggestion: 'Consider using textContent or a sanitization library like DOMPurify',
                    extensionContext: extensionContext.type
                });
            }
        }
        
        return issues;
    }

    /**
     * innerHTMLの代入が安全かどうか判定
     */
    isSafeInnerHTMLAssignment(assignedValue, content) {
        // 空文字列
        if (assignedValue === '""' || assignedValue === "''" || assignedValue === '``') {
            return true;
        }
        
        // DOMPurifyなどのサニタイザー
        if (/DOMPurify\.sanitize|sanitizeHTML|purify\(/.test(assignedValue)) {
            return true;
        }
        
        // Chrome i18n API
        if (assignedValue.includes('chrome.i18n.getMessage')) {
            return true;
        }
        
        // 定数文字列（HTMLタグを含まない）
        if (/^['"`][^'"`<>]*['"`]$/.test(assignedValue)) {
            return true;
        }
        
        return false;
    }

    /**
     * innerHTMLの深刻度を判定
     */
    getInnerHTMLSeverity(assignedValue, filePath, extensionContext = {}) {
        // Chrome拡張機能のコンテキストに基づく判定
        if (extensionContext.isContentScript) {
            // コンテンツスクリプトでは厳しく判定
            if (assignedValue.includes('${') || /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(assignedValue)) {
                return 'high';
            }
        }
        
        // Chrome i18n APIの使用は安全
        if (assignedValue.includes('chrome.i18n.getMessage')) {
            return 'ignore';
        }
        
        // テンプレートリテラルで動的な値
        if (assignedValue.includes('${')) {
            return 'high';
        }
        
        // 変数の直接代入
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(assignedValue)) {
            return 'high';
        }
        
        // 関数呼び出しの結果
        if (assignedValue.includes('(') && assignedValue.includes(')')) {
            // DOMPurifyなどのサニタイザー
            if (/(?:DOMPurify|sanitize|purify)/.test(assignedValue)) {
                return 'ignore';
            }
            return 'medium';
        }
        
        // 文字列リテラル
        if (/^['"`].*['"`]$/.test(assignedValue)) {
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * localStorageの検出
     */
    detectLocalStorageUsage(content, filePath) {
        const issues = [];
        const regex = /localStorage\.(getItem|setItem)\s*\(/g;
        let match;
        
        // ファイルのコンテキストを分析
        const extensionContext = this.chromeRecognizer.analyzeExtensionContext(filePath, content);
        
        while ((match = regex.exec(content)) !== null) {
            const position = match.index;
            const lineNumber = this.getLineNumber(content, position);
            const lineContent = this.getLineContent(content, position);
            const method = match[1];
            
            // コンテキストをチェック
            if (this.isInComment(content, position)) {
                continue;
            }
            
            if (this.isInStringLiteral(content, position)) {
                continue;
            }
            
            // Chrome拡張機能の安全なパターンかチェック
            if (this.chromeRecognizer.isSafeStorageUsage(content, lineContent, filePath)) {
                continue;
            }
            
            const severity = this.getLocalStorageSeverity(content, position, filePath, extensionContext);
            
            if (severity !== 'ignore') {
                issues.push({
                    type: 'localStorage',
                    severity: severity,
                    line: lineNumber,
                    column: this.getColumnNumber(content, position),
                    message: `Use of localStorage.${method}`,
                    context: lineContent.trim(),
                    suggestion: 'Consider using chrome.storage API for Chrome extensions',
                    extensionContext: extensionContext.type
                });
            }
        }
        
        return issues;
    }

    /**
     * localStorageの深刻度を判定
     */
    getLocalStorageSeverity(content, position, filePath, extensionContext = {}) {
        // ファイル名に基づく判定
        if (filePath.includes('test') || filePath.includes('spec')) {
            return 'ignore';
        }
        
        // Chrome拡張機能のコンテキストに基づく判定
        if (extensionContext.isBackground) {
            // バックグラウンドでのlocalStorage使用は非推奨
            return 'high';
        }
        
        if (extensionContext.isContentScript) {
            // コンテンツスクリプトでは使用不可
            return 'high';
        }
        
        // 周辺のコードを確認
        const context = content.substring(Math.max(0, position - 200), position + 200);
        
        // 開発環境のチェック
        if (/if\s*\(.*(?:DEBUG|DEV|development).*\)/.test(context)) {
            return 'low';
        }
        
        // try-catch内
        if (/try\s*{[^}]*localStorage/.test(context)) {
            return 'low';
        }
        
        // chrome.storage への移行コメント
        if (/\/\/.*(?:TODO|FIXME).*chrome\.storage/.test(context)) {
            return 'medium';
        }
        
        // ポップアップやオプションページでは警告レベル
        if (extensionContext.isPopup || extensionContext.isOptions) {
            return 'medium';
        }
        
        return 'medium';
    }

    /**
     * console使用の検出
     */
    detectConsoleUsage(content, filePath) {
        const issues = [];
        const regex = /console\.(log|error|warn|info|debug)\s*\(/g;
        let match;
        
        // ファイルのコンテキストを分析
        const extensionContext = this.chromeRecognizer.analyzeExtensionContext(filePath, content);
        
        while ((match = regex.exec(content)) !== null) {
            const position = match.index;
            const lineNumber = this.getLineNumber(content, position);
            const lineContent = this.getLineContent(content, position);
            const method = match[1];
            
            // コンテキストをチェック
            if (this.isInComment(content, position)) {
                continue;
            }
            
            if (this.isInStringLiteral(content, position)) {
                continue;
            }
            
            // Chrome拡張機能では、エラーハンドリングのためのconsole.errorは許可
            if (method === 'error' && this.isErrorHandling(content, position)) {
                continue;
            }
            
            const severity = this.getConsoleSeverity(content, position, method, filePath, extensionContext);
            
            if (severity !== 'ignore') {
                issues.push({
                    type: 'console',
                    severity: severity,
                    line: lineNumber,
                    column: this.getColumnNumber(content, position),
                    message: `console.${method} usage detected`,
                    context: lineContent.trim(),
                    suggestion: 'Remove console statements from production code',
                    extensionContext: extensionContext.type
                });
            }
        }
        
        return issues;
    }

    /**
     * consoleの深刻度を判定
     */
    getConsoleSeverity(content, position, method, filePath, extensionContext = {}) {
        // エラーハンドリングのconsole.errorは許可
        if (method === 'error') {
            const context = content.substring(Math.max(0, position - 100), position);
            if (/catch\s*\([^)]*\)\s*{/.test(context)) {
                return 'ignore';
            }
            // Chrome拡張機能のエラーハンドリング
            if (/chrome\.runtime\.lastError/.test(context)) {
                return 'ignore';
            }
        }
        
        // 開発ファイル
        if (filePath.match(/\.(dev|test|spec)\./)) {
            return 'ignore';
        }
        
        // 開発ツールページでは許可
        if (extensionContext.isDevtools) {
            return 'ignore';
        }
        
        // デバッグ条件
        const context = content.substring(Math.max(0, position - 200), position + 50);
        if (/if\s*\(.*(?:DEBUG|DEV|development).*\)/.test(context)) {
            return 'low';
        }
        
        // バックグラウンドスクリプトでのデバッグログ
        if (extensionContext.isBackground && method === 'log') {
            return 'medium'; // 本番環境では削除すべき
        }
        
        // console.warnは警告レベル
        if (method === 'warn') {
            return 'low';
        }
        
        return 'medium';
    }
    
    /**
     * エラーハンドリングコンテキストかチェック
     */
    isErrorHandling(content, position) {
        const context = content.substring(Math.max(0, position - 200), position + 100);
        return /catch\s*\([^)]*\)\s*{/.test(context) ||
               /\.catch\s*\(/.test(context) ||
               /chrome\.runtime\.lastError/.test(context) ||
               /\.addEventListener\s*\(\s*['"]error['"]/.test(context);
    }
}

module.exports = ContextAwareDetector;