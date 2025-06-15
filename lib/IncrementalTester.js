/**
 * IncrementalTester - 変更されたファイルのみをテストする機能
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IncrementalTester {
    constructor(options = {}) {
        this.cacheFile = options.cacheFile || path.join(process.cwd(), '.cext-cache.json');
        this.extensionPath = options.extensionPath || process.cwd();
        this.cache = this.loadCache();
        this.excludeManager = options.excludeManager;
        this.gitEnabled = this.checkGitAvailable();
    }

    /**
     * キャッシュファイルを読み込む
     */
    loadCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const content = fs.readFileSync(this.cacheFile, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.warn('⚠️  Failed to load cache file:', error.message);
        }
        
        return {
            lastRun: null,
            fileHashes: {},
            testResults: {},
            dependencies: {}
        };
    }

    /**
     * キャッシュを保存
     */
    saveCache() {
        try {
            fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
        } catch (error) {
            console.error('❌ Failed to save cache:', error.message);
        }
    }

    /**
     * Gitが利用可能かチェック
     */
    checkGitAvailable() {
        try {
            const gitDir = path.join(this.extensionPath, '.git');
            return fs.existsSync(gitDir);
        } catch {
            return false;
        }
    }

    /**
     * ファイルのハッシュを計算
     */
    calculateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }

    /**
     * 変更されたファイルを検出
     */
    async getChangedFiles(options = {}) {
        const changedFiles = new Set();
        
        if (options.useGit && this.gitEnabled) {
            // Gitを使用して変更を検出
            const gitChanges = await this.getGitChangedFiles();
            gitChanges.forEach(file => changedFiles.add(file));
        }
        
        if (options.useHash !== false) {
            // ハッシュベースの変更検出
            const hashChanges = this.getHashChangedFiles();
            hashChanges.forEach(file => changedFiles.add(file));
        }
        
        if (options.sinceTime) {
            // 時間ベースの変更検出
            const timeChanges = this.getTimeChangedFiles(options.sinceTime);
            timeChanges.forEach(file => changedFiles.add(file));
        }
        
        return Array.from(changedFiles);
    }

    /**
     * Gitで変更されたファイルを取得
     */
    async getGitChangedFiles() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // ステージングされたファイルと変更されたファイルを取得
            const { stdout } = await execAsync('git diff --name-only HEAD', {
                cwd: this.extensionPath
            });
            
            const files = stdout.trim().split('\n').filter(Boolean);
            return files.map(file => path.join(this.extensionPath, file));
        } catch (error) {
            console.warn('⚠️  Git detection failed:', error.message);
            return [];
        }
    }

    /**
     * ハッシュベースで変更されたファイルを検出
     */
    getHashChangedFiles() {
        const changedFiles = [];
        const allFiles = this.getAllFiles(this.extensionPath);
        
        allFiles.forEach(file => {
            const relativePath = path.relative(this.extensionPath, file);
            const currentHash = this.calculateFileHash(file);
            const cachedHash = this.cache.fileHashes[relativePath];
            
            if (currentHash && currentHash !== cachedHash) {
                changedFiles.push(file);
                // キャッシュを更新
                this.cache.fileHashes[relativePath] = currentHash;
            }
        });
        
        return changedFiles;
    }

    /**
     * 時間ベースで変更されたファイルを検出
     */
    getTimeChangedFiles(sinceTime) {
        const changedFiles = [];
        const allFiles = this.getAllFiles(this.extensionPath);
        const sinceTimestamp = typeof sinceTime === 'number' ? sinceTime : Date.parse(sinceTime);
        
        allFiles.forEach(file => {
            try {
                const stats = fs.statSync(file);
                if (stats.mtimeMs > sinceTimestamp) {
                    changedFiles.push(file);
                }
            } catch (error) {
                // ファイルアクセスエラーは無視
            }
        });
        
        return changedFiles;
    }

    /**
     * すべてのファイルを取得
     */
    getAllFiles(dir, files = []) {
        try {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                
                // 除外チェック
                if (this.excludeManager && this.excludeManager.shouldExclude(fullPath)) {
                    return;
                }
                
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        // デフォルトで除外するディレクトリ
                        const excludeDirs = ['node_modules', '.git', 'dist', 'build'];
                        if (!excludeDirs.includes(item)) {
                            this.getAllFiles(fullPath, files);
                        }
                    } else if (stat.isFile()) {
                        files.push(fullPath);
                    }
                } catch (error) {
                    // アクセスできないファイルは無視
                }
            });
        } catch (error) {
            console.warn(`⚠️  Failed to read directory: ${dir}`);
        }
        
        return files;
    }

    /**
     * 影響を受けるファイルを特定
     */
    getAffectedFiles(changedFiles) {
        const affected = new Set(changedFiles);
        
        // 依存関係を考慮
        changedFiles.forEach(file => {
            const relativePath = path.relative(this.extensionPath, file);
            const dependents = this.cache.dependencies[relativePath] || [];
            dependents.forEach(dep => affected.add(path.join(this.extensionPath, dep)));
        });
        
        // manifest.jsonが変更された場合は全テストを実行
        if (changedFiles.some(file => path.basename(file) === 'manifest.json')) {
            console.log('   ℹ️  manifest.json changed - running all tests');
            return null; // nullは全テストを意味する
        }
        
        return Array.from(affected);
    }

    /**
     * テスト対象を決定
     */
    async determineTestTargets(options = {}) {
        const result = {
            mode: 'full',
            files: [],
            suites: [],
            reason: ''
        };
        
        // 強制的に全テストを実行
        if (options.all || (!this.cache.lastRun && options.sinceLastRun)) {
            result.mode = 'full';
            result.reason = options.all ? 'Forced full test' : 'No previous test run found';
            return result;
        }
        
        // 変更されたファイルを取得
        const changedFiles = await this.getChangedFiles({
            useGit: options.useGit,
            useHash: true,
            sinceTime: options.sinceLastRun ? this.cache.lastRun : null
        });
        
        if (changedFiles.length === 0) {
            result.mode = 'none';
            result.reason = 'No changes detected';
            return result;
        }
        
        // 影響を受けるファイルを特定
        const affectedFiles = this.getAffectedFiles(changedFiles);
        
        if (affectedFiles === null) {
            result.mode = 'full';
            result.reason = 'Critical file changed';
            return result;
        }
        
        result.mode = 'incremental';
        result.files = affectedFiles;
        result.reason = `${changedFiles.length} files changed`;
        
        // 変更されたファイルタイプに基づいてテストスイートを決定
        result.suites = this.determineSuites(affectedFiles);
        
        return result;
    }

    /**
     * ファイルタイプに基づいてテストスイートを決定
     */
    determineSuites(files) {
        const suites = new Set();
        
        files.forEach(file => {
            const basename = path.basename(file);
            const ext = path.extname(file);
            
            // manifest.json関連
            if (basename === 'manifest.json') {
                suites.add('manifest');
                suites.add('structure');
            }
            
            // JavaScript関連
            if (ext === '.js') {
                suites.add('security');
                suites.add('performance');
                
                if (basename.includes('background') || basename.includes('service-worker')) {
                    suites.add('manifest');
                }
            }
            
            // CSS関連
            if (ext === '.css') {
                suites.add('performance');
            }
            
            // HTML関連
            if (ext === '.html') {
                suites.add('security');
                suites.add('structure');
            }
            
            // ローカライゼーション関連
            if (file.includes('_locales')) {
                suites.add('localization');
            }
        });
        
        return Array.from(suites);
    }

    /**
     * テスト実行を記録
     */
    recordTestRun(results) {
        this.cache.lastRun = new Date().toISOString();
        this.cache.testResults = {
            timestamp: this.cache.lastRun,
            summary: results.summary,
            mode: results.mode || 'full'
        };
        
        this.saveCache();
    }

    /**
     * 依存関係を更新
     */
    updateDependencies(file, dependencies) {
        const relativePath = path.relative(this.extensionPath, file);
        this.cache.dependencies[relativePath] = dependencies.map(dep => 
            path.relative(this.extensionPath, dep)
        );
    }

    /**
     * キャッシュをクリア
     */
    clearCache() {
        this.cache = {
            lastRun: null,
            fileHashes: {},
            testResults: {},
            dependencies: {}
        };
        
        try {
            if (fs.existsSync(this.cacheFile)) {
                fs.unlinkSync(this.cacheFile);
            }
        } catch (error) {
            console.error('❌ Failed to clear cache:', error.message);
        }
    }

    /**
     * 統計情報を取得
     */
    getStats() {
        const stats = {
            lastRun: this.cache.lastRun,
            cachedFiles: Object.keys(this.cache.fileHashes).length,
            lastTestMode: this.cache.testResults?.mode,
            lastTestSummary: this.cache.testResults?.summary
        };
        
        if (this.cache.lastRun) {
            const lastRunDate = new Date(this.cache.lastRun);
            const now = new Date();
            const diffMs = now - lastRunDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            
            if (diffHours > 0) {
                stats.timeSinceLastRun = `${diffHours} hours ago`;
            } else {
                stats.timeSinceLastRun = `${diffMins} minutes ago`;
            }
        }
        
        return stats;
    }
}

module.exports = IncrementalTester;