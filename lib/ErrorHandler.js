/**
 * ErrorHandler - 統合エラーハンドリングシステム
 * エラーの分類、詳細化、ユーザーフレンドリーなメッセージの提供
 */

const fs = require('fs').promises;
const path = require('path');

class ErrorHandler {
    constructor() {
        // ANSI color codes
        this.colors = {
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m',
            bold: '\x1b[1m'
        };
        
        this.errorCategories = {
            FILE_NOT_FOUND: {
                level: 'error',
                prefix: '📁',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Check if the file exists', 'Verify the file path', 'Ensure proper file permissions']
            },
            INVALID_JSON: {
                level: 'error',
                prefix: '📄',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Validate JSON syntax', 'Check for missing commas or brackets', 'Use a JSON validator']
            },
            PERMISSION_ERROR: {
                level: 'error',
                prefix: '🔒',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Check file permissions', 'Run with appropriate privileges', 'Verify directory access rights']
            },
            VALIDATION_ERROR: {
                level: 'error',
                prefix: '❌',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Review the validation rules', 'Check the input format', 'Refer to Chrome Extension documentation']
            },
            SECURITY_ERROR: {
                level: 'critical',
                prefix: '🚨',
                color: this.colors.magenta,
                label: 'CRITICAL',
                suggestions: ['Review security best practices', 'Check for hardcoded secrets', 'Use secure storage methods']
            },
            PERFORMANCE_ERROR: {
                level: 'warning',
                prefix: '⚡',
                color: this.colors.yellow,
                label: 'WARNING',
                suggestions: ['Optimize code performance', 'Use Web Workers for heavy tasks', 'Implement lazy loading']
            },
            CODE_QUALITY: {
                level: 'warning',
                prefix: '📝',
                color: this.colors.yellow,
                label: 'WARNING',
                suggestions: ['Review code quality guidelines', 'Remove debug code for production', 'Use proper logging levels']
            },
            TIMEOUT_ERROR: {
                level: 'error',
                prefix: '⏱️',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Increase timeout duration', 'Optimize test performance', 'Check for infinite loops']
            },
            NETWORK_ERROR: {
                level: 'error',
                prefix: '🌐',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Check network connectivity', 'Verify API endpoints', 'Implement retry logic']
            },
            CONFIGURATION_ERROR: {
                level: 'error',
                prefix: '⚙️',
                color: this.colors.red,
                label: 'ERROR',
                suggestions: ['Review configuration file', 'Check for required fields', 'Validate configuration syntax']
            },
            INTERNAL_ERROR: {
                level: 'critical',
                prefix: '💥',
                color: this.colors.magenta,
                label: 'FRAMEWORK BUG',
                suggestions: ['This is an internal framework error', 'Please report this issue on GitHub with full error details', 'Include your extension structure and command used']
            }
        };

        this.errorContext = new Map();
    }

    /**
     * エラーを処理して詳細な情報を追加
     */
    async handleError(error, context = {}) {
        const enhancedError = await this.enhanceError(error, context);
        
        // エラーコンテキストを保存
        this.errorContext.set(enhancedError.id, {
            timestamp: new Date().toISOString(),
            context: context,
            error: enhancedError
        });

        return enhancedError;
    }

    /**
     * エラーを詳細化
     */
    async enhanceError(error, context = {}) {
        const category = this.categorizeError(error);
        const errorInfo = this.errorCategories[category] || this.errorCategories.INTERNAL_ERROR;

        const enhanced = {
            id: this.generateErrorId(),
            name: error.name || 'Error',
            message: error.message,
            category: category,
            level: errorInfo.level,
            prefix: errorInfo.prefix,
            color: errorInfo.color,
            label: errorInfo.label,
            timestamp: new Date().toISOString(),
            
            // コンテキスト情報
            context: {
                file: context.file || this.extractFileFromStack(error.stack),
                line: context.line || this.extractLineFromStack(error.stack),
                column: context.column || this.extractColumnFromStack(error.stack),
                suite: context.suite,
                test: context.test,
                phase: context.phase || 'unknown',
                ...context
            },
            
            // スタックトレース
            stack: this.cleanStackTrace(error.stack),
            
            // 提案
            suggestions: await this.generateSuggestions(error, category, context),
            
            // 関連するコード
            codeSnippet: await this.extractCodeSnippet(error, context),
            
            // 追加のメタデータ
            metadata: {
                errorCode: error.code,
                syscall: error.syscall,
                path: error.path,
                ...error.metadata
            }
        };

        // フレームワーク固有のエラー情報を追加
        if (error.frameworkDetails) {
            enhanced.frameworkDetails = error.frameworkDetails;
        }

        return enhanced;
    }

