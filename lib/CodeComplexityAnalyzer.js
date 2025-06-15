/**
 * CodeComplexityAnalyzer
 * コードの複雑度を解析し、パフォーマンス問題を検出
 */

class CodeComplexityAnalyzer {
    constructor() {
        this.issues = [];
    }

    /**
     * ネストされたループを検出（AST風の簡易解析）
     */
    detectNestedLoops(content, fileName) {
        const lines = content.split('\n');
        const loopStack = [];
        const nestedLoops = [];
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // ループの開始を検出
            if (this.isLoopStart(trimmedLine)) {
                loopStack.push({
                    line: index + 1,
                    type: this.getLoopType(trimmedLine),
                    indentLevel: this.getIndentLevel(line)
                });
            }
            
            // ブロックの終了を検出（簡易的）
            if (trimmedLine === '}' || trimmedLine.startsWith('} ')) {
                // インデントレベルで対応するループを見つける
                const indentLevel = this.getIndentLevel(line);
                
                // スタックから対応するループを削除
                for (let i = loopStack.length - 1; i >= 0; i--) {
                    if (loopStack[i].indentLevel >= indentLevel) {
                        loopStack.splice(i, 1);
                    }
                }
            }
            
            // 3重以上のネストを検出
            if (loopStack.length >= 3) {
                const loopInfo = {
                    depth: loopStack.length,
                    startLine: loopStack[0].line,
                    types: loopStack.map(l => l.type)
                };
                
                // 同じネストを重複して報告しない
                const isDuplicate = nestedLoops.some(nl => 
                    nl.startLine === loopInfo.startLine && 
                    nl.depth === loopInfo.depth
                );
                
                if (!isDuplicate) {
                    nestedLoops.push(loopInfo);
                }
            }
        });
        
        return nestedLoops;
    }

    /**
     * ループの開始かどうか判定
     */
    isLoopStart(line) {
        const loopPatterns = [
            /^\s*for\s*\(/,
            /^\s*while\s*\(/,
            /^\s*do\s*{/,
            /\.forEach\s*\(/,
            /\.map\s*\(/,
            /\.filter\s*\(/,
            /\.reduce\s*\(/,
            /\.some\s*\(/,
            /\.every\s*\(/
        ];
        
        return loopPatterns.some(pattern => pattern.test(line));
    }

    /**
     * ループの種類を取得
     */
    getLoopType(line) {
        if (line.includes('for')) return 'for';
        if (line.includes('while')) return 'while';
        if (line.includes('do')) return 'do-while';
        if (line.includes('forEach')) return 'forEach';
        if (line.includes('map')) return 'map';
        if (line.includes('filter')) return 'filter';
        if (line.includes('reduce')) return 'reduce';
        if (line.includes('some')) return 'some';
        if (line.includes('every')) return 'every';
        return 'unknown';
    }

    /**
     * インデントレベルを取得
     */
    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    /**
     * 循環的複雑度を計算（簡易版）
     */
    calculateCyclomaticComplexity(content) {
        let complexity = 1; // 基本の複雑度
        
        // 分岐を数える
        const branchPatterns = [
            /\bif\s*\(/g,
            /\belse\s+if\s*\(/g,
            /\bswitch\s*\(/g,
            /\bcase\s+/g,
            /\bcatch\s*\(/g,
            /\?\s*[^:]+\s*:/g,  // 三項演算子
            /\|\|/g,            // OR演算子
            /&&/g               // AND演算子
        ];
        
        branchPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });
        
        // ループを数える
        const loopPatterns = [
            /\bfor\s*\(/g,
            /\bwhile\s*\(/g,
            /\bdo\s*{/g,
            /\.forEach\s*\(/g,
            /\.map\s*\(/g,
            /\.filter\s*\(/g
        ];
        
        loopPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });
        
        return complexity;
    }

    /**
     * 関数の長さを分析
     */
    analyzeFunctionLength(content) {
        const functionPattern = /function\s+\w+\s*\([^)]*\)\s*{|^\s*\w+\s*\([^)]*\)\s*{|^\s*\w+\s*:\s*function\s*\([^)]*\)\s*{/gm;
        const functions = [];
        let match;
        
        while ((match = functionPattern.exec(content)) !== null) {
            const startIndex = match.index;
            const functionName = this.extractFunctionName(match[0]);
            
            // 関数の終了を見つける（簡易的）
            let braceCount = 1;
            let endIndex = content.indexOf('{', startIndex) + 1;
            
            while (braceCount > 0 && endIndex < content.length) {
                if (content[endIndex] === '{') braceCount++;
                else if (content[endIndex] === '}') braceCount--;
                endIndex++;
            }
            
            const functionBody = content.substring(startIndex, endIndex);
            const lines = functionBody.split('\n').length;
            
            if (lines > 50) {
                functions.push({
                    name: functionName,
                    lines: lines,
                    startLine: content.substring(0, startIndex).split('\n').length
                });
            }
        }
        
        return functions;
    }

    /**
     * 関数名を抽出
     */
    extractFunctionName(declaration) {
        const patterns = [
            /function\s+(\w+)/,
            /^\s*(\w+)\s*\(/,
            /^\s*(\w+)\s*:/
        ];
        
        for (const pattern of patterns) {
            const match = declaration.match(pattern);
            if (match) return match[1];
        }
        
        return 'anonymous';
    }
}

module.exports = CodeComplexityAnalyzer;