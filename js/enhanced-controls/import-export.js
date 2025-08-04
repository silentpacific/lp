// js/enhanced-controls/import-export.js - Configuration Import/Export
// Handles importing and exporting pulse configurations and article data

/**
 * Import/Export Manager
 * Handles saving and loading pulse configurations, articles, and settings
 */
export class ImportExport {
    constructor() {
        this.app = null;
    }

    /**
     * Initialize with app reference
     */
    init(app) {
        this.app = app;
    }

    /**
     * Export pulse configuration to JSON file
     */
    exportConfig() {
        if (this.app.pulses.length === 0 && this.app.semanticClusters.length === 0) {
            this.app.showError('No pulse points or clusters to export');
            return { success: false, message: 'Nothing to export' };
        }

        const config = {
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '3.0',
                totalPulses: this.app.pulses.length,
                totalClusters: this.app.semanticClusters.length,
                exportType: 'full_configuration',
                appVersion: this.getAppVersion()
            },
            pulses: this.app.pulses.map(pulse => ({
                id: pulse.id,
                originalText: pulse.originalText,
                dynamicPart: pulse.dynamicPart,
                staticPrefix: pulse.staticPrefix,
                staticSuffix: pulse.staticSuffix,
                currentValue: pulse.currentValue,
                pulseType: pulse.pulseType,
                specificType: pulse.specificType,
                updateFrequency: pulse.updateFrequency,
                dataSource: pulse.dataSource,
                reasoning: pulse.reasoning,
                confidence: pulse.confidence,
                action: pulse.action,
                subject: pulse.subject,
                entity: pulse.entity,
                emotion: pulse.emotion,
                isActive: pulse.isActive,
                clusterId: pulse.clusterId,
                role: pulse.role,
                isPrimaryInCluster: pulse.isPrimaryInCluster,
                priority: pulse.priority,
                sourceQuality: pulse.sourceQuality,
                contextRelevance: pulse.contextRelevance,
                tags: pulse.tags,
                // Include metadata but not full history to keep file size reasonable
                updateCount: pulse.updateCount,
                lastUpdated: pulse.lastUpdated,
                nextUpdate: pulse.nextUpdate
            })),
            clusters: this.app.semanticClusters.map(cluster => ({
                id: cluster.id,
                name: cluster.name,
                type: cluster.type,
                semanticRule: cluster.semanticRule,
                pulseIds: cluster.pulseIds,
                relationships: cluster.relationships,
                isActive: cluster.isActive,
                priority: cluster.priority,
                confidence: cluster.confidence,
                createdAt: cluster.createdAt
            })),
            settings: {
                showFootnotes: this.app.previewManager?.showFootnotes ?? true,
                showSuperscripts: this.app.previewManager?.showSuperscripts ?? true
            }
        };

        this.downloadJsonFile(config, this.generateConfigFilename());
        
        const message = `Configuration exported: ${config.pulses.length} pulses, ${config.clusters.length} clusters`;
        this.app.showSuccess(message);

