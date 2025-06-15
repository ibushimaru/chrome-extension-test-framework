/**
 * AutoFixer - Chrome拡張機能の一般的な問題を自動修正
 */

const fs = require('fs');
const path = require('path');

class AutoFixer {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.fixes = [];
        this.backups = new Map();
    }

    /**
     * 修正を記録
     */
    recordFix(type, file, description, before, after) {
        const fix = {
            type,
            file,
            description,
            before,
            after,
            timestamp: new Date().toISOString()
        };
        this.fixes.push(fix);
        
        if (this.verbose) {
            console.log(`🔧 ${type}: ${description}`);
            if (file) {
                console.log(`   File: ${file}`);
            }
            if (before && after) {
                console.log(`   Before: ${before}`);
                console.log(`   After: ${after}`);
            }
        }
    }

    /**
     * ファイルのバックアップを作成
     */
    backupFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        this.backups.set(filePath, content);
    }

    /**
     * ファイルを書き込み（dryRunモードでは実際には書き込まない）
     */
    writeFile(filePath, content) {
        this.backupFile(filePath);

        if (!this.dryRun) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }

    /**
     * manifest.jsonの自動修正
     */
    async fixManifest(extensionPath) {
        const manifestPath = path.join(extensionPath, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            // manifest.jsonが存在しない場合は作成
            const defaultManifest = {
                manifest_version: 3,
                name: "My Extension",
                version: "1.0.0",
                description: "A Chrome extension"
            };
            
            this.writeFile(manifestPath, JSON.stringify(defaultManifest, null, 2));
            this.recordFix(
                'CREATE_FILE',
                'manifest.json',
                'Created missing manifest.json with default values',
                null,
                JSON.stringify(defaultManifest, null, 2)
            );
            return true;
        }

        let content = fs.readFileSync(manifestPath, 'utf8');
        let manifest;
        let fixed = false;

        // JSONパースエラーの修正
        try {
            manifest = JSON.parse(content);
        } catch (error) {
            // 一般的なJSONエラーを修正
            const originalContent = content;
            
            // 末尾のカンマを削除
            content = content.replace(/,(\s*[}\]])/g, '$1');
            
            // 非標準のコメントを削除
            content = content.replace(/\/\/.*$/gm, '');
            content = content.replace(/\/\*[\s\S]*?\*\//g, '');
            
            try {
                manifest = JSON.parse(content);
                this.recordFix(
                    'FIX_JSON',
                    manifestPath,
                    'Fixed JSON syntax errors',
                    originalContent.substring(0, 100) + '...',
                    content.substring(0, 100) + '...'
                );
                fixed = true;
            } catch (e) {
                console.error('❌ Unable to fix JSON syntax errors automatically');
                return false;
            }
        }

        // manifest_versionの修正
        if (!manifest.manifest_version || manifest.manifest_version !== 3) {
            this.recordFix(
                'UPDATE_FIELD',
                manifestPath,
                'Updated manifest_version to 3',
                `manifest_version: ${manifest.manifest_version}`,
                'manifest_version: 3'
            );
            manifest.manifest_version = 3;
            fixed = true;
        }

        // 必須フィールドの追加
        const requiredFields = {
            name: "My Extension",
            version: "1.0.0"
        };

        for (const [field, defaultValue] of Object.entries(requiredFields)) {
            if (!manifest[field]) {
                this.recordFix(
                    'ADD_FIELD',
                    manifestPath,
                    `Added missing required field: ${field}`,
                    null,
                    `${field}: "${defaultValue}"`
                );
                manifest[field] = defaultValue;
                fixed = true;
            }
        }

        // バージョン形式の修正
        if (manifest.version && !/^\d+(\.\d+){0,3}$/.test(manifest.version)) {
            const oldVersion = manifest.version;
            // 非数値文字を削除し、適切な形式に変換
            let newVersion = manifest.version.replace(/[^\d.]/g, '');
            const parts = newVersion.split('.').filter(p => p).slice(0, 4);
            
            if (parts.length === 0) {
                newVersion = '1.0.0';
            } else {
                newVersion = parts.join('.');
            }
            
            this.recordFix(
                'FIX_VERSION',
                manifestPath,
                'Fixed version format',
                oldVersion,
                newVersion
            );
            manifest.version = newVersion;
            fixed = true;
        }

        // 長すぎる名前の修正
        if (manifest.name && manifest.name.length > 45) {
            const oldName = manifest.name;
            manifest.name = manifest.name.substring(0, 45);
            this.recordFix(
                'TRUNCATE_FIELD',
                manifestPath,
                'Truncated name to 45 characters',
                oldName,
                manifest.name
            );
            fixed = true;
        }

        // 長すぎる説明の修正
        if (manifest.description && manifest.description.length > 132) {
            const oldDesc = manifest.description;
            manifest.description = manifest.description.substring(0, 132);
            this.recordFix(
                'TRUNCATE_FIELD',
                manifestPath,
                'Truncated description to 132 characters',
                oldDesc,
                manifest.description
            );
            fixed = true;
        }

        // Manifest V2からV3への移行修正
        if (manifest.background) {
            // background.scriptsをservice_workerに変換
            if (manifest.background.scripts && !manifest.background.service_worker) {
                const mainScript = manifest.background.scripts[0] || 'background.js';
                this.recordFix(
                    'MIGRATE_V2_TO_V3',
                    manifestPath,
                    'Converted background.scripts to service_worker',
                    `background.scripts: ${JSON.stringify(manifest.background.scripts)}`,
                    `background.service_worker: "${mainScript}"`
                );
                manifest.background = {
                    service_worker: mainScript
                };
                fixed = true;
            }

            // persistentフラグを削除
            if ('persistent' in manifest.background) {
                delete manifest.background.persistent;
                this.recordFix(
                    'REMOVE_FIELD',
                    manifestPath,
                    'Removed deprecated persistent flag from background',
                    'persistent: true/false',
                    null
                );
                fixed = true;
            }
        }

        // browser_actionをactionに変換
        if (manifest.browser_action && !manifest.action) {
            this.recordFix(
                'MIGRATE_V2_TO_V3',
                manifestPath,
                'Converted browser_action to action',
                'browser_action',
                'action'
            );
            manifest.action = manifest.browser_action;
            delete manifest.browser_action;
            fixed = true;
        }

        // page_actionを削除（V3では非推奨）
        if (manifest.page_action) {
            delete manifest.page_action;
            this.recordFix(
                'REMOVE_FIELD',
                manifestPath,
                'Removed deprecated page_action',
                'page_action',
                null
            );
            fixed = true;
        }

        if (fixed) {
            const formattedContent = JSON.stringify(manifest, null, 2);
            this.writeFile(manifestPath, formattedContent);
        }

        return fixed;
    }

    /**
     * ファイル名の自動修正
     */
    async fixFileNames(extensionPath) {
        const fixes = [];
        const processDirectory = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(extensionPath, fullPath);
                
                // スキップするディレクトリ
                if (entry.isDirectory()) {
                    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                        continue;
                    }
                    processDirectory(fullPath);
                    continue;
                }

                let newName = entry.name;
                let needsFix = false;

                // スペースをアンダースコアに置換
                if (newName.includes(' ')) {
                    newName = newName.replace(/\s+/g, '_');
                    needsFix = true;
                }

                // 特殊文字を削除（拡張子のドットは除く）
                const nameParts = newName.split('.');
                const nameWithoutExt = nameParts.slice(0, -1).join('.');
                const ext = nameParts[nameParts.length - 1];
                
                if (/[^a-zA-Z0-9._-]/.test(nameWithoutExt)) {
                    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '');
                    newName = cleanName + '.' + ext;
                    needsFix = true;
                }

                // 大文字を小文字に変換（一部のファイルを除く）
                const allowedUppercase = ['README', 'LICENSE', 'CHANGELOG'];
                if (!allowedUppercase.some(prefix => entry.name.startsWith(prefix))) {
                    const lowerName = newName.toLowerCase();
                    if (lowerName !== newName) {
                        newName = lowerName;
                        needsFix = true;
                    }
                }

                if (needsFix) {
                    const newPath = path.join(dir, newName);
                    
                    this.recordFix(
                        'RENAME_FILE',
                        relativePath,
                        'Fixed file name',
                        entry.name,
                        newName
                    );

                    if (!this.dryRun) {
                        fs.renameSync(fullPath, newPath);
                    }

                    fixes.push({
                        oldPath: relativePath,
                        newPath: path.relative(extensionPath, newPath)
                    });
                }
            }
        };

        processDirectory(extensionPath);
        return fixes;
    }

    /**
     * CSPヘッダーの自動修正
     */
    async fixCSP(extensionPath) {
        const manifestPath = path.join(extensionPath, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            return false;
        }

        const content = fs.readFileSync(manifestPath, 'utf8');
        let manifest;
        
        try {
            manifest = JSON.parse(content);
        } catch (error) {
            return false;
        }

        let fixed = false;

        // CSPの修正
        if (manifest.content_security_policy) {
            // V2形式のCSPをV3形式に変換
            if (typeof manifest.content_security_policy === 'string') {
                const oldCSP = manifest.content_security_policy;
                manifest.content_security_policy = {
                    extension_pages: oldCSP
                };
                this.recordFix(
                    'MIGRATE_CSP',
                    manifestPath,
                    'Converted CSP to Manifest V3 format',
                    'string format',
                    'object format'
                );
                fixed = true;
            }

            // unsafe-evalを削除
            if (manifest.content_security_policy.extension_pages) {
                const csp = manifest.content_security_policy.extension_pages;
                if (csp.includes('unsafe-eval')) {
                    manifest.content_security_policy.extension_pages = csp.replace(/['"]unsafe-eval['"]\s*;?/g, '');
                    this.recordFix(
                        'REMOVE_UNSAFE',
                        manifestPath,
                        'Removed unsafe-eval from CSP',
                        'with unsafe-eval',
                        'without unsafe-eval'
                    );
                    fixed = true;
                }
            }

            // unsafe-inlineを削除
            if (manifest.content_security_policy.extension_pages) {
                const csp = manifest.content_security_policy.extension_pages;
                if (csp.includes('unsafe-inline')) {
                    manifest.content_security_policy.extension_pages = csp.replace(/['"]unsafe-inline['"]\s*;?/g, '');
                    this.recordFix(
                        'REMOVE_UNSAFE',
                        manifestPath,
                        'Removed unsafe-inline from CSP',
                        'with unsafe-inline',
                        'without unsafe-inline'
                    );
                    fixed = true;
                }
            }
        }

        if (fixed) {
            const formattedContent = JSON.stringify(manifest, null, 2);
            this.writeFile(manifestPath, formattedContent);
        }

        return fixed;
    }

    /**
     * すべての自動修正を実行
     */
    async fixAll(extensionPath) {
        console.log(`\n🔧 Running auto-fix on: ${extensionPath}`);
        
        if (this.dryRun) {
            console.log('   (Dry run mode - no files will be modified)\n');
        }

        const results = {
            manifest: await this.fixManifest(extensionPath),
            fileNames: await this.fixFileNames(extensionPath),
            csp: await this.fixCSP(extensionPath)
        };

        return {
            results,
            fixes: this.fixes,
            summary: this.getSummary()
        };
    }

    /**
     * 修正の概要を取得
     */
    getSummary() {
        const summary = {
            total: this.fixes.length,
            byType: {}
        };

        for (const fix of this.fixes) {
            summary.byType[fix.type] = (summary.byType[fix.type] || 0) + 1;
        }

        return summary;
    }

    /**
     * バックアップから復元
     */
    async restore() {
        if (this.dryRun) {
            console.log('No restoration needed in dry-run mode');
            return;
        }

        for (const [filePath, content] of this.backups) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Restored: ${filePath}`);
        }
    }
}

module.exports = AutoFixer;