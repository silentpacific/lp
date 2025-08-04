// LivePulse Supabase Client
// js/storage/supabase-client.js

// Initialize namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.Storage = window.LivePulse.Storage || {};

// ===== SUPABASE CLIENT CLASS =====

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`
        };
        this.isConnected = false;
        this.connectionError = null;
    }

    /**
     * Test the connection to Supabase
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.url}/rest/v1/`, {
                method: 'GET',
                headers: this.headers
            });
            
            this.isConnected = response.ok;
            this.connectionError = response.ok ? null : `HTTP ${response.status}`;
            
            return response.ok;
        } catch (error) {
            this.isConnected = false;
            this.connectionError = error.message;
            return false;
        }
    }

    /**
     * Insert data into a table
     */
    async insert(table, data) {
        try {
            // Ensure data is an array
            const payload = Array.isArray(data) ? data : [data];
            
            const response = await fetch(`${this.url}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Insert failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            return Array.isArray(data) ? result : result[0];
            
        } catch (error) {
            console.error('Supabase insert error:', error);
            throw this._createError('INSERT_FAILED', error.message, { table, data });
        }
    }

    /**
     * Select data from a table
     */
    async select(table, query = '', options = {}) {
        try {
            const queryString = query ? `?${query}` : '';
            const url = `${this.url}/rest/v1/${table}${queryString}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Select failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            
            // Apply client-side filtering if needed
            if (options.filter) {
                return result.filter(options.filter);
            }
            
            return result;
            
        } catch (error) {
            console.error('Supabase select error:', error);
            throw this._createError('SELECT_FAILED', error.message, { table, query });
        }
    }

    /**
     * Update data in a table
     */
    async update(table, id, data, idColumn = 'id') {
        try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${idColumn}=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    ...this.headers,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Update failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            return result[0] || null;
            
        } catch (error) {
            console.error('Supabase update error:', error);
            throw this._createError('UPDATE_FAILED', error.message, { table, id, data });
        }
    }

    /**
     * Delete data from a table
     */
    async delete(table, id, idColumn = 'id') {
        try {
            const response = await fetch(`${this.url}/rest/v1/${table}?${idColumn}=eq.${id}`, {
                method: 'DELETE',
                headers: this.headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Delete failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            return true;
            
        } catch (error) {
            console.error('Supabase delete error:', error);
            throw this._createError('DELETE_FAILED', error.message, { table, id });
        }
    }

    /**
     * Upsert data (insert or update)
     */
    async upsert(table, data, conflictColumns = ['id']) {
        try {
            const payload = Array.isArray(data) ? data : [data];
            const onConflict = conflictColumns.join(',');
            
            const response = await fetch(`${this.url}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Prefer': `resolution=merge-duplicates,return=representation`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Upsert failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            return Array.isArray(data) ? result : result[0];
            
        } catch (error) {
            console.error('Supabase upsert error:', error);
            throw this._createError('UPSERT_FAILED', error.message, { table, data });
        }
    }

    /**
     * Count records in a table
     */
    async count(table, query = '') {
        try {
            const queryString = query ? `?${query}&` : '?';
            const url = `${this.url}/rest/v1/${table}${queryString}select=count()`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    ...this.headers,
                    'Prefer': 'count=exact'
                }
            });

            if (!response.ok) {
                throw new Error(`Count failed: ${response.status}`);
            }

            const countHeader = response.headers.get('Content-Range');
            if (countHeader) {
                const match = countHeader.match(/\/(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            }

            return 0;
            
        } catch (error) {
            console.error('Supabase count error:', error);
            throw this._createError('COUNT_FAILED', error.message, { table, query });
        }
    }

    /**
     * Execute custom query
     */
    async query(sql, params = {}) {
        try {
            const response = await fetch(`${this.url}/rest/v1/rpc/execute_sql`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ sql, params })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Query failed: ${response.status} - ${errorData.message || response.statusText}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error('Supabase query error:', error);
            throw this._createError('QUERY_FAILED', error.message, { sql, params });
        }
    }

    /**
     * Batch operations
     */
    async batch(operations) {
        const results = [];
        const errors = [];

        for (const [index, operation] of operations.entries()) {
            try {
                let result;
                const { type, table, data, id, query } = operation;

                switch (type) {
                    case 'insert':
                        result = await this.insert(table, data);
                        break;
                    case 'select':
                        result = await this.select(table, query);
                        break;
                    case 'update':
                        result = await this.update(table, id, data);
                        break;
                    case 'delete':
                        result = await this.delete(table, id);
                        break;
                    default:
                        throw new Error(`Unknown operation type: ${type}`);
                }

                results.push({ index, success: true, data: result });
                
            } catch (error) {
                errors.push({ index, error: error.message, operation });
                results.push({ index, success: false, error: error.message });
            }
        }

        return {
            results,
            errors,
            success: errors.length === 0
        };
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            error: this.connectionError,
            url: this.url.replace(/\/+$/, ''), // Remove trailing slashes
            hasCredentials: !!(this.url && this.key)
        };
    }

    /**
     * Create standardized error
     */
    _createError(code, message, context = {}) {
        const error = new Error(message);
        error.code = code;
        error.context = context;
        error.timestamp = new Date().toISOString();
        return error;
    }
}

// ===== QUERY BUILDER HELPER =====

class QueryBuilder {
    constructor() {
        this.parts = [];
    }

    select(columns = '*') {
        this.parts.push(`select=${Array.isArray(columns) ? columns.join(',') : columns}`);
        return this;
    }

    eq(column, value) {
        this.parts.push(`${column}=eq.${encodeURIComponent(value)}`);
        return this;
    }

    neq(column, value) {
        this.parts.push(`${column}=neq.${encodeURIComponent(value)}`);
        return this;
    }

    gt(column, value) {
        this.parts.push(`${column}=gt.${encodeURIComponent(value)}`);
        return this;
    }

    gte(column, value) {
        this.parts.push(`${column}=gte.${encodeURIComponent(value)}`);
        return this;
    }

    lt(column, value) {
        this.parts.push(`${column}=lt.${encodeURIComponent(value)}`);
        return this;
    }

    lte(column, value) {
        this.parts.push(`${column}=lte.${encodeURIComponent(value)}`);
        return this;
    }

    like(column, pattern) {
        this.parts.push(`${column}=like.${encodeURIComponent(pattern)}`);
        return this;
    }

    ilike(column, pattern) {
        this.parts.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
        return this;
    }

    in(column, values) {
        const valueList = Array.isArray(values) ? values.join(',') : values;
        this.parts.push(`${column}=in.(${encodeURIComponent(valueList)})`);
        return this;
    }

    order(column, direction = 'asc') {
        this.parts.push(`order=${column}.${direction}`);
        return this;
    }

    limit(count) {
        this.parts.push(`limit=${count}`);
        return this;
    }

    offset(count) {
        this.parts.push(`offset=${count}`);
        return this;
    }

    range(from, to) {
        this.parts.push(`offset=${from}&limit=${to - from + 1}`);
        return this;
    }

    build() {
        return this.parts.join('&');
    }
}

// ===== GLOBAL INSTANCE AND INITIALIZATION =====

window.LivePulse.Storage.SupabaseClient = SupabaseClient;
window.LivePulse.Storage.QueryBuilder = QueryBuilder;

// Initialize global client instance
window.LivePulse.Storage.client = null;

/**
 * Initialize Supabase connection
 */
window.LivePulse.Storage.initialize = function() {
    const config = window.LivePulse.Config;
    
    if (!config) {
        console.error('❌ LivePulse Config not loaded. Load config.js before supabase-client.js');
        return false;
    }

    const url = config.Database.SUPABASE_URL;
    const key = config.Database.SUPABASE_ANON_KEY;

    if (!url || !key || url === 'YOUR_SUPABASE_URL' || key === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ Supabase credentials not configured. Article storage will be disabled.');
        return false;
    }

    try {
        this.client = new SupabaseClient(url, key);
        console.log('✅ Supabase client initialized');
        
        // Test connection in background
        this.client.testConnection().then(connected => {
            if (connected) {
                console.log('✅ Supabase connection verified');
            } else {
                console.warn('⚠️ Supabase connection failed:', this.client.connectionError);
            }
        });
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return false;
    }
};

/**
 * Get the global client instance
 */
window.LivePulse.Storage.getClient = function() {
    if (!this.client) {
        console.warn('Supabase client not initialized. Call LivePulse.Storage.initialize() first.');
        return null;
    }
    return this.client;
};

/**
 * Create a query builder instance
 */
window.LivePulse.Storage.query = function() {
    return new QueryBuilder();
};

/**
 * Check if storage is available
 */
window.LivePulse.Storage.isAvailable = function() {
    return !!(this.client && this.client.url && this.client.key);
};

// ===== CONVENIENCE METHODS =====

/**
 * Quick article operations
 */
window.LivePulse.Storage.articles = {
    async getAll(limit = 50) {
        const client = window.LivePulse.Storage.getClient();
        if (!client) return [];
        
        const query = window.LivePulse.Storage.query()
            .order('created_at', 'desc')
            .limit(limit)
            .build();
            
        return await client.select('articles', query);
    },

    async getById(id) {
        const client = window.LivePulse.Storage.getClient();
        if (!client) return null;
        
        const query = window.LivePulse.Storage.query()
            .eq('id', id)
            .build();
            
        const results = await client.select('articles', query);
        return results.length > 0 ? results[0] : null;
    },

    async save(articleData) {
        const client = window.LivePulse.Storage.getClient();
        if (!client) throw new Error('Storage not available');
        
        return await client.insert('articles', articleData);
    },

    async update(id, data) {
        const client = window.LivePulse.Storage.getClient();
        if (!client) throw new Error('Storage not available');
        
        // Add updated_at timestamp
        data.updated_at = new Date().toISOString();
        
        return await client.update('articles', id, data);
    },

    async delete(id) {
        const client = window.LivePulse.Storage.getClient();
        if (!client) throw new Error('Storage not available');
        
        return await client.delete('articles', id);
    },

    async search(searchTerm, limit = 20) {
        const client = window.LivePulse.Storage.getClient();
        if (!client) return [];
        
        // Use ilike for case-insensitive search
        const query = window.LivePulse.Storage.query()
            .ilike('title', `%${searchTerm}%`)
            .order('created_at', 'desc')
            .limit(limit)
            .build();
            
        return await client.select('articles', query);
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Auto-initialize if config is loaded
    setTimeout(() => {
        if (window.LivePulse.Config) {
            window.LivePulse.Storage.initialize();
        }
    }, 100);
});

console.log('💾 LivePulse Storage Client loaded');