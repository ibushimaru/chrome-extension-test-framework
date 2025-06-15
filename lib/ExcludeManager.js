/**
 * ExcludeManager - ファイル除外パターンの管理
 */

const path = require('path');

class ExcludeManager {
    constructor(config = {}) {
        this.patterns = this.normalizePatterns(config.exclude || []);
        this.excludePatterns = config.excludePatterns || {};
        this.includePatterns = config.include || [];
        this.context = config.context || 'default';
        
        // デフォルトの除外パターン
        this.defaultExclude = [
            'node_modules/**',
            '.git/**',
            '.gitignore',
            '.npmignore',
            '*.log',
            '*.tmp',
            '.DS_Store',
            'Thumbs.db'
        ];
        
        // すべてのパターンを結合
        this.allPatterns = [
            ...this.defaultExclude,
            ...this.patterns,
            ...(this.excludePatterns.directories || []).map(d => `${d}/**`),
            ...(this.excludePatterns.files || [])
        ];
        
        // コンテキスト別パターンを適用
        if (this.excludePatterns.byContext && this.excludePatterns.byContext[this.context]) {
            this.allPatterns.push(...this.excludePatterns.byContext[this.context]);
        }
    }

    /**
     * パターンを正規化
     */
    normalizePatterns(patterns) {
        if (typeof patterns === 'string') {
            return [patterns];
        }
        return Array.isArray(patterns) ? patterns : [];
    }

    /**
     * ファイルが除外対象かチェック
     */
    shouldExclude(filePath) {
        const relativePath = path.relative(process.cwd(), filePath);
        
        // まず除外パターンをチェック（優先度高）
        const isExcluded = this.allPatterns.some(pattern => {
            return this.minimatch(relativePath, pattern, { dot: true });
        });
        
        if (isExcluded) {
            return true;
        }
        
        // 含めるパターンが指定されている場合
        if (this.includePatterns.length > 0) {
            const shouldInclude = this.includePatterns.some(pattern => {
                return this.minimatch(relativePath, pattern, { dot: true });
            });
            
            // 含めるパターンにマッチしない場合は除外
            if (!shouldInclude) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * ディレクトリが除外対象かチェック
     */
    shouldExcludeDirectory(dirPath) {
        const relativePath = path.relative(process.cwd(), dirPath);
        
        // ディレクトリ専用の除外パターンをチェック
        if (this.excludePatterns.directories) {
            if (this.excludePatterns.directories.includes(relativePath) ||
                this.excludePatterns.directories.includes(path.basename(dirPath))) {
                return true;
            }
        }
        
        // 通常のパターンもチェック
        return this.shouldExclude(dirPath);
    }

    /**
     * ファイルリストをフィルタリング
     */
    filterFiles(files) {
        return files.filter(file => !this.shouldExclude(file));
    }

    /**
     * パターンを追加
     */
    addPattern(pattern) {
        if (!this.allPatterns.includes(pattern)) {
            this.allPatterns.push(pattern);
        }
    }

    /**
     * パターンを削除
     */
    removePattern(pattern) {
        const index = this.allPatterns.indexOf(pattern);
        if (index !== -1) {
            this.allPatterns.splice(index, 1);
        }
    }

    /**
     * 現在のパターンを取得
     */
    getPatterns() {
        return [...this.allPatterns];
    }

    /**
     * コンテキストを変更
     */
    setContext(context) {
        this.context = context;
        
        // コンテキスト別パターンを再適用
        if (this.excludePatterns.byContext && this.excludePatterns.byContext[context]) {
            // 古いコンテキストのパターンを削除
            Object.keys(this.excludePatterns.byContext).forEach(ctx => {
                if (ctx !== context) {
                    this.excludePatterns.byContext[ctx].forEach(pattern => {
                        this.removePattern(pattern);
                    });
                }
            });
            
            // 新しいコンテキストのパターンを追加
            this.excludePatterns.byContext[context].forEach(pattern => {
                this.addPattern(pattern);
            });
        }
    }

    /**
     * 統計情報を取得
     */
    getStats(files) {
        const stats = {
            totalFiles: files.length,
            includedFiles: 0,
            excludedFiles: 0,
            excludedByPattern: {}
        };
        
        files.forEach(file => {
            if (this.shouldExclude(file)) {
                stats.excludedFiles++;
                
                // どのパターンで除外されたか記録
                this.allPatterns.forEach(pattern => {
                    const relativePath = path.relative(process.cwd(), file);
                    if (this.minimatch(relativePath, pattern, { dot: true })) {
                        stats.excludedByPattern[pattern] = (stats.excludedByPattern[pattern] || 0) + 1;
                    }
                });
            } else {
                stats.includedFiles++;
            }
        });
        
        return stats;
    }

    /**
     * minimatchの簡易実装
     */
    minimatch(path, pattern, options = {}) {
        // グロブパターンを正規表現に変換
        let regex = pattern
            .replace(/\./g, '\\.')
            .replace(/\*\*/g, '##DOUBLESTAR##')
            .replace(/\*/g, '[^/]*')
            .replace(/##DOUBLESTAR##/g, '.*')
            .replace(/\?/g, '[^/]');
        
        // パターンの最初と最後を調整
        if (!pattern.startsWith('**')) {
            regex = '^' + regex;
        }
        if (!pattern.endsWith('**')) {
            regex = regex + '$';
        }
        
        // ドットファイルの扱い
        if (!options.dot && path.startsWith('.')) {
            return false;
        }
        
        return new RegExp(regex).test(path);
    }
}

module.exports = ExcludeManager;