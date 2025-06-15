/**
 * FileWatcher - ファイル変更監視とスマートな再実行
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class FileWatcher extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.extensionPath = options.extensionPath;
        this.debounceTime = options.debounceTime || 300; // ミリ秒
        this.ignorePatterns = options.ignorePatterns || [
            'node_modules',
            '.git',
            'test-results',
            'test-output',
            '.DS_Store',
            'Thumbs.db',
            '*.log',
            '*.tmp',
            '*.swp'
        ];
        
        this.watchers = new Map();
        this.changeQueue = new Map();
        this.debounceTimer = null;
        this.stats = {
            totalChanges: 0,
            fileTypes: {},
            changedFiles: new Set()
        };
    }

    /**
     * 監視を開始
     */
    start() {
        console.log(`\n👀 Watching for changes in: ${this.extensionPath}`);
        console.log(`   Debounce: ${this.debounceTime}ms`);
        console.log(`   Ignoring: ${this.ignorePatterns.join(', ')}\n`);

        // メインディレクトリを監視
        this.watchDirectory(this.extensionPath);

        // サブディレクトリを監視
        const subdirs = ['js', 'css', '_locales', 'images', 'icons', 'html'];
        subdirs.forEach(subdir => {
            const fullPath = path.join(this.extensionPath, subdir);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                this.watchDirectory(fullPath);
            }
        });

        // manifest.jsonを特別に監視
        const manifestPath = path.join(this.extensionPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            this.watchFile(manifestPath, 'manifest');
        }

        this.emit('start');
    }

    /**
     * ディレクトリを監視
     */
    watchDirectory(dirPath) {
        try {
            const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                if (filename && this.shouldWatch(filename)) {
                    this.handleChange(eventType, path.join(dirPath, filename));
                }
            });

            this.watchers.set(dirPath, watcher);
            console.log(`   📁 Watching directory: ${path.relative(this.extensionPath, dirPath)}`);
        } catch (error) {
            console.error(`   ⚠️  Failed to watch directory: ${dirPath}`);
            console.error(`      ${error.message}`);
        }
    }

    /**
     * 特定のファイルを監視
     */
    watchFile(filePath, type = 'file') {
        try {
            const watcher = fs.watch(filePath, (eventType) => {
                this.handleChange(eventType, filePath, type);
            });

            this.watchers.set(filePath, watcher);
            console.log(`   📄 Watching ${type}: ${path.relative(this.extensionPath, filePath)}`);
        } catch (error) {
            console.error(`   ⚠️  Failed to watch file: ${filePath}`);
            console.error(`      ${error.message}`);
        }
    }

    /**
     * ファイルが監視対象かどうかを判定
     */
    shouldWatch(filename) {
        // 無視パターンに一致するかチェック
        for (const pattern of this.ignorePatterns) {
            if (pattern.includes('*')) {
                // ワイルドカードパターン
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                if (regex.test(filename)) {
                    return false;
                }
            } else {
                // 文字列マッチ
                if (filename.includes(pattern)) {
                    return false;
                }
            }
        }

        // 拡張機能に関連するファイルのみ監視
        const relevantExtensions = [
            '.js', '.json', '.html', '.css', '.png', '.jpg', '.svg', '.xml'
        ];
        
        const ext = path.extname(filename).toLowerCase();
        return relevantExtensions.includes(ext) || filename === 'manifest.json';
    }

    /**
     * ファイル変更を処理
     */
    handleChange(eventType, filePath, fileType = null) {
        const relativePath = path.relative(this.extensionPath, filePath);
        
        // 変更をキューに追加
        this.changeQueue.set(filePath, {
            eventType,
            relativePath,
            fileType: fileType || this.getFileType(filePath),
            timestamp: Date.now()
        });

        // デバウンス処理
        this.debounce();
    }

    /**
     * ファイルタイプを取得
     */
    getFileType(filePath) {
        const basename = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        if (basename === 'manifest.json') return 'manifest';
        if (basename === 'background.js' || basename === 'service-worker.js') return 'background';
        if (basename.includes('content')) return 'content-script';
        if (basename.includes('popup')) return 'popup';
        if (ext === '.css') return 'stylesheet';
        if (ext === '.html') return 'html';
        if (['.png', '.jpg', '.svg', '.ico'].includes(ext)) return 'image';
        if (ext === '.json') return 'json';
        if (ext === '.js') return 'javascript';
        
        return 'other';
    }

    /**
     * デバウンス処理
     */
    debounce() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.processChanges();
        }, this.debounceTime);
    }

    /**
     * 変更を処理
     */
    processChanges() {
        if (this.changeQueue.size === 0) return;

        // 変更の統計を収集
        const changes = Array.from(this.changeQueue.values());
        const changedFiles = changes.map(c => c.relativePath);
        const fileTypes = {};
        
        changes.forEach(change => {
            fileTypes[change.fileType] = (fileTypes[change.fileType] || 0) + 1;
            this.stats.changedFiles.add(change.relativePath);
        });

        this.stats.totalChanges += changes.length;
        Object.entries(fileTypes).forEach(([type, count]) => {
            this.stats.fileTypes[type] = (this.stats.fileTypes[type] || 0) + count;
        });

        // 変更イベントを発行
        const changeInfo = {
            files: changedFiles,
            fileTypes,
            count: changes.length,
            stats: this.stats
        };

        console.log(`\n📝 Detected ${changes.length} file change${changes.length > 1 ? 's' : ''}:`);
        changedFiles.forEach(file => {
            console.log(`   - ${file}`);
        });

        this.emit('change', changeInfo);

        // 特定のファイルタイプに応じた特別なイベント
        if (fileTypes.manifest) {
            this.emit('manifest-change', changeInfo);
        }
        if (fileTypes.background) {
            this.emit('background-change', changeInfo);
        }
        if (fileTypes['content-script']) {
            this.emit('content-script-change', changeInfo);
        }

        // キューをクリア
        this.changeQueue.clear();
    }

    /**
     * 監視を停止
     */
    stop() {
        for (const [path, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        console.log('\n🛑 File watching stopped');
        this.emit('stop');
    }

    /**
     * 統計情報を取得
     */
    getStats() {
        return {
            ...this.stats,
            watchedPaths: Array.from(this.watchers.keys()),
            isWatching: this.watchers.size > 0
        };
    }

    /**
     * 統計をリセット
     */
    resetStats() {
        this.stats = {
            totalChanges: 0,
            fileTypes: {},
            changedFiles: new Set()
        };
    }
}

module.exports = FileWatcher;