    /**
     * エラーを分類
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();
        const code = error.code;
        
        // 手動で設定されたカテゴリを優先
        if (error.category && this.errorCategories[error.category]) {
            return error.category;
        }

        // ファイル関連
        if (code === 'ENOENT' || message.includes('file not found') || message.includes('no such file')) {
            return 'FILE_NOT_FOUND';
        }
        
        // JSON関連（manifest.jsonのエラーなど）
        if ((message.includes('json') || message.includes('unexpected token') || error.name === 'SyntaxError') 
            && (message.includes('manifest') || message.includes('parse'))) {
            return 'INVALID_JSON';
        }
        
        // 権限関連
        if (code === 'EACCES' || code === 'EPERM' || message.includes('permission denied')) {
            return 'PERMISSION_ERROR';
        }
        
        // セキュリティ関連（より具体的な条件）
        if (message.includes('eval') || message.includes('innerhtml') || message.includes('xss') ||
            message.includes('injection') || message.includes('hardcoded secret') || 
            message.includes('unsafe') || message.includes('vulnerable')) {
            return 'SECURITY_ERROR';
        }
        
        // パフォーマンス関連（より具体的）
        if (message.includes('file size') || message.includes('bundle size') || 
            message.includes('memory leak') || message.includes('optimization') ||
            message.includes('slow') || message.includes('performance')) {
            return 'PERFORMANCE_ERROR';
        }
        
        // タイムアウト（パフォーマンスとは別扱い）
        if (message.includes('timeout') || message.includes('timed out')) {
            return 'TIMEOUT_ERROR';
        }
        
        // ネットワーク関連
        if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || 
            message.includes('network') || message.includes('fetch')) {
            return 'NETWORK_ERROR';
        }
        
        // 設定関連
        if (message.includes('config') || message.includes('configuration') || 
            message.includes('setting')) {
            return 'CONFIGURATION_ERROR';
        }
        
        // コード品質関連（開発ファイル、console使用など）
        if (message.includes('console') || message.includes('development file') || 
            message.includes('debug') || message.includes('node_modules') ||
            message.includes('.git') || message.includes('test file')) {
            return 'CODE_QUALITY';
        }
        
        // バリデーション関連（一般的な検証エラー）
        if (message.includes('invalid') || message.includes('validation') || 
            message.includes('required') || message.includes('missing') ||
            message.includes('must be') || message.includes('should')) {
            return 'VALIDATION_ERROR';
        }
        
        // フレームワーク内部エラー（非常に限定的に使用）
        if (error.isFrameworkBug || 
            (error.stack && error.stack.includes('/lib/') && 
             !message.includes('test') && !message.includes('validation'))) {
            return 'INTERNAL_ERROR';
        }
        
        // その他のエラーはVALIDATION_ERRORとして扱う
        return 'VALIDATION_ERROR';
    }

    /**
     * 提案を生成
     */
    async generateSuggestions(error, category, context) {
        const baseSuggestions = this.errorCategories[category]?.suggestions || [];
        const contextualSuggestions = [];

        // ファイルが見つからない場合
        if (category === 'FILE_NOT_FOUND' && error.path) {
            const dir = path.dirname(error.path);
            try {
                const files = await fs.readdir(dir);
                const basename = path.basename(error.path);
                const similar = files.filter(f => 
                    f.toLowerCase().includes(basename.toLowerCase()) ||
                    basename.toLowerCase().includes(f.toLowerCase())
                );
                
                if (similar.length > 0) {
                    contextualSuggestions.push(`Did you mean: ${similar.join(', ')}?`);
                }
            } catch (e) {
                // ディレクトリも存在しない場合
                contextualSuggestions.push('The parent directory does not exist');
            }
        }

        // JSON エラーの場合
        if (category === 'INVALID_JSON' && context.file) {
            contextualSuggestions.push(`Validate ${context.file} with a JSON linter`);
            
            // 一般的なJSON エラーパターン
            if (error.message.includes('Unexpected token')) {
                contextualSuggestions.push('Check for trailing commas in arrays or objects');
                contextualSuggestions.push('Ensure all strings are properly quoted');
            }
        }

        // バリデーションエラーの場合
        if (category === 'VALIDATION_ERROR') {
            if (error.message.includes('manifest')) {
                contextualSuggestions.push('Refer to: https://developer.chrome.com/docs/extensions/mv3/manifest/');
            }
            if (error.message.includes('permission')) {
                contextualSuggestions.push('Check the permissions documentation: https://developer.chrome.com/docs/extensions/mv3/declare_permissions/');
            }
        }

        return [...baseSuggestions, ...contextualSuggestions];
    }

