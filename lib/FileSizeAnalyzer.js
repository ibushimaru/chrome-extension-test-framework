/**
 * ファイルサイズ分析クラス
 * Chrome拡張機能のファイルサイズを分析し、最適化の提案を行う
 */

const fs = require('fs').promises;
const path = require('path');

class FileSizeAnalyzer {
    constructor(options = {}) {
        // サイズ制限の設定（バイト単位）
        this.limits = {
            // 個別ファイルの制限
            singleFile: {
                warning: options.singleFileWarning || 500 * 1024,    // 500KB
                error: options.singleFileError || 2 * 1024 * 1024,   // 2MB
                critical: options.singleFileCritical || 10 * 1024 * 1024  // 10MB
            },
            // 画像ファイルの制限
            image: {
                warning: options.imageWarning || 200 * 1024,    // 200KB
                error: options.imageError || 1024 * 1024        // 1MB
            },
            // 全体のサイズ制限
            total: {
                warning: options.totalWarning || 10 * 1024 * 1024,     // 10MB
                error: options.totalError || 50 * 1024 * 1024,         // 50MB
                chromeWebStore: 100 * 1024 * 1024                      // 100MB (Chrome Web Store limit)
            }
        };

        // ファイルタイプの定義
        this.fileTypes = {
            javascript: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
            css: ['.css', '.scss', '.sass', '.less'],
            image: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
            font: ['.woff', '.woff2', '.ttf', '.eot', '.otf'],
            data: ['.json', '.xml', '.csv'],
            html: ['.html', '.htm']
        };

        // 分析結果
        this.results = {
            totalSize: 0,
            fileCount: 0,
            largeFiles: [],
            suggestions: [],
            byType: {},
            warnings: []
        };
    }

    /**
     * 拡張機能のファイルサイズを分析
     */
    async analyze(extensionPath) {
        this.results = {
            totalSize: 0,
            fileCount: 0,
            largeFiles: [],
            suggestions: [],
            byType: {},
            warnings: []
        };

        await this.analyzeDirectory(extensionPath);
        this.generateSuggestions();
        
        return this.results;
    }

