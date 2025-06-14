/**
 * StructureTestSuite - ファイル構造とディレクトリ構成の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const fs = require('fs');
const path = require('path');

class StructureTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Structure Validation',
            description: 'Chrome拡張機能のファイル構造を検証'
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // 基本的なディレクトリ構造
        this.test('Basic directory structure', async (config) => {
            const recommendedDirs = [
                { path: 'images', required: false },
                { path: 'icons', required: false },
                { path: 'js', required: false },
                { path: 'css', required: false },
                { path: 'lib', required: false },
                { path: '_locales', required: false }
            ];
            
            const existingDirs = [];
            const rootFiles = fs.readdirSync(config.extensionPath);
            
            recommendedDirs.forEach(dir => {
                const dirPath = path.join(config.extensionPath, dir.path);
                if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                    existingDirs.push(dir.path);
                }
            });
            
            // ルートディレクトリの整理状態
            const jsInRoot = rootFiles.filter(f => f.endsWith('.js')).length;
            const cssInRoot = rootFiles.filter(f => f.endsWith('.css')).length;
            
            if (jsInRoot > 3) {
                console.warn(`   ⚠️  Many JS files in root (${jsInRoot}) - consider organizing in js/ directory`);
            }
            
            if (cssInRoot > 2) {
                console.warn(`   ⚠️  Many CSS files in root (${cssInRoot}) - consider organizing in css/ directory`);
            }
        });

        // HTMLファイルの構造
        this.test('HTML files structure', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // popup.htmlの検証
            if (manifest.action && manifest.action.default_popup) {
                const popupPath = path.join(config.extensionPath, manifest.action.default_popup);
                if (!fs.existsSync(popupPath)) {
                    throw new Error(`Popup HTML not found: ${manifest.action.default_popup}`);
                }
                
                // ポップアップのサイズ推奨
                const content = fs.readFileSync(popupPath, 'utf8');
                if (!content.includes('width') && !content.includes('min-width')) {
                    console.warn('   ⚠️  Popup HTML should define explicit width');
                }
            }
            
            // options.htmlの検証
            if (manifest.options_page) {
                const optionsPath = path.join(config.extensionPath, manifest.options_page);
                if (!fs.existsSync(optionsPath)) {
                    throw new Error(`Options page not found: ${manifest.options_page}`);
                }
            } else if (manifest.options_ui && manifest.options_ui.page) {
                const optionsPath = path.join(config.extensionPath, manifest.options_ui.page);
                if (!fs.existsSync(optionsPath)) {
                    throw new Error(`Options UI page not found: ${manifest.options_ui.page}`);
                }
            }
        });

        // リソースファイルの整理
        this.test('Resource files organization', async (config) => {
            const allFiles = await this.getAllFiles(config.extensionPath);
            
            // 画像ファイルの配置
            const imageFiles = allFiles.filter(f => 
                /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f)
            );
            
            const imagesInRoot = imageFiles.filter(f => 
                path.dirname(f) === config.extensionPath
            );
            
            if (imagesInRoot.length > 5) {
                console.warn(`   ⚠️  ${imagesInRoot.length} image files in root - consider organizing in images/ or icons/`);
            }
            
            // フォントファイル
            const fontFiles = allFiles.filter(f => 
                /\.(woff|woff2|ttf|otf|eot)$/i.test(f)
            );
            
            if (fontFiles.length > 0) {
                const fontsInRoot = fontFiles.filter(f => 
                    path.dirname(f) === config.extensionPath
                );
                
                if (fontsInRoot.length > 0) {
                    console.warn('   ⚠️  Font files should be organized in fonts/ directory');
                }
            }
        });

        // 開発用ファイルの除外
        this.test('Development files excluded', async (config) => {
            const devFiles = [
                '.git',
                '.gitignore',
                'node_modules',
                'package-lock.json',
                'yarn.lock',
                '.eslintrc',
                '.prettierrc',
                'tsconfig.json',
                'webpack.config.js',
                '.babelrc',
                'Gruntfile.js',
                'gulpfile.js',
                '.env',
                '.env.local',
                '.DS_Store',
                'Thumbs.db'
            ];
            
            const foundDevFiles = [];
            
            devFiles.forEach(file => {
                const filePath = path.join(config.extensionPath, file);
                if (fs.existsSync(filePath)) {
                    foundDevFiles.push(file);
                }
            });
            
            if (foundDevFiles.length > 0) {
                throw new Error(`Development files found: ${foundDevFiles.join(', ')}`);
            }
            
            // ソースマップファイル
            const allFiles = await this.getAllFiles(config.extensionPath);
            const sourceMaps = allFiles.filter(f => f.endsWith('.map'));
            
            if (sourceMaps.length > 0) {
                console.warn(`   ⚠️  Source map files found: ${sourceMaps.length} files`);
            }
        });

        // ファイル命名規則
        this.test('File naming conventions', async (config) => {
            const allFiles = await this.getAllFiles(config.extensionPath);
            
            const issues = [];
            
            allFiles.forEach(file => {
                const basename = path.basename(file);
                
                // スペースを含むファイル名
                if (basename.includes(' ')) {
                    issues.push(`Space in filename: ${basename}`);
                }
                
                // 特殊文字
                if (/[^\w\-\.\/]/.test(basename)) {
                    const specialChars = basename.match(/[^\w\-\.\/]/g);
                    if (specialChars && !basename.includes('_locales')) {
                        issues.push(`Special characters in filename: ${basename}`);
                    }
                }
                
                // 大文字で始まるファイル（一般的でない）
                if (/^[A-Z]/.test(basename) && !basename.includes('README')) {
                    console.warn(`   ⚠️  Uppercase filename: ${basename}`);
                }
            });
            
            if (issues.length > 0) {
                throw new Error(`Naming convention issues:\n${issues.join('\n')}`);
            }
        });

        // モジュール構造の検証
        this.test('Module structure validation', async (config) => {
            const jsFiles = await this.findFilesByExtension(config.extensionPath, '.js');
            
            // 非常に大きなファイルの検出
            jsFiles.forEach(file => {
                const stats = fs.statSync(file);
                const lines = fs.readFileSync(file, 'utf8').split('\n').length;
                
                if (lines > 1000) {
                    console.warn(`   ⚠️  Large JS file: ${path.basename(file)} (${lines} lines) - consider splitting`);
                }
            });
            
            // グローバル変数の使用チェック
            jsFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                
                // varの使用（古いスタイル）
                const varCount = (content.match(/\bvar\s+/g) || []).length;
                if (varCount > 10) {
                    console.warn(`   ⚠️  Many 'var' declarations in ${path.basename(file)} - consider using let/const`);
                }
            });
        });

        // アイコンファイルの検証
        this.test('Icon files validation', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (manifest.icons) {
                const requiredSizes = {
                    '16': { min: 16, max: 16 },
                    '48': { min: 48, max: 48 },
                    '128': { min: 128, max: 128 }
                };
                
                Object.entries(manifest.icons).forEach(([size, iconPath]) => {
                    const fullPath = path.join(config.extensionPath, iconPath);
                    
                    if (fs.existsSync(fullPath)) {
                        // ファイル形式の確認
                        if (!iconPath.endsWith('.png') && !iconPath.endsWith('.svg')) {
                            console.warn(`   ⚠️  Icon ${size} should be PNG or SVG format`);
                        }
                        
                        // ファイルサイズの確認
                        const stats = fs.statSync(fullPath);
                        if (stats.size > 50 * 1024) { // 50KB
                            console.warn(`   ⚠️  Icon ${size} is large: ${(stats.size / 1024).toFixed(1)}KB`);
                        }
                    }
                });
            }
        });

        // ドキュメントファイルの存在
        this.test('Documentation files', async (config) => {
            const docFiles = ['README.md', 'LICENSE', 'CHANGELOG.md'];
            const foundDocs = [];
            
            docFiles.forEach(doc => {
                const docPath = path.join(config.extensionPath, doc);
                if (fs.existsSync(docPath)) {
                    foundDocs.push(doc);
                }
            });
            
            if (foundDocs.length === 0) {
                console.warn('   ⚠️  No documentation files found (README.md recommended)');
            }
            
            // LICENSEファイルの推奨
            if (!foundDocs.includes('LICENSE')) {
                console.warn('   ⚠️  No LICENSE file found');
            }
        });

        // 重複ファイルの検出
        this.test('Duplicate files detection', async (config) => {
            const allFiles = await this.getAllFiles(config.extensionPath);
            const filesByName = new Map();
            
            allFiles.forEach(file => {
                const basename = path.basename(file);
                if (!filesByName.has(basename)) {
                    filesByName.set(basename, []);
                }
                filesByName.get(basename).push(file);
            });
            
            const duplicates = [];
            filesByName.forEach((files, name) => {
                if (files.length > 1 && !name.includes('messages.json')) {
                    duplicates.push({
                        name,
                        locations: files.map(f => path.relative(config.extensionPath, f))
                    });
                }
            });
            
            if (duplicates.length > 0) {
                console.warn('   ⚠️  Duplicate filenames found:');
                duplicates.forEach(dup => {
                    console.warn(`      - ${dup.name} in: ${dup.locations.join(', ')}`);
                });
            }
        });
    }

    /**
     * すべてのファイルを取得
     */
    async getAllFiles(dir) {
        const files = [];
        
        const walk = (currentDir) => {
            const entries = fs.readdirSync(currentDir);
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                    walk(fullPath);
                } else if (stat.isFile()) {
                    files.push(fullPath);
                }
            });
        };
        
        walk(dir);
        return files;
    }

    /**
     * 拡張子でファイルを検索
     */
    async findFilesByExtension(dir, extension) {
        const allFiles = await this.getAllFiles(dir);
        return allFiles.filter(file => file.endsWith(extension));
    }
}

module.exports = StructureTestSuite;