    /**
     * コードスニペットを抽出
     */
    async extractCodeSnippet(error, context) {
        if (!context.file) return null;

        try {
            const fullPath = path.isAbsolute(context.file) 
                ? context.file 
                : path.join(process.cwd(), context.file);
                
            const content = await fs.readFile(fullPath, 'utf8');
            const lines = content.split('\n');
            
            const line = context.line || this.extractLineFromStack(error.stack);
            if (!line || line < 1) return null;

            const startLine = Math.max(0, line - 4);
            const endLine = Math.min(lines.length, line + 3);
            
            const snippet = [];
            for (let i = startLine; i < endLine; i++) {
                const lineNum = i + 1;
                const prefix = lineNum === line ? '>' : ' ';
                snippet.push(`${prefix} ${lineNum.toString().padStart(4)} | ${lines[i]}`);
            }

            return {
                file: context.file,
                line: line,
                code: snippet.join('\n')
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * スタックトレースをクリーン
     */
    cleanStackTrace(stack) {
        if (!stack) return '';
        
        return stack.split('\n')
            .filter(line => !line.includes('node_modules') && !line.includes('internal/'))
            .map(line => line.trim())
            .join('\n');
    }

    /**
     * スタックトレースからファイル名を抽出
     */
    extractFileFromStack(stack) {
        if (!stack) return null;
        
        const match = stack.match(/at\s+.*?\s+\((.+?):\d+:\d+\)/);
        return match ? match[1] : null;
    }

    /**
     * スタックトレースから行番号を抽出
     */
    extractLineFromStack(stack) {
        if (!stack) return null;
        
        const match = stack.match(/at\s+.*?\s+\(.+?:(\d+):\d+\)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * スタックトレースから列番号を抽出
     */
    extractColumnFromStack(stack) {
        if (!stack) return null;
        
        const match = stack.match(/at\s+.*?\s+\(.+?:\d+:(\d+)\)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * エラーIDを生成
     */
    generateErrorId() {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * エラーレポートをフォーマット
     */
    formatError(enhancedError) {
        const lines = [];
        
        // ヘッダー
        const useColors = process.stdout.isTTY && !process.env.NO_COLOR;
        const color = useColors ? enhancedError.color : '';
        const reset = useColors ? this.colors.reset : '';
        const bold = useColors ? this.colors.bold : '';
        
        lines.push(`\n${enhancedError.prefix} ${color}${bold}[${enhancedError.label}]${reset} ${enhancedError.message}`);
        lines.push(`   ID: ${enhancedError.id}`);
        lines.push(`   Level: ${enhancedError.level}`);
        lines.push(`   Category: ${enhancedError.category}`);
        
        // コンテキスト
        if (enhancedError.context.file) {
            lines.push(`   File: ${enhancedError.context.file}:${enhancedError.context.line || '?'}:${enhancedError.context.column || '?'}`);
        }
        if (enhancedError.context.suite) {
            lines.push(`   Suite: ${enhancedError.context.suite}`);
        }
        if (enhancedError.context.test) {
            lines.push(`   Test: ${enhancedError.context.test}`);
        }
        
        // コードスニペット
        if (enhancedError.codeSnippet) {
            lines.push('\n   Code:');
            lines.push(enhancedError.codeSnippet.code.split('\n').map(l => '   ' + l).join('\n'));
        }
        
        // 提案
        if (enhancedError.suggestions.length > 0) {
            lines.push('\n   Suggestions:');
            enhancedError.suggestions.forEach(s => {
                lines.push(`   • ${s}`);
            });
        }
        
        // スタックトレース（verboseモードの場合）
        if (enhancedError.stack && process.env.VERBOSE) {
            lines.push('\n   Stack Trace:');
            lines.push(enhancedError.stack.split('\n').map(l => '   ' + l).join('\n'));
        }
        
        return lines.join('\n');
    }

    /**
     * 保存されたエラーコンテキストを取得
     */
    getErrorContext(errorId) {
        return this.errorContext.get(errorId);
    }

    /**
     * すべてのエラーコンテキストをクリア
     */
    clearErrorContext() {
        this.errorContext.clear();
    }
}

module.exports = ErrorHandler;