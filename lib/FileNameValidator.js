/**
 * ファイル名バリデータークラス
 * Chrome拡張機能のファイル名の妥当性をチェックし、問題を検出する
 */

const path = require('path');

class FileNameValidator {
    constructor(options = {}) {
        // 設定のデフォルト値
        this.options = {
            allowSpaces: options.allowSpaces || false,
            allowSpecialChars: options.allowSpecialChars || false,
            checkPlatformCompatibility: options.checkPlatformCompatibility !== false,
            autoFixSuggestions: options.autoFixSuggestions !== false,
            ...options
        };

        // プラットフォーム別の制限
        this.platformLimits = {
            windows: {
                maxPathLength: 260,
                maxFileNameLength: 255,
                reservedNames: [
                    'CON', 'PRN', 'AUX', 'NUL',
                    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
                    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
                ],
                invalidChars: ['<', '>', ':', '"', '|', '?', '*', '\0']
            },
            mac: {
                maxPathLength: 1024,
                maxFileNameLength: 255,
                invalidChars: [':', '\0']
            },
            linux: {
                maxPathLength: 4096,
                maxFileNameLength: 255,
                invalidChars: ['\0']
            }
        };

        // 問題のあるパターン
        this.problematicPatterns = {
            spaces: /\s/,
            specialChars: /[!@#$%^&*()+=\[\]{};':"\\|,<>?]/,  // 拡張子のドットを除外
            nonAscii: /[^\x00-\x7F]/,
            leadingDot: /^\./,
            trailingDot: /\.$/,
            consecutiveDots: /\.\./,
            leadingHyphen: /^-/,
            trailingSpace: /\s$/,
            leadingSpace: /^\s/
        };

        // Chrome拡張機能で一般的に安全な文字セット
        this.safeCharSet = /^[a-zA-Z0-9._\-]+$/;

        // 検証結果
        this.results = {
            errors: [],
            warnings: [],
            suggestions: []
        };
    }

    /**
     * ファイル名またはパスを検証
     */
    validate(filePath, extensionPath = '') {
        this.results = {
            errors: [],
            warnings: [],
            suggestions: []
        };

        const fullPath = path.join(extensionPath, filePath);
        const fileName = path.basename(filePath);
        const dirName = path.dirname(filePath);

        // 基本的な検証
        this.validateFileName(fileName, filePath);
        this.validatePath(fullPath, filePath);

        // プラットフォーム互換性のチェック
        if (this.options.checkPlatformCompatibility) {
            this.checkPlatformCompatibility(fullPath, fileName, filePath);
        }

        // 自動修正の提案
        if (this.options.autoFixSuggestions && (this.results.errors.length > 0 || this.results.warnings.length > 0)) {
            this.generateFixSuggestions(fileName, filePath);
        }

        return this.results;
    }

    /**
     * ファイル名の検証
     */
    validateFileName(fileName, originalPath) {
        // 空のファイル名
        if (!fileName || fileName.trim() === '') {
            this.results.errors.push({
                type: 'empty-filename',
                severity: 'critical',
                message: 'Empty filename',
                file: originalPath
            });
            return;
        }

        // スペースのチェック
        if (this.problematicPatterns.spaces.test(fileName) && !this.options.allowSpaces) {
            this.results.warnings.push({
                type: 'spaces-in-filename',
                severity: 'high',
                message: `Filename contains spaces: "${fileName}"`,
                file: originalPath,
                details: 'Spaces in filenames can cause issues with URLs and some build tools'
            });
        }

        // 特殊文字のチェック
        if (this.problematicPatterns.specialChars.test(fileName) && !this.options.allowSpecialChars) {
            const specialChars = fileName.match(this.problematicPatterns.specialChars);
            this.results.errors.push({
                type: 'special-characters',
                severity: 'high',
                message: `Filename contains special characters: ${specialChars.join(', ')}`,
                file: originalPath,
                details: 'Special characters can cause issues with URLs, build tools, and cross-platform compatibility'
            });
        }

        // 非ASCII文字のチェック
        if (this.problematicPatterns.nonAscii.test(fileName)) {
            this.results.warnings.push({
                type: 'non-ascii-characters',
                severity: 'medium',
                message: `Filename contains non-ASCII characters: "${fileName}"`,
                file: originalPath,
                details: 'Non-ASCII characters may cause encoding issues'
            });
        }

        // セーフな文字セットのチェック
        if (!this.safeCharSet.test(fileName)) {
            this.results.warnings.push({
                type: 'unsafe-characters',
                severity: 'medium',
                message: `Filename contains characters outside safe set: "${fileName}"`,
                file: originalPath,
                details: 'Recommended to use only alphanumeric characters, dots, hyphens, and underscores'
            });
        }

        // 先頭・末尾の問題
        if (this.problematicPatterns.leadingDot.test(fileName)) {
            this.results.warnings.push({
                type: 'leading-dot',
                severity: 'low',
                message: `Hidden file detected: "${fileName}"`,
                file: originalPath
            });
        }

        if (this.problematicPatterns.trailingDot.test(fileName)) {
            this.results.errors.push({
                type: 'trailing-dot',
                severity: 'high',
                message: `Filename ends with dot: "${fileName}"`,
                file: originalPath,
                details: 'Windows strips trailing dots from filenames'
            });
        }

        if (this.problematicPatterns.leadingSpace.test(fileName) || this.problematicPatterns.trailingSpace.test(fileName)) {
            this.results.errors.push({
                type: 'whitespace-edges',
                severity: 'high',
                message: `Filename has leading or trailing spaces: "${fileName}"`,
                file: originalPath
            });
        }
    }

    /**
     * パスの検証
     */
    validatePath(fullPath, originalPath) {
        // パスの深さをチェック
        const pathDepth = fullPath.split(path.sep).filter(p => p).length;
        if (pathDepth > 8) {
            this.results.warnings.push({
                type: 'deep-nesting',
                severity: 'medium',
                message: `Path is deeply nested (${pathDepth} levels)`,
                file: originalPath,
                details: 'Deep nesting can make the project harder to maintain'
            });
        }

        // 連続するドット（親ディレクトリ参照）
        if (this.problematicPatterns.consecutiveDots.test(fullPath)) {
            this.results.errors.push({
                type: 'parent-directory-reference',
                severity: 'critical',
                message: 'Path contains parent directory reference (..)',
                file: originalPath,
                details: 'Parent directory references can be a security risk'
            });
        }
    }

    /**
     * プラットフォーム互換性のチェック
     */
    checkPlatformCompatibility(fullPath, fileName, originalPath) {
        const issues = [];

        // 各プラットフォームでチェック
        for (const [platform, limits] of Object.entries(this.platformLimits)) {
            // パス長のチェック
            if (fullPath.length > limits.maxPathLength) {
                issues.push({
                    platform,
                    issue: `Path too long (${fullPath.length} > ${limits.maxPathLength})`
                });
            }

            // ファイル名長のチェック
            if (fileName.length > limits.maxFileNameLength) {
                issues.push({
                    platform,
                    issue: `Filename too long (${fileName.length} > ${limits.maxFileNameLength})`
                });
            }

            // 予約語のチェック（Windowsのみ）
            if (limits.reservedNames) {
                const baseName = fileName.split('.')[0].toUpperCase();
                if (limits.reservedNames.includes(baseName)) {
                    issues.push({
                        platform,
                        issue: `Reserved filename: ${baseName}`
                    });
                }
            }

            // 無効な文字のチェック
            for (const char of limits.invalidChars) {
                if (fileName.includes(char) || (char !== '/' && fullPath.includes(char))) {
                    issues.push({
                        platform,
                        issue: `Invalid character: "${char}"`
                    });
                }
            }
        }

        // 問題があればエラーまたは警告を追加
        if (issues.length > 0) {
            const platforms = [...new Set(issues.map(i => i.platform))];
            const severity = platforms.includes('windows') ? 'high' : 'medium';
            
            this.results.errors.push({
                type: 'platform-compatibility',
                severity,
                message: `File incompatible with ${platforms.join(', ')}`,
                file: originalPath,
                details: issues.map(i => `${i.platform}: ${i.issue}`).join('; ')
            });
        }
    }

    /**
     * 修正案の生成
     */
    generateFixSuggestions(fileName, originalPath) {
        let suggestedName = fileName;

        // スペースをアンダースコアに置換
        if (this.problematicPatterns.spaces.test(suggestedName)) {
            suggestedName = suggestedName.replace(/\s+/g, '_');
        }

        // 特殊文字を削除またはアンダースコアに置換
        if (this.problematicPatterns.specialChars.test(suggestedName)) {
            suggestedName = suggestedName.replace(/[!@#$%^&*()+=\[\]{};':"\\|,<>?]/g, '_');
        }

        // 先頭・末尾の空白を削除
        suggestedName = suggestedName.trim();

        // 末尾のドットを削除
        suggestedName = suggestedName.replace(/\.+$/, '');

        // 連続するアンダースコアを単一に
        suggestedName = suggestedName.replace(/_+/g, '_');

        // 非ASCII文字をローマ字化または削除（簡易的な処理）
        if (this.problematicPatterns.nonAscii.test(suggestedName)) {
            suggestedName = suggestedName.replace(/[^\x00-\x7F]/g, '');
        }

        // 変更があれば提案を追加
        if (suggestedName !== fileName && suggestedName.trim() !== '') {
            this.results.suggestions.push({
                type: 'rename-file',
                original: originalPath,
                suggested: path.join(path.dirname(originalPath), suggestedName),
                reason: 'Fix filename compatibility issues'
            });
        }
    }

    /**
     * ディレクトリ内のすべてのファイルを検証
     */
    async validateDirectory(dirPath, extensionPath = '') {
        const fs = require('fs').promises;
        const allResults = {
            totalFiles: 0,
            problematicFiles: 0,
            errors: [],
            warnings: [],
            suggestions: []
        };

        async function scanDir(currentPath, basePath) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relativePath = path.relative(basePath, fullPath);
                
                if (entry.isDirectory()) {
                    // ディレクトリ名も検証
                    const validator = new FileNameValidator(this.options);
                    const dirResults = validator.validate(relativePath, '');
                    
                    allResults.errors.push(...dirResults.errors);
                    allResults.warnings.push(...dirResults.warnings);
                    allResults.suggestions.push(...dirResults.suggestions);
                    
                    if (dirResults.errors.length > 0 || dirResults.warnings.length > 0) {
                        allResults.problematicFiles++;
                    }
                    
                    // 再帰的にスキャン
                    await scanDir.call(this, fullPath, basePath);
                } else if (entry.isFile()) {
                    allResults.totalFiles++;
                    
                    const validator = new FileNameValidator(this.options);
                    const results = validator.validate(relativePath, '');
                    
                    allResults.errors.push(...results.errors);
                    allResults.warnings.push(...results.warnings);
                    allResults.suggestions.push(...results.suggestions);
                    
                    if (results.errors.length > 0 || results.warnings.length > 0) {
                        allResults.problematicFiles++;
                    }
                }
            }
        }

        await scanDir.call(this, dirPath, extensionPath || dirPath);
        return allResults;
    }
}

module.exports = FileNameValidator;