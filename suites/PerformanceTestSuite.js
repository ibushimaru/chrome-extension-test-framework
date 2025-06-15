/**
 * PerformanceTestSuite - パフォーマンス関連の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const fs = require('fs');
const path = require('path');
const FileSizeAnalyzer = require('../lib/FileSizeAnalyzer');

class PerformanceTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Performance Validation',
            description: 'Chrome拡張機能のパフォーマンス要件を検証'
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // ファイルサイズの検証（改善版）
        this.test('File size limits', async (config) => {
            const analyzer = new FileSizeAnalyzer();
            const analysis = await analyzer.analyze(config.extensionPath);
            const report = analyzer.generateReport();
            
            // 大きなファイルの警告表示
            if (analysis.largeFiles.length > 0) {
                console.warn('   ⚠️  Large files detected:');
                analysis.largeFiles.forEach(file => {
                    const severity = file.severity === 'critical' ? '🚨' : 
                                   file.severity === 'error' ? '❌' : '⚠️';
                    console.warn(`      ${severity} ${file.path}: ${analyzer.formatSize(file.size)}`);
                });
            }
            
            // ファイルタイプ別の分析表示
            if (config.verbose) {
                console.log('   📊 File size breakdown:');
                for (const [type, data] of Object.entries(report.byType)) {
                    if (data.count > 0) {
                        console.log(`      - ${type}: ${data.count} files, ${data.totalSize} (${data.percentage})`);
                    }
                }
            }
            
            // 提案事項の表示
            analysis.suggestions.forEach(suggestion => {
                console.log(`   💡 ${suggestion.message}`);
                console.log(`      → ${suggestion.suggestion}`);
            });
            
            // クリティカルなエラーがあれば例外を投げる
            const criticalErrors = analysis.warnings.filter(w => w.severity === 'critical');
            if (criticalErrors.length > 0) {
                const error = new Error(`Critical file size issues detected: ${criticalErrors.length} files exceed limits`);
                error.code = 'FILE_SIZE_CRITICAL';
                error.severity = 'critical';
                error.details = {
                    files: criticalErrors,
                    report: report
                };
                error.suggestions = analysis.suggestions;
                throw error;
            }
            
            // エラーレベルの警告がある場合
            const errors = analysis.warnings.filter(w => w.severity === 'error');
            if (errors.length > 0) {
                const error = new Error(`File size issues detected: ${errors.length} files are too large`);
                error.code = 'FILE_SIZE_ERROR';
                error.severity = 'high';
                error.details = {
                    files: errors,
                    report: report
                };
                error.suggestions = analysis.suggestions;
                throw error;
            }
        });

        // 画像最適化の検証
        this.test('Image optimization', async (config) => {
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
            const images = await this.findFilesByExtension(config.extensionPath, imageExtensions);
            
            for (const imagePath of images) {
                const stats = fs.statSync(imagePath);
                const sizeMB = stats.size / 1024 / 1024;
                
                // 大きな画像ファイルの警告
                if (sizeMB > 0.5) {
                    console.warn(`   ⚠️  Large image: ${path.basename(imagePath)} (${sizeMB.toFixed(2)}MB)`);
                }
                
                // アイコンサイズの検証
                if (imagePath.includes('icon') || imagePath.includes('logo')) {
                    if (sizeMB > 0.1) {
                        console.warn(`   ⚠️  Icon file too large: ${path.basename(imagePath)}`);
                    }
                }
            }
        });

        // JavaScript最適化の検証
        this.test('JavaScript optimization', async (config) => {
            const jsFiles = await this.findFilesByExtension(config.extensionPath, ['.js']);
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                const stats = fs.statSync(jsFile);
                
                // 非常に大きなJSファイル
                if (stats.size > 500 * 1024) { // 500KB
                    console.warn(`   ⚠️  Large JS file: ${path.basename(jsFile)} (${(stats.size / 1024).toFixed(0)}KB)`);
                }
                
                // console.logの過剰使用
                const consoleLogs = (content.match(/console\.(log|debug|info)/g) || []).length;
                if (consoleLogs > 10) {
                    console.warn(`   ⚠️  Excessive console logging in ${path.basename(jsFile)}: ${consoleLogs} occurrences`);
                }
                
                // デバッグコードの検出
                if (/debugger;/g.test(content)) {
                    throw new Error(`debugger statement found in ${path.basename(jsFile)}`);
                }
            }
        });

        // 依存関係の検証
        this.test('Dependencies check', async (config) => {
            const packageJsonPath = path.join(config.extensionPath, 'package.json');
            
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };
                
                const depCount = Object.keys(dependencies).length;
                
                if (depCount > 50) {
                    console.warn(`   ⚠️  Large number of dependencies: ${depCount}`);
                }
                
                // node_modulesが含まれていないことを確認
                const nodeModulesPath = path.join(config.extensionPath, 'node_modules');
                if (fs.existsSync(nodeModulesPath)) {
                    throw new Error('node_modules directory should not be included in extension');
                }
            }
        });

        // CSS最適化の検証
        this.test('CSS optimization', async (config) => {
            const cssFiles = await this.findFilesByExtension(config.extensionPath, ['.css']);
            
            for (const cssFile of cssFiles) {
                const content = fs.readFileSync(cssFile, 'utf8');
                const stats = fs.statSync(cssFile);
                
                // 大きなCSSファイル
                if (stats.size > 100 * 1024) { // 100KB
                    console.warn(`   ⚠️  Large CSS file: ${path.basename(cssFile)} (${(stats.size / 1024).toFixed(0)}KB)`);
                }
                
                // 非効率なセレクタ
                const universalSelectors = (content.match(/\*/g) || []).length;
                if (universalSelectors > 10) {
                    console.warn(`   ⚠️  Many universal selectors in ${path.basename(cssFile)}: ${universalSelectors}`);
                }
                
                // 深いネスト
                const deepSelectors = content.match(/([^\s]+\s+){5,}/g) || [];
                if (deepSelectors.length > 0) {
                    console.warn(`   ⚠️  Deep CSS selectors in ${path.basename(cssFile)}: ${deepSelectors.length}`);
                }
            }
        });

        // メモリリークの潜在的リスク
        this.test('Memory leak prevention', async (config) => {
            const jsFiles = await this.findFilesByExtension(config.extensionPath, ['.js']);
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // イベントリスナーの削除忘れ
                const addListeners = (content.match(/addEventListener/g) || []).length;
                const removeListeners = (content.match(/removeEventListener/g) || []).length;
                
                if (addListeners > removeListeners + 5) {
                    console.warn(`   ⚠️  Potential memory leak in ${path.basename(jsFile)}: more listeners added than removed`);
                }
                
                // setIntervalの使用
                if (/setInterval/g.test(content)) {
                    const clearIntervals = (content.match(/clearInterval/g) || []).length;
                    if (clearIntervals === 0) {
                        console.warn(`   ⚠️  setInterval without clearInterval in ${path.basename(jsFile)}`);
                    }
                }
                
                // 循環参照の可能性
                if (/this\.\w+\s*=\s*this/g.test(content)) {
                    console.warn(`   ⚠️  Potential circular reference in ${path.basename(jsFile)}`);
                }
            }
        });

        // Service Worker効率性
        this.test('Service worker efficiency', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (manifest.background && manifest.background.service_worker) {
                const swPath = path.join(config.extensionPath, manifest.background.service_worker);
                
                if (fs.existsSync(swPath)) {
                    const content = fs.readFileSync(swPath, 'utf8');
                    
                    // 永続的な接続の使用
                    if (/chrome\.runtime\.connect/g.test(content)) {
                        console.warn('   ⚠️  Persistent connections in service worker may impact performance');
                    }
                    
                    // 過度なストレージアクセス
                    const storageAccess = (content.match(/chrome\.storage\.(local|sync)\.(get|set)/g) || []).length;
                    if (storageAccess > 20) {
                        console.warn(`   ⚠️  Frequent storage access in service worker: ${storageAccess} calls`);
                    }
                }
            }
        });

        // ローディング時間の最適化
        this.test('Loading time optimization', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // Content scriptsの読み込みタイミング
            if (manifest.content_scripts) {
                manifest.content_scripts.forEach((script, index) => {
                    if (!script.run_at || script.run_at === 'document_idle') {
                        // document_idleはデフォルトで良い選択
                    } else if (script.run_at === 'document_start') {
                        console.warn(`   ⚠️  Content script ${index} runs at document_start - may impact page load`);
                    }
                });
            }
            
            // Web accessible resourcesの数
            if (manifest.web_accessible_resources) {
                let totalResources = 0;
                manifest.web_accessible_resources.forEach(resource => {
                    totalResources += resource.resources ? resource.resources.length : 0;
                });
                
                if (totalResources > 50) {
                    console.warn(`   ⚠️  Many web accessible resources: ${totalResources}`);
                }
            }
        });

        // アニメーションパフォーマンス
        this.test('Animation performance', async (config) => {
            const cssFiles = await this.findFilesByExtension(config.extensionPath, ['.css']);
            
            for (const cssFile of cssFiles) {
                const content = fs.readFileSync(cssFile, 'utf8');
                
                // アニメーションの使用
                const animations = content.match(/@keyframes|animation:|transition:/g) || [];
                
                if (animations.length > 20) {
                    console.warn(`   ⚠️  Many animations in ${path.basename(cssFile)}: ${animations.length}`);
                }
                
                // transform以外のアニメーション
                const nonTransformAnimations = content.match(/animation:.*?(margin|padding|width|height|top|left|right|bottom)/g) || [];
                if (nonTransformAnimations.length > 0) {
                    console.warn(`   ⚠️  Non-transform animations detected in ${path.basename(cssFile)} - may cause reflow`);
                }
            }
        });
    }

    /**
     * ファイルサイズを分析
     */
    async analyzeFileSizes(dir) {
        const results = [];
        
        const walk = (currentDir) => {
            const entries = fs.readdirSync(currentDir);
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                    walk(fullPath);
                } else if (stat.isFile()) {
                    results.push({
                        path: path.relative(dir, fullPath),
                        size: stat.size
                    });
                }
            });
        };
        
        walk(dir);
        return results;
    }

    /**
     * 拡張子でファイルを検索
     */
    async findFilesByExtension(dir, extensions) {
        const files = [];
        const exts = Array.isArray(extensions) ? extensions : [extensions];
        
        const walk = (currentDir) => {
            const entries = fs.readdirSync(currentDir);
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                    walk(fullPath);
                } else if (stat.isFile()) {
                    if (exts.some(ext => fullPath.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            });
        };
        
        walk(dir);
        return files;
    }
}

module.exports = PerformanceTestSuite;