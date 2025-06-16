/**
 * DiagnosticHelper - 診断ヘルパー
 * 
 * 行番号の不一致やその他の問題をデバッグするためのヘルパー
 */

const fs = require('fs');
const path = require('path');

class DiagnosticHelper {
    /**
     * ファイルの診断情報を生成
     */
    static generateFileDiagnostics(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const stats = fs.statSync(filePath);
            
            return {
                path: filePath,
                exists: true,
                size: stats.size,
                lineCount: lines.length,
                encoding: 'utf8',
                lineEndings: this.detectLineEndings(content),
                firstLines: lines.slice(0, 5).map((line, i) => ({
                    number: i + 1,
                    content: line.substring(0, 80) + (line.length > 80 ? '...' : '')
                })),
                lastLines: lines.slice(-5).map((line, i) => ({
                    number: lines.length - 4 + i,
                    content: line.substring(0, 80) + (line.length > 80 ? '...' : '')
                }))
            };
        } catch (error) {
            return {
                path: filePath,
                exists: false,
                error: error.message
            };
        }
    }
    
    /**
     * 行末文字を検出
     */
    static detectLineEndings(content) {
        const crlf = (content.match(/\r\n/g) || []).length;
        const lf = (content.match(/(?<!\r)\n/g) || []).length;
        const cr = (content.match(/\r(?!\n)/g) || []).length;
        
        return {
            CRLF: crlf,
            LF: lf,
            CR: cr,
            mixed: (crlf > 0 && lf > 0) || (crlf > 0 && cr > 0) || (lf > 0 && cr > 0)
        };
    }
    
    /**
     * 特定の行番号の内容を取得
     */
    static getLineContent(filePath, lineNumber) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            if (lineNumber < 1 || lineNumber > lines.length) {
                return {
                    error: `Line ${lineNumber} does not exist (file has ${lines.length} lines)`
                };
            }
            
            return {
                lineNumber,
                content: lines[lineNumber - 1],
                totalLines: lines.length,
                context: {
                    before: lineNumber > 1 ? lines[lineNumber - 2] : null,
                    after: lineNumber < lines.length ? lines[lineNumber] : null
                }
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }
    
    /**
     * 検出結果の診断情報を生成
     */
    static generateDetectionDiagnostics(issues, filePath) {
        const diagnostics = {
            file: this.generateFileDiagnostics(filePath),
            issues: []
        };
        
        issues.forEach(issue => {
            const lineInfo = this.getLineContent(filePath, issue.line);
            diagnostics.issues.push({
                ...issue,
                lineInfo,
                diagnostic: {
                    reportedLine: issue.line,
                    fileHasLine: !lineInfo.error,
                    actualContent: lineInfo.content || null
                }
            });
        });
        
        return diagnostics;
    }
    
    /**
     * 診断レポートを生成
     */
    static generateDiagnosticReport(issues, files) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: issues.length,
                filesAnalyzed: files.length,
                diagnostics: []
            }
        };
        
        // ファイルごとに問題をグループ化
        const issuesByFile = new Map();
        issues.forEach(issue => {
            if (!issuesByFile.has(issue.file)) {
                issuesByFile.set(issue.file, []);
            }
            issuesByFile.get(issue.file).push(issue);
        });
        
        // 各ファイルの診断情報を生成
        issuesByFile.forEach((fileIssues, filePath) => {
            report.summary.diagnostics.push(
                this.generateDetectionDiagnostics(fileIssues, filePath)
            );
        });
        
        return report;
    }
    
    /**
     * 診断情報を出力
     */
    static printDiagnostics(filePath, lineNumber) {
        console.log('\n🔍 Diagnostic Information:');
        console.log('=' .repeat(60));
        
        const fileInfo = this.generateFileDiagnostics(filePath);
        console.log(`File: ${filePath}`);
        console.log(`Exists: ${fileInfo.exists}`);
        
        if (!fileInfo.exists) {
            console.log(`Error: ${fileInfo.error}`);
            return;
        }
        
        console.log(`Size: ${fileInfo.size} bytes`);
        console.log(`Total lines: ${fileInfo.lineCount}`);
        console.log(`Line endings: ${JSON.stringify(fileInfo.lineEndings)}`);
        
        if (lineNumber) {
            console.log(`\nRequested line: ${lineNumber}`);
            const lineInfo = this.getLineContent(filePath, lineNumber);
            
            if (lineInfo.error) {
                console.log(`Error: ${lineInfo.error}`);
            } else {
                console.log(`Content: ${lineInfo.content}`);
                if (lineInfo.context.before) {
                    console.log(`Previous line: ${lineInfo.context.before}`);
                }
                if (lineInfo.context.after) {
                    console.log(`Next line: ${lineInfo.context.after}`);
                }
            }
        }
        
        console.log('=' .repeat(60));
    }
}

module.exports = DiagnosticHelper;