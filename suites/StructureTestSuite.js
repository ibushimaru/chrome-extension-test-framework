/**
 * StructureTestSuite - ファイル構造の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const fs = require('fs');
const path = require('path');
const FileNameValidator = require('../lib/FileNameValidator');
const DirectoryAnalyzer = require('../lib/DirectoryAnalyzer');

class StructureTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Structure Validation',
            description: 'Chrome拡張機能のファイル構造を検証',
            config: config
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // ディレクトリ構造の確認
        this.test('Directory structure', async (config) => {
            const rootFiles = await this.readDirectory('');
            const directories = [];
            const files = [];
            
            for (const item of rootFiles) {
                const fullPath = path.join(config.extensionPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    directories.push(item);
                } else {
                    files.push(item);
                }
            }
            
            console.log(`   📁 Directories: ${directories.join(', ') || 'none'}`);
            console.log(`   📄 Root files: ${files.length}`);
            
            // 推奨ディレクトリ構造
            const recommendedDirs = ['js', 'css', 'images', 'icons', '_locales'];
            const missingRecommended = recommendedDirs.filter(dir => !directories.includes(dir));
            
            if (missingRecommended.length > 0) {
                console.log(`   💡 Consider creating: ${missingRecommended.join(', ')}`);
            }
        });

        // ファイル命名規則（改善版）
        this.test('File naming conventions', async (config) => {
            const fileValidator = new FileNameValidator({
                checkPlatformCompatibility: true,
                autoFixSuggestions: true,
                excludeManager: this.config.excludeManager
            });
            
            const results = await fileValidator.validateDirectory(config.extensionPath);
            
            // エラーと警告の表示
            let hasIssues = false;
            
            // クリティカルなエラーを表示
            const criticalErrors = results.errors.filter(e => e.severity === 'critical');
            if (criticalErrors.length > 0) {
                criticalErrors.forEach(error => {
                    console.error(`   🚨 ${error.message}`);
                    if (error.details) console.error(`      → ${error.details}`);
                });
                hasIssues = true;
            }
            
            // その他のエラーを表示
            const otherErrors = results.errors.filter(e => e.severity !== 'critical');
            if (otherErrors.length > 0) {
                otherErrors.forEach(error => {
                    console.warn(`   ❌ ${error.message}`);
                    if (error.details) console.warn(`      → ${error.details}`);
                });
                hasIssues = true;
            }
            
            // 重要な警告を表示
            const highWarnings = results.warnings.filter(w => w.severity === 'high');
            if (highWarnings.length > 0) {
                highWarnings.forEach(warning => {
                    console.warn(`   ⚠️  ${warning.message}`);
                });
                hasIssues = true;
            }
            
            // 修正提案を表示
            if (results.suggestions.length > 0 && config.verbose) {
                console.log('   💡 Suggested fixes:');
                results.suggestions.forEach(suggestion => {
                    console.log(`      - Rename "${suggestion.original}" to "${suggestion.suggested}"`);
                });
            }
            
            // サマリー
            if (results.problematicFiles > 0) {
                console.log(`   📊 ${results.problematicFiles}/${results.totalFiles} files have naming issues`);
            }
            
            // クリティカルなエラーがある場合は例外を投げる
            if (criticalErrors.length > 0) {
                const error = new Error(`Critical file naming issues detected: ${criticalErrors.length} files`);
                error.code = 'FILE_NAMING_CRITICAL';
                error.details = results;
                throw error;
            }
        });

        // 開発用ファイルの除外確認
        this.test('No development files', async (config) => {
            const allFiles = await this.getAllFiles();
            const devFiles = [
                '.git', '.gitignore', '.gitattributes',
                'node_modules', 'package.json', 'package-lock.json',
                'yarn.lock', 'pnpm-lock.yaml',
                '.env', '.env.local', '.env.development',
                'webpack.config.js', 'rollup.config.js', 'vite.config.js',
                'tsconfig.json', 'babel.config.js',
                '.eslintrc', '.prettierrc',
                'Makefile', 'Dockerfile',
                '.DS_Store', 'Thumbs.db',
                '*.log', '*.map', '*.test.js', '*.spec.js'
            ];
            
            const foundDevFiles = [];
            
            for (const file of allFiles) {
                const basename = path.basename(file);
                const dirname = path.dirname(file);
                
                // 完全一致
                if (devFiles.includes(basename)) {
                    foundDevFiles.push(file);
                    continue;
                }
                
                // パターンマッチ
                for (const pattern of devFiles) {
                    if (pattern.startsWith('*')) {
                        const ext = pattern.substring(1);
                        if (basename.endsWith(ext)) {
                            foundDevFiles.push(file);
                            break;
                        }
                    }
                }
                
                // node_modulesディレクトリ
                if (dirname.includes('node_modules')) {
                    foundDevFiles.push(file);
                }
            }
            
            if (foundDevFiles.length > 0) {
                throw new Error(`Development files found: ${foundDevFiles.join(', ')}`);
            }
        });

        // 必須ファイルの存在確認
        this.test('Required files present', async (config) => {
            const requiredFiles = ['manifest.json'];
            const missingFiles = [];
            
            for (const file of requiredFiles) {
                if (!await this.fileExists(file)) {
                    missingFiles.push(file);
                }
            }
            
            if (missingFiles.length > 0) {
                throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
            }
            
            // 推奨ファイル
            const recommendedFiles = ['README.md', 'LICENSE'];
            for (const file of recommendedFiles) {
                if (!await this.fileExists(file)) {
                    console.log(`   💡 Consider adding: ${file}`);
                }
            }
        });

        // モジュール構造の検証
        this.test('Module structure', async (config) => {
            const allFiles = await this.getAllFiles();
            const jsFiles = allFiles.filter(file => file.endsWith('.js'));
            
            // ES6モジュールの使用確認
            let moduleCount = 0;
            let legacyCount = 0;
            
            for (const jsFile of jsFiles) {
                const content = await this.loadFile(jsFile);
                
                if (content.includes('import ') || content.includes('export ')) {
                    moduleCount++;
                } else {
                    legacyCount++;
                }
            }
            
            if (moduleCount > 0 && legacyCount > 0) {
                console.warn('   ⚠️  Mixed module systems detected. Consider using ES6 modules consistently.');
            }
            
            // manifest.jsonでのtype: "module"確認
            const manifest = await this.loadManifest(config);
            if (manifest.background?.service_worker && moduleCount > 0) {
                if (!manifest.background.type || manifest.background.type !== 'module') {
                    console.warn('   ⚠️  ES6 modules used but background.type is not "module"');
                }
            }
        });

        // 重複ファイルの検出
        this.test('No duplicate files', async (config) => {
            const allFiles = await this.getAllFiles();
            const filesBySize = {};
            
            // サイズでグループ化
            for (const file of allFiles) {
                const size = await this.getFileSize(file);
                if (!filesBySize[size]) {
                    filesBySize[size] = [];
                }
                filesBySize[size].push(file);
            }
            
            // 同じサイズのファイルをチェック
            const duplicates = [];
            for (const [size, files] of Object.entries(filesBySize)) {
                if (files.length > 1) {
                    // 内容を比較（簡易的にファイル名で判断）
                    const baseNames = files.map(f => path.basename(f));
                    const uniqueNames = [...new Set(baseNames)];
                    
                    if (uniqueNames.length < files.length) {
                        duplicates.push(...files);
                    }
                }
            }
            
            if (duplicates.length > 0) {
                console.warn(`   ⚠️  Possible duplicate files: ${duplicates.join(', ')}`);
            }
        });

        // ファイル編成の確認
        this.test('File organization', async (config) => {
            const allFiles = await this.getAllFiles();
            const misplacedFiles = [];
            
            for (const file of allFiles) {
                const ext = path.extname(file).toLowerCase();
                const dir = path.dirname(file);
                const basename = path.basename(file);
                
                // ルートディレクトリの整理されていないファイル
                if (dir === '.' && !['manifest.json', 'README.md', 'LICENSE', 'CHANGELOG.md'].includes(basename)) {
                    if (['.js', '.css', '.html'].includes(ext)) {
                        misplacedFiles.push(file);
                    }
                }
                
                // 適切なディレクトリにあるか
                if (ext === '.js' && !dir.includes('js') && dir !== '.') {
                    console.log(`   💡 JavaScript file not in js/ directory: ${file}`);
                }
                if (ext === '.css' && !dir.includes('css') && dir !== '.') {
                    console.log(`   💡 CSS file not in css/ directory: ${file}`);
                }
                if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext) && 
                    !dir.includes('image') && !dir.includes('icon') && !dir.includes('assets')) {
                    console.log(`   💡 Image file not in appropriate directory: ${file}`);
                }
            }
            
            if (misplacedFiles.length > 0) {
                console.warn(`   ⚠️  Files in root directory should be organized: ${misplacedFiles.join(', ')}`);
            }
        });

        // ディレクトリ構造の深度分析
        this.test('Directory depth analysis', async (config) => {
            const analyzer = new DirectoryAnalyzer({
                maxDepth: 5,
                maxPathLength: 260,
                maxFilesPerDirectory: 50,
                excludeManager: this.config.excludeManager
            });
            
            const analysis = await analyzer.analyze(config.extensionPath);
            const report = analyzer.generateReport();
            
            // メトリクスの表示
            if (config.verbose) {
                console.log('   📊 Directory structure metrics:');
                console.log(`      - Total files: ${report.summary.totalFiles}`);
                console.log(`      - Total directories: ${report.summary.totalDirectories}`);
                console.log(`      - Max depth: ${report.summary.maxDepth}`);
                console.log(`      - Average depth: ${report.summary.averageDepth}`);
                if (analysis.metrics.deepestPath) {
                    console.log(`      - Deepest path: ${analysis.metrics.deepestPath}`);
                }
            }
            
            // 問題の表示
            if (analysis.issues.length > 0) {
                analysis.issues.forEach(issue => {
                    const icon = issue.severity === 'critical' ? '🚨' :
                                issue.severity === 'high' ? '❌' :
                                issue.severity === 'medium' ? '⚠️' : '💡';
                    console.warn(`   ${icon} ${issue.message}`);
                    if (issue.details) {
                        console.warn(`      → ${issue.details}`);
                    }
                    if (issue.recommendation) {
                        console.log(`      💡 ${issue.recommendation}`);
                    }
                });
            }
            
            // 提案の表示
            if (analysis.suggestions.length > 0 && config.verbose) {
                console.log('   💡 Structure improvements:');
                analysis.suggestions.forEach(suggestion => {
                    console.log(`      - ${suggestion.suggestion}`);
                    if (suggestion.examples) {
                        suggestion.examples.forEach(example => {
                            console.log(`        • ${example}`);
                        });
                    }
                });
            }
            
            // ツリー表示（詳細モード）
            if (config.verbose && analysis.issues.length > 0) {
                console.log('   📁 Directory tree:');
                const treeLines = report.tree.split('\n');
                treeLines.slice(0, 20).forEach(line => {
                    console.log(`      ${line}`);
                });
                if (treeLines.length > 20) {
                    console.log(`      ... (${treeLines.length - 20} more lines)`);
                }
            }
            
            // クリティカルな問題がある場合は例外を投げる
            const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
            if (criticalIssues.length > 0) {
                const error = new Error(`Critical directory structure issues: ${criticalIssues[0].message}`);
                error.code = 'DIRECTORY_STRUCTURE_CRITICAL';
                error.details = analysis;
                throw error;
            }
        });
    }
}

module.exports = StructureTestSuite;