    /**
     * ディレクトリを再帰的に分析
     */
    async analyzeDirectory(dirPath, relativePath = '') {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
                // node_modules などは除外
                if (!this.shouldSkipDirectory(entry.name)) {
                    await this.analyzeDirectory(fullPath, relPath);
                }
            } else if (entry.isFile()) {
                await this.analyzeFile(fullPath, relPath);
            }
        }
    }

    /**
     * 個別ファイルの分析
     */
    async analyzeFile(filePath, relativePath) {
        try {
            const stats = await fs.stat(filePath);
            const size = stats.size;
            const ext = path.extname(filePath).toLowerCase();
            const type = this.getFileType(ext);

            this.results.fileCount++;
            this.results.totalSize += size;

            // ファイルタイプ別の集計
            if (!this.results.byType[type]) {
                this.results.byType[type] = {
                    count: 0,
                    totalSize: 0,
                    files: []
                };
            }
            this.results.byType[type].count++;
            this.results.byType[type].totalSize += size;

            // サイズチェック
            const sizeCheck = this.checkFileSize(relativePath, size, type);
            if (sizeCheck) {
                this.results.warnings.push(sizeCheck);
                
                // 大きなファイルのリストに追加
                if (size > this.limits.singleFile.warning) {
                    this.results.largeFiles.push({
                        path: relativePath,
                        size: size,
                        type: type,
                        severity: sizeCheck.severity
                    });
                }
            }

            // 詳細情報を保存（大きなファイルのみ）
            if (size > 100 * 1024) { // 100KB以上
                this.results.byType[type].files.push({
                    path: relativePath,
                    size: size
                });
            }

        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error);
        }
    }

    /**
     * ファイルサイズのチェック
     */
    checkFileSize(filePath, size, type) {
        const limits = type === 'image' ? this.limits.image : this.limits.singleFile;
        
        if (size > limits.critical) {
            return {
                type: 'file-size-critical',
                severity: 'critical',
                message: `File "${filePath}" is critically large (${this.formatSize(size)})`,
                file: filePath,
                size: size
            };
        } else if (size > limits.error) {
            return {
                type: 'file-size-error',
                severity: 'error',
                message: `File "${filePath}" exceeds recommended size (${this.formatSize(size)})`,
                file: filePath,
                size: size
            };
        } else if (size > limits.warning) {
            return {
                type: 'file-size-warning',
                severity: 'warning',
                message: `File "${filePath}" is large (${this.formatSize(size)})`,
                file: filePath,
                size: size
            };
        }
        
        return null;
    }

    /**
     * ファイルタイプを判定
     */
    getFileType(ext) {
        for (const [type, extensions] of Object.entries(this.fileTypes)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }
        return 'other';
    }

    /**
     * スキップすべきディレクトリか判定
     */
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules',
            '.git',
            '.svn',
            '.hg',
            'dist',
            'build',
            '.cache',
            'coverage',
            '.nyc_output',
            'test-results'
        ];
        return skipDirs.includes(dirName);
    }

    /**
     * 最適化の提案を生成
     */
    generateSuggestions() {
        // 全体サイズのチェック
        if (this.results.totalSize > this.limits.total.chromeWebStore) {
            this.results.suggestions.push({
                type: 'total-size-exceeded',
                severity: 'critical',
                message: `Total size (${this.formatSize(this.results.totalSize)}) exceeds Chrome Web Store limit (100MB)`,
                suggestion: 'Remove unnecessary files and optimize assets'
            });
        } else if (this.results.totalSize > this.limits.total.error) {
            this.results.suggestions.push({
                type: 'total-size-large',
                severity: 'error',
                message: `Total extension size is very large (${this.formatSize(this.results.totalSize)})`,
                suggestion: 'Consider splitting features or removing unused assets'
            });
        } else if (this.results.totalSize > this.limits.total.warning) {
            this.results.suggestions.push({
                type: 'total-size-warning',
                severity: 'warning',
                message: `Extension size is getting large (${this.formatSize(this.results.totalSize)})`,
                suggestion: 'Review and optimize file sizes'
            });
        }

        // JavaScript最適化の提案
        if (this.results.byType.javascript?.totalSize > 1024 * 1024) {
            this.results.suggestions.push({
                type: 'javascript-optimization',
                severity: 'medium',
                message: 'Large JavaScript bundle detected',
                suggestion: 'Consider code splitting, tree shaking, or lazy loading'
            });
        }

        // 画像最適化の提案
        if (this.results.byType.image?.totalSize > 2 * 1024 * 1024) {
            this.results.suggestions.push({
                type: 'image-optimization',
                severity: 'medium',
                message: 'Large image files detected',
                suggestion: 'Optimize images using WebP format or compression tools'
            });
        }

        // 大きなファイルが多い場合の提案
        if (this.results.largeFiles.length > 5) {
            this.results.suggestions.push({
                type: 'many-large-files',
                severity: 'medium',
                message: `${this.results.largeFiles.length} large files detected`,
                suggestion: 'Review and optimize individual file sizes'
            });
        }
    }

    /**
     * サイズを人間が読みやすい形式にフォーマット
     */
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * 詳細レポートを生成
     */
    generateReport() {
        const report = {
            summary: {
                totalSize: this.formatSize(this.results.totalSize),
                totalSizeBytes: this.results.totalSize,
                fileCount: this.results.fileCount,
                warningCount: this.results.warnings.length,
                suggestionCount: this.results.suggestions.length
            },
            byType: {},
            largeFiles: this.results.largeFiles.map(file => ({
                ...file,
                sizeFormatted: this.formatSize(file.size)
            })),
            warnings: this.results.warnings,
            suggestions: this.results.suggestions
        };

        // ファイルタイプ別の詳細
        for (const [type, data] of Object.entries(this.results.byType)) {
            report.byType[type] = {
                count: data.count,
                totalSize: this.formatSize(data.totalSize),
                totalSizeBytes: data.totalSize,
                percentage: ((data.totalSize / this.results.totalSize) * 100).toFixed(1) + '%',
                largestFiles: data.files
                    .sort((a, b) => b.size - a.size)
                    .slice(0, 5)
                    .map(file => ({
                        path: file.path,
                        size: this.formatSize(file.size)
                    }))
            };
        }

        return report;
    }
}

module.exports = FileSizeAnalyzer;