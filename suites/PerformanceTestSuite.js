/**
 * PerformanceTestSuite - パフォーマンス関連の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const fs = require('fs');
const path = require('path');
const FileSizeAnalyzer = require('../lib/FileSizeAnalyzer');
const PerformanceAnalyzer = require('../lib/PerformanceAnalyzer');

class PerformanceTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Performance Validation',
            description: 'Chrome拡張機能のパフォーマンス要件を検証',
            config: config
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

        // JavaScript最適化の検証（PerformanceAnalyzer統合）
        this.test('JavaScript optimization', async (config) => {
            const analyzer = new PerformanceAnalyzer();
            const issues = await analyzer.analyze(config.extensionPath);
            
            // Heavy computation関連の問題を抽出
            const computationIssues = issues.filter(issue => issue.type === 'heavy_computation');
            const bundleIssues = issues.filter(issue => issue.type === 'large_bundle' || issue.type === 'duplicate_code');
            
            // JavaScript特有の問題をチェック
            const jsFiles = await this.findFilesByExtension(config.extensionPath, ['.js']);
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                const stats = fs.statSync(jsFile);
                
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
            
            // Heavy computation問題の表示
            if (computationIssues.length > 0) {
                console.warn('   ⚠️  Heavy computation patterns detected:');
                computationIssues.forEach(issue => {
                    const severity = issue.severity === 'critical' ? '🚨' : '❌';
                    console.warn(`      ${severity} ${issue.file}: ${issue.description}`);
                    if (issue.suggestion) {
                        console.warn(`         💡 ${issue.suggestion}`);
                    }
                });
            }
            
            // Bundle issues
            if (bundleIssues.length > 0) {
                console.warn('   ⚠️  Bundle optimization issues:');
                bundleIssues.forEach(issue => {
                    console.warn(`      ⚠️  ${issue.file}: ${issue.description}`);
                });
            }
            
            // Critical issues
            const criticalIssues = [...computationIssues, ...bundleIssues].filter(i => i.severity === 'critical');
            if (criticalIssues.length > 0) {
                const error = new Error(`${criticalIssues.length} critical JavaScript optimization issues detected`);
                error.code = 'JS_OPTIMIZATION_CRITICAL';
                error.severity = 'critical';
                error.details = criticalIssues;
                throw error;
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
                    const error = new Error('node_modules directory should not be included in extension');
                    error.code = 'NODE_MODULES';
                    error.category = 'PERFORMANCE_ERROR';
                    throw error;
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

        // メモリリークの潜在的リスク（PerformanceAnalyzer統合）
        this.test('Memory leak prevention', async (config) => {
            const analyzer = new PerformanceAnalyzer();
            const issues = await analyzer.analyze(config.extensionPath);
            const report = analyzer.generateReport();
            
            // メモリリーク関連の問題を抽出
            const memoryLeakIssues = issues.filter(issue => issue.type === 'memory_leak');
            
            if (memoryLeakIssues.length > 0) {
                console.warn('   ⚠️  Memory leak patterns detected:');
                memoryLeakIssues.forEach(issue => {
                    const severity = issue.severity === 'critical' ? '🚨' : 
                                   issue.severity === 'high' ? '❌' : '⚠️';
                    console.warn(`      ${severity} ${issue.file}: ${issue.description}`);
                    if (issue.occurrences) {
                        console.warn(`         Found ${issue.occurrences} occurrences`);
                    }
                });
                
                // 高セベリティの問題があればエラー
                const highSeverityIssues = memoryLeakIssues.filter(i => i.severity === 'high' || i.severity === 'critical');
                if (highSeverityIssues.length > 0) {
                    const error = new Error(`${highSeverityIssues.length} high-severity memory leak patterns detected`);
                    error.code = 'MEMORY_LEAK_DETECTED';
                    error.severity = 'high';
                    error.details = highSeverityIssues;
                    throw error;
                }
            }
        });

        // Service Worker効率性（PerformanceAnalyzer統合）
        this.test('Service worker efficiency', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (manifest.background && manifest.background.service_worker) {
                const swPath = path.join(config.extensionPath, manifest.background.service_worker);
                
                if (fs.existsSync(swPath)) {
                    const content = fs.readFileSync(swPath, 'utf8');
                    const analyzer = new PerformanceAnalyzer();
                    
                    // Service worker specific analysis
                    analyzer.detectMemoryLeaks(content, path.basename(swPath));
                    analyzer.detectHeavyComputation(content, path.basename(swPath));
                    
                    // Get any issues found
                    const swIssues = analyzer.issues.filter(i => i.file === path.basename(swPath));
                    
                    if (swIssues.length > 0) {
                        console.warn('   ⚠️  Service worker performance issues:');
                        swIssues.forEach(issue => {
                            console.warn(`      ❌ ${issue.description}`);
                        });
                    }
                    
                    // 永続的な接続の使用
                    if (/chrome\.runtime\.connect/g.test(content)) {
                        console.warn('   ⚠️  Persistent connections in service worker may impact performance');
                    }
                    
                    // 過度なストレージアクセス
                    const storageAccess = (content.match(/chrome\.storage\.(local|sync)\.(get|set)/g) || []).length;
                    if (storageAccess > 20) {
                        console.warn(`   ⚠️  Frequent storage access in service worker: ${storageAccess} calls`);
                    }
                    
                    // Critical issues in service worker
                    const criticalSWIssues = swIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
                    if (criticalSWIssues.length > 0) {
                        throw new Error(`Service worker has ${criticalSWIssues.length} critical performance issues`);
                    }
                }
            }
        });

        // ローディング時間の最適化（PerformanceAnalyzer統合）
        this.test('Loading time optimization', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const analyzer = new PerformanceAnalyzer();
            const issues = await analyzer.analyze(config.extensionPath);
            
            // Bundle size issues
            const bundleSizeIssues = issues.filter(i => i.type === 'bundle_size' || i.type === 'large_file');
            
            if (bundleSizeIssues.length > 0) {
                console.warn('   ⚠️  Bundle size issues affecting load time:');
                bundleSizeIssues.forEach(issue => {
                    console.warn(`      ❌ ${issue.description}`);
                    if (issue.suggestion) {
                        console.warn(`         💡 ${issue.suggestion}`);
                    }
                });
            }
            
            // Content scriptsの読み込みタイミング
            if (manifest.content_scripts) {
                manifest.content_scripts.forEach((script, index) => {
                    if (!script.run_at || script.run_at === 'document_idle') {
                        // document_idleはデフォルトで良い選択
                    } else if (script.run_at === 'document_start') {
                        console.warn(`   ⚠️  Content script ${index} runs at document_start - may impact page load`);
                    }
                    
                    // Check if content scripts are too large
                    if (script.js) {
                        script.js.forEach(jsFile => {
                            const filePath = path.join(config.extensionPath, jsFile);
                            if (fs.existsSync(filePath)) {
                                const stats = fs.statSync(filePath);
                                if (stats.size > 100 * 1024) {
                                    console.warn(`   ⚠️  Large content script: ${jsFile} (${(stats.size / 1024).toFixed(0)}KB)`);
                                }
                            }
                        });
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
            
            // Check for critical bundle size issues
            const criticalBundleIssues = bundleSizeIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
            if (criticalBundleIssues.length > 0) {
                throw new Error(`${criticalBundleIssues.length} critical loading time issues detected`);
            }
        });

        // アニメーションパフォーマンス（PerformanceAnalyzer統合）
        this.test('Animation performance', async (config) => {
            const analyzer = new PerformanceAnalyzer();
            const issues = await analyzer.analyze(config.extensionPath);
            
            // DOM and CSS performance issues
            const domIssues = issues.filter(i => i.type === 'excessive_dom');
            const cssIssues = issues.filter(i => i.type === 'css_performance');
            
            // Display DOM manipulation issues
            if (domIssues.length > 0) {
                console.warn('   ⚠️  DOM performance issues detected:');
                domIssues.forEach(issue => {
                    console.warn(`      ❌ ${issue.file}: ${issue.description}`);
                    if (issue.suggestion) {
                        console.warn(`         💡 ${issue.suggestion}`);
                    }
                });
            }
            
            // CSS performance check
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
            
            // Display CSS issues from analyzer
            if (cssIssues.length > 0) {
                console.warn('   ⚠️  CSS performance issues:');
                cssIssues.forEach(issue => {
                    console.warn(`      ⚠️  ${issue.file}: ${issue.description}`);
                });
            }
            
            // Check for critical animation/DOM issues
            const criticalAnimationIssues = [...domIssues, ...cssIssues].filter(i => i.severity === 'high' || i.severity === 'critical');
            if (criticalAnimationIssues.length > 0) {
                throw new Error(`${criticalAnimationIssues.length} critical animation/rendering performance issues detected`);
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