/**
 * StructureTestSuite - ファイル構造の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const { StructureError } = require('../lib/errors');
const fs = require('fs');
const path = require('path');

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

        // ファイル命名規則
        this.test('File naming conventions', async (config) => {
            const allFiles = await this.getAllFiles();
            const issues = [];
            
            for (const file of allFiles) {
                const basename = path.basename(file);
                
                // スペースを含むファイル名
                if (basename.includes(' ')) {
                    issues.push({
                        file,
                        issue: 'spaces',
                        message: `Space in filename: ${file}`
                    });
                }
                
                // 特殊文字を含むファイル名
                if (/[^a-zA-Z0-9._-]/.test(basename)) {
                    issues.push({
                        file,
                        issue: 'special',
                        message: `Special characters in filename: ${file}`
                    });
                }
                
                // 大文字で始まるファイル（画像とREADMEを除く）
                if (/^[A-Z]/.test(basename) && 
                    !basename.startsWith('README') && 
                    !basename.startsWith('LICENSE') &&
                    !basename.startsWith('CHANGELOG')) {
                    console.log(`   💡 Consider lowercase: ${file}`);
                }
            }
            
            if (issues.length > 0) {
                // Throw error for the first issue with detailed information
                const firstIssue = issues[0];
                throw StructureError.invalidNaming(firstIssue.file, firstIssue.issue);
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
                // Throw error for the first development file found
                throw StructureError.developmentFile(foundDevFiles[0]);
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
                // Throw error for the first missing file
                throw StructureError.fileNotFound(
                    missingFiles[0],
                    'This is a required file for Chrome extensions'
                );
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
    }
}

module.exports = StructureTestSuite;