        return {
            success: true,
            exported: {
                pulses: config.pulses.length,
                clusters: config.clusters.length
            },
            message
        };
    }

    /**
     * Import pulse configuration from JSON file
     */
    importConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.processImportedConfig(config);
            } catch (error) {
                console.error('Import failed:', error);
                this.app.showError('Failed to import configuration: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            this.app.showError('Failed to read file');
        };

        reader.readAsText(file);
    }

    /**
     * Process imported configuration data
     */
    processImportedConfig(config) {
        // Validate config structure
        if (!this.validateImportConfig(config)) {
            return;
        }

        const importStats = {
            pulsesImported: 0,
            clustersImported: 0,
            pulsesSkipped: 0,
            clustersSkipped: 0,
            errors: []
        };

        try {
            // Import pulses
            if (config.pulses && Array.isArray(config.pulses)) {
                config.pulses.forEach(pulseData => {
                    try {
                        const newPulse = this.createPulseFromImport(pulseData);
                        this.app.pulses.push(newPulse);
                        importStats.pulsesImported++;
                    } catch (error) {
                        console.error('Failed to import pulse:', error);
                        importStats.pulsesSkipped++;
                        importStats.errors.push(`Pulse import error: ${error.message}`);
                    }
                });
            }

            // Import clusters
            if (config.clusters && Array.isArray(config.clusters)) {
                config.clusters.forEach(clusterData => {
                    try {
                        const newCluster = this.createClusterFromImport(clusterData);
                        this.app.semanticClusters.push(newCluster);
                        importStats.clustersImported++;
                    } catch (error) {
                        console.error('Failed to import cluster:', error);
                        importStats.clustersSkipped++;
                        importStats.errors.push(`Cluster import error: ${error.message}`);
                    }
                });
            }

            // Import settings
            if (config.settings) {
                this.importSettings(config.settings);
            }

            // Update displays
            this.app.updateAllDisplays();

            // Show results
            this.showImportResults(importStats);

        } catch (error) {
            console.error('Import processing failed:', error);
            this.app.showError('Failed to process imported configuration: ' + error.message);
        }
    }

    /**
     * Validate imported configuration structure
     */
    validateImportConfig(config) {
        if (!config) {
            this.app.showError('Invalid configuration file: empty or corrupted');
            return false;
        }

        if (!config.metadata) {
            this.app.showError('Invalid configuration file: missing metadata');
            return false;
        }

        if (!config.pulses && !config.clusters) {
            this.app.showError('Invalid configuration file: no pulse points or clusters found');
            return false;
        }

        // Check version compatibility
        if (config.metadata.version && !this.isVersionCompatible(config.metadata.version)) {
            const proceed = confirm(
                `This configuration was exported from version ${config.metadata.version}. ` + 
                'It may not be fully compatible. Continue importing?'
            );
            if (!proceed) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create pulse from imported data
     */
    createPulseFromImport(pulseData) {
        // Assign new ID to avoid conflicts
        const newId = this.app.pulseCounter++;
        
        return {
            id: newId,
            originalText: pulseData.originalText || '',
            dynamicPart: pulseData.dynamicPart || '',
            staticPrefix: pulseData.staticPrefix || '',
            staticSuffix: pulseData.staticSuffix || '',
            currentValue: pulseData.currentValue || pulseData.dynamicPart || '',
            pulseType: pulseData.pulseType || 'unknown',
            specificType: pulseData.specificType || 'unknown',
            updateFrequency: pulseData.updateFrequency || 180,
            dataSource: pulseData.dataSource || 'Unknown',
            reasoning: pulseData.reasoning || 'Imported pulse point',
            confidence: pulseData.confidence || 'medium',
            action: pulseData.action || 'update',
            subject: pulseData.subject || 'content',
            entity: pulseData.entity || 'unknown',
            emotion: pulseData.emotion || 'neutral',
            isActive: pulseData.isActive !== undefined ? pulseData.isActive : true,
            clusterId: pulseData.clusterId || null,
            role: pulseData.role || 'single',
            isPrimaryInCluster: pulseData.isPrimaryInCluster || false,
            priority: pulseData.priority || 'medium',
            sourceQuality: pulseData.sourceQuality || this.getSourceQuality(pulseData.dataSource),
            contextRelevance: pulseData.contextRelevance || 'medium',
            tags: pulseData.tags || [],
            // Reset temporal data
            lastUpdated: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + ((pulseData.updateFrequency || 180) * 60 * 1000)).toISOString(),
            updateCount: 0,
            changeHistory: []
        };
    }

    /**
     * Create cluster from imported data
     */
    createClusterFromImport(clusterData) {
        // Assign new ID to avoid conflicts
        const newId = `cluster_${this.app.clusterCounter++}`;
        
        return {
            id: newId,
            name: clusterData.name || 'Imported Cluster',
            type: clusterData.type || 'mathematical',
            semanticRule: clusterData.semanticRule || 'Imported cluster relationship',
            pulseIds: clusterData.pulseIds || [],
            relationships: clusterData.relationships || [],
            isActive: clusterData.isActive !== undefined ? clusterData.isActive : true,
            priority: clusterData.priority || 'medium',
            confidence: clusterData.confidence || 'medium',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Import application settings
     */
    importSettings(settings) {
        if (this.app.previewManager) {
            if (settings.showFootnotes !== undefined) {
                this.app.previewManager.showFootnotes = settings.showFootnotes;
            }
            if (settings.showSuperscripts !== undefined) {
                this.app.previewManager.showSuperscripts = settings.showSuperscripts;
            }
        }
    }

    /**
     * Show import results to user
     */
    showImportResults(stats) {
        const totalImported = stats.pulsesImported + stats.clustersImported;
        const totalSkipped = stats.pulsesSkipped + stats.clustersSkipped;

        if (totalImported === 0) {
            this.app.showError('No items were imported. Check file format and try again.');
            return;
        }

        let message = `Import completed: ${stats.pulsesImported} pulses, ${stats.clustersImported} clusters`;
        
        if (totalSkipped > 0) {
            message += `. ${totalSkipped} items skipped due to errors.`;
            this.app.showError(message);
        } else {
            this.app.showSuccess(message);
        }

        // Log detailed errors for debugging
        if (stats.errors.length > 0) {
            console.warn('Import errors:', stats.errors);
        }
    }

    /**
     * Export article with pulse points as HTML
     */
    exportArticleHtml() {
        const articleContent = document.getElementById('article-content');
        if (!articleContent || !articleContent.value.trim()) {
            this.app.showError('No article content to export');
            return { success: false, message: 'No content to export' };
        }

        // Use the preview manager's export functionality
        if (this.app.previewManager) {
            this.app.previewManager.exportHtml();
            return { success: true, message: 'Article HTML exported' };
        } else {
            this.app.showError('Preview manager not available');
            return { success: false, message: 'Export not available' };
        }
    }

    /**
     * Export pulse points as CSV for analysis
     */
    exportPulsesAsCsv() {
        if (this.app.pulses.length === 0) {
            this.app.showError('No pulse points to export');
            return { success: false, message: 'No pulse points found' };
        }

        const csvHeaders = [
            'ID', 'Original Text', 'Current Value', 'Pulse Type', 'Specific Type',
            'Update Frequency (min)', 'Data Source', 'Confidence', 'Priority',
            'Is Active', 'Cluster ID', 'Role', 'Source Quality', 'Context Relevance',
            'Update Count', 'Last Updated', 'Next Update'
        ];

        const csvRows = this.app.pulses.map(pulse => [
            pulse.id,
            `"${pulse.originalText.replace(/"/g, '""')}"`,
            `"${pulse.currentValue.replace(/"/g, '""')}"`,
            pulse.pulseType,
            pulse.specificType,
            pulse.updateFrequency,
            `"${pulse.dataSource.replace(/"/g, '""')}"`,
            pulse.confidence,
            pulse.priority,
            pulse.isActive,
            pulse.clusterId || '',
            pulse.role,
            pulse.sourceQuality,
            pulse.contextRelevance,
            pulse.updateCount,
            pulse.lastUpdated,
            pulse.nextUpdate
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.join(','))
            .join('\n');

        this.downloadTextFile(csvContent, this.generateCsvFilename(), 'text/csv');

        const message = `Exported ${this.app.pulses.length} pulse points as CSV`;
        this.app.showSuccess(message);

        return {
            success: true,
            exported: this.app.pulses.length,
            message
        };
    }

    /**
     * Import pulses from CSV file
     */
    importPulsesFromCsv(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.processCsvImport(e.target.result);
            } catch (error) {
                console.error('CSV import failed:', error);
                this.app.showError('Failed to import CSV: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    /**
     * Process CSV import data
     */
    processCsvImport(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            this.app.showError('CSV file must contain headers and at least one data row');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataLines = lines.slice(1);

        const importStats = {
            imported: 0,
            skipped: 0,
            errors: []
        };

        dataLines.forEach((line, index) => {
            try {
                const values = this.parseCsvLine(line);
                if (values.length !== headers.length) {
                    throw new Error(`Row ${index + 2}: Column count mismatch`);
                }

                const pulseData = {};
                headers.forEach((header, i) => {
                    pulseData[this.mapCsvHeaderToProperty(header)] = values[i];
                });

                const newPulse = this.createPulseFromCsvData(pulseData);
                this.app.pulses.push(newPulse);
                importStats.imported++;

            } catch (error) {
                console.error(`CSV row ${index + 2} error:`, error);
                importStats.skipped++;
                importStats.errors.push(`Row ${index + 2}: ${error.message}`);
            }
        });

        // Update displays
        this.app.updateAllDisplays();

        // Show results
        let message = `CSV import completed: ${importStats.imported} pulses imported`;
        if (importStats.skipped > 0) {
            message += `, ${importStats.skipped} skipped`;
            this.app.showError(message);
        } else {
            this.app.showSuccess(message);
        }

        if (importStats.errors.length > 0) {
            console.warn('CSV import errors:', importStats.errors);
        }
    }

    /**
     * Parse CSV line handling quoted values
     */
    parseCsvLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    /**
     * Map CSV headers to pulse properties
     */
    mapCsvHeaderToProperty(header) {
        const mapping = {
            'ID': 'id',
            'Original Text': 'originalText',
            'Current Value': 'currentValue',
            'Pulse Type': 'pulseType',
            'Specific Type': 'specificType',
            'Update Frequency (min)': 'updateFrequency',
            'Data Source': 'dataSource',
            'Confidence': 'confidence',
            'Priority': 'priority',
            'Is Active': 'isActive',
            'Cluster ID': 'clusterId',
            'Role': 'role',
            'Source Quality': 'sourceQuality',
            'Context Relevance': 'contextRelevance'
        };
        
        return mapping[header] || header.toLowerCase().replace(/\s+/g, '');
    }

    /**
     * Create pulse from CSV data
     */
    createPulseFromCsvData(csvData) {
        return {
            id: this.app.pulseCounter++,
            originalText: csvData.originalText || '',
            dynamicPart: csvData.currentValue || '',
            staticPrefix: '',
            staticSuffix: '',
            currentValue: csvData.currentValue || '',
            pulseType: csvData.pulseType || 'unknown',
            specificType: csvData.specificType || 'unknown',
            updateFrequency: parseInt(csvData.updateFrequency) || 180,
            dataSource: csvData.dataSource || 'Unknown',
            reasoning: 'Imported from CSV',
            confidence: csvData.confidence || 'medium',
            action: 'update',
            subject: 'content',
            entity: 'unknown',
            emotion: 'neutral',
            isActive: csvData.isActive === 'true' || csvData.isActive === true,
            clusterId: csvData.clusterId || null,
            role: csvData.role || 'single',
            isPrimaryInCluster: false,
            priority: csvData.priority || 'medium',
            sourceQuality: csvData.sourceQuality || 'unknown',
            contextRelevance: csvData.contextRelevance || 'medium',
            tags: [],
            lastUpdated: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + ((parseInt(csvData.updateFrequency) || 180) * 60 * 1000)).toISOString(),
            updateCount: 0,
            changeHistory: []
        };
    }

    /**
     * Backup current state to local storage
     */
    backupToLocalStorage() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                pulses: this.app.pulses,
                clusters: this.app.semanticClusters,
                settings: {
                    showFootnotes: this.app.previewManager?.showFootnotes,
                    showSuperscripts: this.app.previewManager?.showSuperscripts
                }
            };

            localStorage.setItem('livepulse_backup', JSON.stringify(backup));
            this.app.showSuccess('State backed up to local storage');
            
            return { success: true, timestamp: backup.timestamp };
        } catch (error) {
            console.error('Backup failed:', error);
            this.app.showError('Failed to backup state: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Restore from local storage backup
     */
    restoreFromLocalStorage() {
        try {
            const backupData = localStorage.getItem('livepulse_backup');
            if (!backupData) {
                this.app.showError('No backup found in local storage');
                return { success: false, message: 'No backup found' };
            }

            const backup = JSON.parse(backupData);
            
            const confirmed = confirm(
                `Restore from backup created on ${new Date(backup.timestamp).toLocaleString()}? ` +
                'This will replace all current pulse points and clusters.'
            );
            
            if (!confirmed) {
                return { success: false, message: 'Restore cancelled' };
            }

            // Restore data
            this.app.pulses = backup.pulses || [];
            this.app.semanticClusters = backup.clusters || [];
            
            // Restore settings
            if (backup.settings && this.app.previewManager) {
                this.app.previewManager.showFootnotes = backup.settings.showFootnotes !== false;
                this.app.previewManager.showSuperscripts = backup.settings.showSuperscripts !== false;
            }

            // Update counters
            this.updateCounters();

            // Update displays
            this.app.updateAllDisplays();

            const message = `Restored ${this.app.pulses.length} pulses and ${this.app.semanticClusters.length} clusters from backup`;
            this.app.showSuccess(message);

            return { success: true, message };

        } catch (error) {
            console.error('Restore failed:', error);
            this.app.showError('Failed to restore from backup: ' + error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update pulse and cluster counters after import/restore
     */
    updateCounters() {
        if (this.app.pulses.length > 0) {
            this.app.pulseCounter = Math.max(...this.app.pulses.map(p => p.id)) + 1;
        }
        if (this.app.semanticClusters.length > 0) {
            const clusterNumbers = this.app.semanticClusters
                .map(c => parseInt(c.id.split('_')[1]))
                .filter(n => !isNaN(n));
            if (clusterNumbers.length > 0) {
                this.app.clusterCounter = Math.max(...clusterNumbers) + 1;
            }
        }
    }

    /**
     * Download file helper
     */
    downloadJsonFile(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    /**
     * Download text file helper
     */
    downloadTextFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        this.downloadBlob(blob, filename);
    }

    /**
     * Download blob helper
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Generate configuration filename
     */
    generateConfigFilename() {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
        return `livepulse-config-${date}-${time}.json`;
    }

    /**
     * Generate CSV filename
     */
    generateCsvFilename() {
        const date = new Date().toISOString().split('T')[0];
        return `livepulse-pulses-${date}.csv`;
    }

    /**
     * Check version compatibility
     */
    isVersionCompatible(version) {
        const currentVersion = this.getAppVersion();
        const [currentMajor] = currentVersion.split('.');
        const [importMajor] = version.split('.');
        
        return currentMajor === importMajor;
    }

    /**
     * Get application version
     */
    getAppVersion() {
        return '3.0.0'; // Should match the version in your app
    }

    /**
     * Get source quality for imported data
     */
    getSourceQuality(dataSource) {
        const source = dataSource?.toLowerCase() || '';
        
        if (source.includes('coingecko') || source.includes('yahoo') || source.includes('openweather')) {
            return 'premium';
        }
        if (source.includes('api')) {
            return 'standard';
        }
        if (source.includes('government') || source.includes('bureau')) {
            return 'premium';
        }
        return 'basic';
    }

    /**
     * Get import/export statistics
     */
    getImportExportStats() {
        return {
            hasBackup: !!localStorage.getItem('livepulse_backup'),
            backupTimestamp: this.getBackupTimestamp(),
            currentPulses: this.app.pulses.length,
            currentClusters: this.app.semanticClusters.length,
            supportedFormats: ['JSON', 'CSV', 'HTML'],
            lastExport: localStorage.getItem('livepulse_last_export') || null
        };
    }

    /**
     * Get backup timestamp
     */
    getBackupTimestamp() {
        try {
            const backup = localStorage.getItem('livepulse_backup');
            return backup ? JSON.parse(backup).timestamp : null;
        } catch {
            return null;
        }
    }
}