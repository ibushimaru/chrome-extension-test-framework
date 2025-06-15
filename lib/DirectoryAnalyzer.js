/**
 * ディレクトリ構造分析クラス
 * Chrome拡張機能のディレクトリ構造を分析し、複雑度や深度の問題を検出する
 */

const fs = require('fs').promises;
const path = require('path');

class DirectoryAnalyzer {
    constructor(options = {}) {
        this.options = {
            maxDepth: options.maxDepth || 5,
            maxPathLength: options.maxPathLength || 260, // Windows limit
            maxFilesPerDirectory: options.maxFilesPerDirectory || 50,
            skipDotFiles: options.skipDotFiles !== false,
            ...options
        };

        // 分析結果
        this.results = {
            structure: {},
            metrics: {
                maxDepth: 0,
                totalFiles: 0,
                totalDirectories: 0,
                averageDepth: 0,
                deepestPath: '',
                longestPath: '',
                largestDirectory: { path: '', count: 0 }
            },
            issues: [],
            suggestions: []
        };

        // 除外するディレクトリ
        this.excludeDirs = new Set([
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
        ]);
    }

    /**
     * ディレクトリ構造を分析
     */
    async analyze(dirPath) {
        // 結果をリセット
        this.results = {
            structure: {},
            metrics: {
                maxDepth: 0,
                totalFiles: 0,
                totalDirectories: 0,
                averageDepth: 0,
                deepestPath: '',
                longestPath: '',
                largestDirectory: { path: '', count: 0 }
            },
            issues: [],
            suggestions: []
        };

        // ディレクトリ構造を構築
        await this.buildStructure(dirPath, this.results.structure, '', 0);

        // メトリクスを計算
        this.calculateMetrics();

        // 問題を検出
        this.detectIssues();

        // 提案を生成
        this.generateSuggestions();

        return this.results;
    }

