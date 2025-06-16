/**
 * PerformanceMonitor - パフォーマンス測定と最適化
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.enabled = process.env.CEXT_PERF === 'true';
    }
    
    /**
     * 測定開始
     */
    start(name) {
        if (!this.enabled) return;
        
        this.metrics.set(name, {
            startTime: process.hrtime.bigint(),
            endTime: null,
            duration: null,
            details: {}
        });
    }
    
    /**
     * 測定終了
     */
    end(name, details = {}) {
        if (!this.enabled) return;
        
        const metric = this.metrics.get(name);
        if (metric) {
            metric.endTime = process.hrtime.bigint();
            metric.duration = Number(metric.endTime - metric.startTime) / 1000000; // ミリ秒に変換
            metric.details = details;
        }
    }
    
    /**
     * ファイルスキャン統計を記録
     */
    recordFileScan(stats) {
        if (!this.enabled) return;
        
        this.metrics.set('file-scan', {
            ...stats,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * レポート生成
     */
    generateReport() {
        if (!this.enabled) return null;
        
        const report = {
            summary: {
                totalDuration: 0,
                fileScanning: 0,
                testExecution: 0
            },
            details: []
        };
        
        this.metrics.forEach((metric, name) => {
            if (metric.duration) {
                report.summary.totalDuration += metric.duration;
                report.details.push({
                    name,
                    duration: metric.duration,
                    ...metric.details
                });
            }
        });
        
        // ファイルスキャン統計
        const fileScan = this.metrics.get('file-scan');
        if (fileScan) {
            report.fileScan = {
                totalFiles: fileScan.totalFiles,
                scannedFiles: fileScan.scannedFiles,
                excludedFiles: fileScan.excludedFiles,
                excludedByNodeModules: fileScan.excludedByNodeModules,
                efficiency: ((fileScan.excludedFiles / fileScan.totalFiles) * 100).toFixed(2) + '%'
            };
        }
        
        return report;
    }
    
    /**
     * パフォーマンスサマリーを表示
     */
    printSummary() {
        if (!this.enabled) return;
        
        const report = this.generateReport();
        if (!report) return;
        
        console.log('\n📊 Performance Report:');
        console.log('=' .repeat(60));
        
        if (report.fileScan) {
            console.log('File Scanning:');
            console.log(`  Total files found: ${report.fileScan.totalFiles}`);
            console.log(`  Files scanned: ${report.fileScan.scannedFiles}`);
            console.log(`  Files excluded: ${report.fileScan.excludedFiles}`);
            console.log(`  Excluded by node_modules: ${report.fileScan.excludedByNodeModules || 'N/A'}`);
            console.log(`  Exclusion efficiency: ${report.fileScan.efficiency}`);
        }
        
        console.log('\nExecution Times:');
        report.details
            .sort((a, b) => b.duration - a.duration)
            .forEach(item => {
                console.log(`  ${item.name}: ${item.duration.toFixed(2)}ms`);
            });
        
        console.log(`\nTotal Duration: ${report.summary.totalDuration.toFixed(2)}ms`);
        console.log('=' .repeat(60));
    }
}

module.exports = PerformanceMonitor;