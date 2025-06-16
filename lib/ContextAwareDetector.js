/**
 * ContextAwareDetector - コンテキストを考慮した検出を行う
 * 誤検知を減らすための高度な検出ロジック
 */

class ContextAwareDetector {
    constructor() {
        // コメントやテキスト内での検出を避けるためのパターン
        this.commentPatterns = {
            singleLine: /\/\/.*$/gm,
            multiLine: /\/\*[\s\S]*?\*\//g,
            htmlComment: /<!--[\s\S]*?-->/g
        };
        
        // 文字列リテラル内を検出するパターン
        this.stringPatterns = {
            singleQuote: /'(?:[^'\\]|\\.)*'/g,
            doubleQuote: /"(?:[^"\\]|\\.)*"/g,
            template: /`(?:[^`\\]|\\.)*`/g
        };
    }
    
    /**
     * コードからコメントと文字列リテラルを除去
     */
    removeNonCodeContent(content, isHTML = false) {
        let cleaned = content;
        
        // HTMLコメントを除去
        if (isHTML) {
            cleaned = cleaned.replace(this.commentPatterns.htmlComment, '');
        } else {
            // JavaScriptコメントを除去
            cleaned = cleaned.replace(this.commentPatterns.multiLine, '');
            cleaned = cleaned.replace(this.commentPatterns.singleLine, '');
        }
        
        return cleaned;
    }
    
    /**
     * 文字列リテラル内かどうかをチェック
     */
    isInStringLiteral(content, position) {
        // positionより前の部分で、閉じられていない文字列があるかチェック
        const beforePosition = content.substring(0, position);
        
        // 各種クォートの開閉をカウント
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplate = false;
        let escaped = false;
        
        for (let i = 0; i < beforePosition.length; i++) {
            const char = beforePosition[i];
            const prevChar = i > 0 ? beforePosition[i - 1] : '';
            
            // エスケープ処理
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
     * innerHTMLの安全性を文脈から判断
     */
    detectUnsafeInnerHTML(content, filePath) {
        const issues = [];
        
        // まずコメントを除去
        let workingContent = this.removeNonCodeContent(content);
        
        // innerHTMLへの代入を検出
        const innerHTMLPattern = /(\w+)\.innerHTML\s*=\s*([^;]+);?/g;
        let match;
        
        while ((match = innerHTMLPattern.exec(content)) !== null) {
            const fullMatch = match[0];
            const elementVar = match[1];
            const assignedValue = match[2].trim();
            const position = match.index;
            const lineNumber = this.getLineNumber(content, position);
            
            // 文字列リテラル内かチェック
            if (this.isInStringLiteral(content, position)) {
                continue;
            }
            
            // コメント内かチェック（追加の安全策）
            const lineStart = content.lastIndexOf('\n', position) + 1;
            const lineEnd = content.indexOf('\n', position);
            const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
            if (line.trim().startsWith('//') || line.includes('//') && line.indexOf('//') < position - lineStart) {
                continue;
            }
            
            // 安全なパターンかチェック
            const isSafe = this.isSafeInnerHTMLAssignment(assignedValue, content);
            
            if (!isSafe) {
                issues.push({
                    type: 'unsafe-innerHTML',
                    severity: this.getInnerHTMLSeverity(assignedValue),
                    line: lineNumber,
                    message: `Potentially unsafe innerHTML assignment`,
                    context: fullMatch,
                    suggestion: 'Use textContent for plain text or DOMPurify for HTML content'
                });
            }
        }
        
        return issues;
    }
    
    /**
     * innerHTMLの代入が安全かどうかを判断
     */
    isSafeInnerHTMLAssignment(assignedValue, fullContent) {
        // 空文字列は安全
        if (assignedValue === '""' || assignedValue === "''" || assignedValue === '``') {
            return true;
        }
        
        // 定数の文字列リテラル（変数を含まない）
        if (/^["'`][^"'`]*["'`]$/.test(assignedValue) && 
            !assignedValue.includes('${') && 
            !assignedValue.match(/[<>]/)) {
            return true;
        }
        
        // DOMPurifyなどのサニタイザーを使用している場合
        if (assignedValue.includes('DOMPurify.sanitize') || 
            assignedValue.includes('sanitize') ||
            assignedValue.includes('escapeHtml')) {
            return true;
        }
        
        // chrome.i18n.getMessage（拡張機能のローカライゼーション）
        if (assignedValue.includes('chrome.i18n.getMessage')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * innerHTMLの深刻度を判定
     */
    getInnerHTMLSeverity(assignedValue) {
        // ユーザー入力の可能性が高い場合
        if (assignedValue.includes('value') || 
            assignedValue.includes('input') || 
            assignedValue.includes('response') ||
            assignedValue.includes('data')) {
            return 'high';
        }
        
        // 変数や関数呼び出しを含む場合
        if (!/^["'`]/.test(assignedValue)) {
            return 'medium';
        }
        
        return 'low';
    }
    
    /**
     * localStorageの使用を文脈から判断
     */
    detectUnsafeLocalStorage(content, filePath) {
        const issues = [];
        
        // localStorageへの機密データ保存を検出
        const storagePatterns = [
            /localStorage\.setItem\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*([^)]+)\)/g,
            /localStorage\[["'`]([^"'`]+)["'`]\]\s*=\s*([^;]+)/g
        ];
        
        for (const pattern of storagePatterns) {
            pattern.lastIndex = 0; // Reset regex state
            let match;
            
            while ((match = pattern.exec(content)) !== null) {
                const key = match[1];
                const value = match[2].trim();
                const position = match.index;
                const lineNumber = this.getLineNumber(content, position);
                
                // 文字列リテラル内かチェック
                if (this.isInStringLiteral(content, position)) {
                    continue;
                }
                
                // コメント内かチェック
                const lineStart = content.lastIndexOf('\n', position) + 1;
                const lineEnd = content.indexOf('\n', position);
                const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
                if (line.trim().startsWith('//') || line.includes('//') && line.indexOf('//') < position - lineStart) {
                    continue;
                }
                
                // 機密データの可能性をチェック
                if (this.isSensitiveData(key, value)) {
                    issues.push({
                        type: 'sensitive-localstorage',
                        severity: 'high',
                        line: lineNumber,
                        message: `Potentially sensitive data in localStorage: ${key}`,
                        context: match[0],
                        suggestion: 'Use chrome.storage.local with encryption for sensitive data'
                    });
                } else if (this.isDeprecatedStorage(key)) {
                    issues.push({
                        type: 'deprecated-storage',
                        severity: 'low',
                        line: lineNumber,
                        message: `localStorage is deprecated for extensions`,
                        context: match[0],
                        suggestion: 'Migrate to chrome.storage API'
                    });
                }
            }
        }
        
        return issues;
    }
    
    /**
     * 機密データかどうかを判定
     */
    isSensitiveData(key, value) {
        const sensitiveKeywords = [
            'password', 'token', 'key', 'secret', 'credential',
            'api_key', 'apikey', 'auth', 'private', 'ssn', 'credit'
        ];
        
        const keyLower = key.toLowerCase();
        return sensitiveKeywords.some(keyword => keyLower.includes(keyword));
    }
    
    /**
     * 非推奨のストレージ使用かどうか
     */
    isDeprecatedStorage(key) {
        // chrome.storageへの移行を推奨するが、
        // 一時的なキャッシュや設定は警告レベルを下げる
        const allowedKeys = ['cache', 'temp', 'preference', 'setting', 'theme'];
        const keyLower = key.toLowerCase();
        
        return !allowedKeys.some(allowed => keyLower.includes(allowed));
    }
    
    /**
     * 行番号を取得
     */
    getLineNumber(content, position) {
        const lines = content.substring(0, position).split('\n');
        return lines.length;
    }
    
    /**
     * 総合的な分析
     */
    analyze(content, filePath) {
        const fileExt = filePath.toLowerCase().split('.').pop();
        const isHTML = fileExt === 'html' || fileExt === 'htm';
        const isJS = fileExt === 'js' || fileExt === 'ts';
        
        const results = {
            issues: [],
            stats: {
                totalIssues: 0,
                highSeverity: 0,
                mediumSeverity: 0,
                lowSeverity: 0
            }
        };
        
        if (isJS) {
            // JavaScript固有の検出
            results.issues.push(...this.detectUnsafeInnerHTML(content, filePath));
            results.issues.push(...this.detectUnsafeLocalStorage(content, filePath));
        }
        
        // 統計情報を更新
        results.issues.forEach(issue => {
            results.stats.totalIssues++;
            if (issue.severity === 'high') results.stats.highSeverity++;
            else if (issue.severity === 'medium') results.stats.mediumSeverity++;
            else if (issue.severity === 'low') results.stats.lowSeverity++;
        });
        
        return results;
    }
}

module.exports = ContextAwareDetector;