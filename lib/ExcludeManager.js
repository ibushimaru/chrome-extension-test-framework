/**
 * ExcludeManager - ファイル除外パターンの管理
 */

const path = require('path');
const fs = require('fs');

class ExcludeManager {
    constructor(config = {}) {
        this.patterns = this.normalizePatterns(config.exclude || []);
        this.excludePatterns = config.excludePatterns || {};
        this.includePatterns = config.include || [];
        this.context = config.context || 'default';
        this.basePath = config.extensionPath || process.cwd();
        
        // .extensionignore ファイルから除外パターンを読み込み
        this.loadExtensionIgnore();
        
        // デフォルトの除外パターン
        this.defaultExclude = [
            'node_modules/**',
            '.git/**',
            '.gitignore',
            '.npmignore',
            '*.log',
            '*.tmp',
            '.DS_Store',
            'Thumbs.db',
            // フレームワーク自身のディレクトリを除外
            'chrome-extension-test-framework/**',
            'test-framework/**',
            'lib/**',
            'suites/**',
            'bin/**',
            'test/**',
            // デザイン・開発アセットを除外
            'design-assets/**',
            'docs/**',
            'documentation/**',
            'mockups/**',
            'wireframes/**',
            'screenshots/**',
            '.github/**',
            // 一般的な設定ファイル
            '.extensionignore',
            '.eslintrc*',
            '.prettierrc*',
            'tsconfig.json',
            'webpack.config.js',
            'rollup.config.js',
            'vite.config.js'
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
        // パフォーマンス最適化: node_modules の高速チェック
        // 正規表現による直接的なチェックで45秒→10秒以下を目指す
        const filePathStr = typeof filePath === 'string' ? filePath : String(filePath);
        if (/[\/\\]node_modules[\/\\]/.test(filePathStr)) {
            return true;
        }
        
        // .git ディレクトリの高速チェック
        if (/[\/\\]\.git[\/\\]/.test(filePathStr)) {
            return true;
        }
        
        // フレームワーク自身のファイルを除外
        const frameworkPath = path.resolve(__dirname, '..');
        if (path.isAbsolute(filePath) && filePath.startsWith(frameworkPath)) {
            return true;
        }
        
        // すでに相対パスの場合はそのまま使用
        const relativePath = path.isAbsolute(filePath) ? path.relative(this.basePath, filePath) : filePath;
        
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
        // パフォーマンス最適化: node_modules ディレクトリの高速チェック
        const dirPathStr = typeof dirPath === 'string' ? dirPath : String(dirPath);
        if (/[\/\\]node_modules[\/\\]?/.test(dirPathStr) || dirPathStr.endsWith('node_modules')) {
            return true;
        }
        
        // .git ディレクトリの高速チェック
        if (/[\/\\]\.git[\/\\]?/.test(dirPathStr) || dirPathStr.endsWith('.git')) {
            return true;
        }
        
        // すでに相対パスの場合はそのまま使用
        const relativePath = path.isAbsolute(dirPath) ? path.relative(this.basePath, dirPath) : dirPath;
        
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
                    const relativePath = path.relative(this.basePath, file);
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
    
    /**
     * .extensionignore ファイルから除外パターンを読み込み
     */
    loadExtensionIgnore() {
        const ignorePath = path.join(this.basePath, '.extensionignore');
        if (fs.existsSync(ignorePath)) {
            try {
                const content = fs.readFileSync(ignorePath, 'utf8');
                const lines = content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#')); // 空行とコメントを除外
                
                this.patterns.push(...lines);
            } catch (error) {
                // エラーは無視（ファイルが読めない場合など）
            }
        }
    }
}

module.exports = ExcludeManager;