    /**
     * ディレクトリ構造を再帰的に構築
     */
    async buildStructure(currentPath, structure, relativePath, depth) {
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            const files = [];
            const directories = [];

            for (const entry of entries) {
                // 除外ディレクトリをスキップ
                if (entry.isDirectory() && this.excludeDirs.has(entry.name)) {
                    continue;
                }

                // ドットファイルをスキップ（設定による）
                if (this.options.skipDotFiles && entry.name.startsWith('.')) {
                    continue;
                }

                const fullPath = path.join(currentPath, entry.name);
                const newRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;

                if (entry.isDirectory()) {
                    directories.push(entry.name);
                    this.results.totalDirectories++;

                    // サブディレクトリの構造を構築
                    structure[entry.name] = {
                        type: 'directory',
                        path: newRelativePath,
                        depth: depth + 1,
                        children: {}
                    };

                    // 深度を更新
                    if (depth + 1 > this.results.metrics.maxDepth) {
                        this.results.metrics.maxDepth = depth + 1;
                        this.results.metrics.deepestPath = newRelativePath;
                    }

                    // パス長を更新
                    if (fullPath.length > this.results.metrics.longestPath.length) {
                        this.results.metrics.longestPath = fullPath;
                    }

                    // 再帰的に処理
                    await this.buildStructure(fullPath, structure[entry.name].children, newRelativePath, depth + 1);

                } else if (entry.isFile()) {
                    files.push(entry.name);
                    this.results.totalFiles++;

                    structure[entry.name] = {
                        type: 'file',
                        path: newRelativePath,
                        depth: depth + 1
                    };

                    // パス長を更新
                    if (fullPath.length > this.results.metrics.longestPath.length) {
                        this.results.metrics.longestPath = fullPath;
                    }
                }
            }

            // 最大ファイル数のディレクトリを更新
            const totalItems = files.length + directories.length;
            if (totalItems > this.results.metrics.largestDirectory.count) {
                this.results.metrics.largestDirectory = {
                    path: relativePath || '.',
                    count: totalItems,
                    files: files.length,
                    directories: directories.length
                };
            }

            // メタデータを追加
            if (relativePath === '') {
                structure._meta = {
                    files: files.length,
                    directories: directories.length,
                    totalItems: totalItems
                };
            }

        } catch (error) {
            console.error(`Error analyzing directory ${currentPath}:`, error);
        }
    }

    /**
     * メトリクスを計算
     */
    calculateMetrics() {
        // 平均深度を計算
        let totalDepth = 0;
        let fileCount = 0;

        const calculateDepthSum = (structure, currentDepth = 0) => {
            for (const [name, item] of Object.entries(structure)) {
                if (name === '_meta') continue;
                
                if (item.type === 'file') {
                    totalDepth += currentDepth + 1;
                    fileCount++;
                } else if (item.type === 'directory' && item.children) {
                    calculateDepthSum(item.children, currentDepth + 1);
                }
            }
        };

        calculateDepthSum(this.results.structure);
        this.results.metrics.averageDepth = fileCount > 0 ? (totalDepth / fileCount).toFixed(2) : 0;
    }

    /**
     * 問題を検出
     */
    detectIssues() {
        // 深すぎるディレクトリ構造
        if (this.results.metrics.maxDepth > this.options.maxDepth) {
            this.results.issues.push({
                type: 'excessive-depth',
                severity: 'high',
                message: `Directory structure too deep (${this.results.metrics.maxDepth} levels)`,
                details: `Deepest path: ${this.results.metrics.deepestPath}`,
                recommendation: `Keep directory depth under ${this.options.maxDepth} levels`
            });
        }

        // パスが長すぎる
        if (this.results.metrics.longestPath.length > this.options.maxPathLength) {
            this.results.issues.push({
                type: 'path-too-long',
                severity: 'critical',
                message: `Path exceeds ${this.options.maxPathLength} characters`,
                details: `Longest path (${this.results.metrics.longestPath.length} chars): ${this.results.metrics.longestPath}`,
                recommendation: 'Shorten directory and file names to avoid Windows compatibility issues'
            });
        }

        // ディレクトリ内のファイルが多すぎる
        if (this.results.metrics.largestDirectory.count > this.options.maxFilesPerDirectory) {
            this.results.issues.push({
                type: 'too-many-files',
                severity: 'medium',
                message: `Directory contains too many items (${this.results.metrics.largestDirectory.count})`,
                details: `Path: ${this.results.metrics.largestDirectory.path}`,
                recommendation: `Organize files into subdirectories (max ${this.options.maxFilesPerDirectory} items per directory)`
            });
        }

        // フラット過ぎる構造（すべてがルートにある）
        if (this.results.metrics.maxDepth === 1 && this.results.totalFiles > 10) {
            this.results.issues.push({
                type: 'too-flat',
                severity: 'low',
                message: 'Directory structure is too flat',
                details: `${this.results.totalFiles} files in root directory`,
                recommendation: 'Organize files into logical subdirectories'
            });
        }

        // 不均衡な構造
        const avgDepth = parseFloat(this.results.metrics.averageDepth);
        if (this.results.metrics.maxDepth > 3 && avgDepth < 1.5) {
            this.results.issues.push({
                type: 'unbalanced-structure',
                severity: 'low',
                message: 'Directory structure is unbalanced',
                details: `Max depth: ${this.results.metrics.maxDepth}, Average depth: ${avgDepth}`,
                recommendation: 'Consider reorganizing to create a more balanced structure'
            });
        }
    }

    /**
     * 改善提案を生成
     */
    generateSuggestions() {
        // 深い構造の改善
        if (this.results.metrics.maxDepth > this.options.maxDepth) {
            this.results.suggestions.push({
                type: 'flatten-structure',
                priority: 'high',
                suggestion: 'Flatten deep directory structures',
                examples: [
                    'src/components/ui/forms/inputs/validators → src/validators',
                    'assets/images/icons/ui/buttons → assets/icons'
                ]
            });
        }

        // 推奨ディレクトリ構造
        if (this.results.totalFiles > 5 && this.results.metrics.maxDepth < 2) {
            this.results.suggestions.push({
                type: 'organize-files',
                priority: 'medium',
                suggestion: 'Organize files into standard directories',
                examples: [
                    'Create js/ for JavaScript files',
                    'Create css/ for stylesheets',
                    'Create assets/ or images/ for media files',
                    'Create lib/ or vendor/ for third-party code'
                ]
            });
        }

        // モジュール化の提案
        if (this.results.totalFiles > 20) {
            this.results.suggestions.push({
                type: 'modularize',
                priority: 'medium',
                suggestion: 'Consider modularizing your extension',
                examples: [
                    'Group related functionality into modules',
                    'Use ES6 modules for better organization',
                    'Implement a clear separation of concerns'
                ]
            });
        }
    }

    /**
     * 構造の可視化（シンプルなツリー表示）
     */
    visualizeStructure(structure = this.results.structure, prefix = '', isLast = true) {
        const lines = [];
        const entries = Object.entries(structure).filter(([name]) => name !== '_meta');
        
        entries.forEach(([name, item], index) => {
            const isLastItem = index === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const extension = isLast ? '    ' : '│   ';
            
            if (item.type === 'directory') {
                lines.push(prefix + connector + name + '/');
                if (item.children && Object.keys(item.children).length > 0) {
                    const childLines = this.visualizeStructure(
                        item.children,
                        prefix + extension,
                        isLastItem
                    );
                    lines.push(...childLines);
                }
            } else {
                lines.push(prefix + connector + name);
            }
        });
        
        return lines;
    }

    /**
     * レポートを生成
     */
    generateReport() {
        return {
            summary: {
                totalFiles: this.results.totalFiles,
                totalDirectories: this.results.totalDirectories,
                maxDepth: this.results.metrics.maxDepth,
                averageDepth: this.results.metrics.averageDepth,
                issueCount: this.results.issues.length
            },
            metrics: this.results.metrics,
            issues: this.results.issues,
            suggestions: this.results.suggestions,
            tree: this.visualizeStructure().join('\n')
        };
    }
}

module.exports = DirectoryAnalyzer;