import { Pool as PgPool } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient, Db } from 'mongodb';
import { DatabaseConfig, ConnectionTestResult } from '../types';
import { logDatabaseOperation } from '../middleware/logger';
import { MockDatabaseService } from './MockDatabaseService';
import crypto from 'crypto';

export class DatabaseService {
  private connectionCache = new Map<string, any>();
  private encryptionKey: string;
  private mockService: MockDatabaseService;
  private useMockData: boolean;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key-123';
    this.mockService = new MockDatabaseService();
    // Use mock data if no real database connection is available
    this.useMockData = process.env.USE_MOCK_DB === 'true' || !process.env.DB_HOST || process.env.DB_HOST === 'localhost';
  }

  async executeQuery(config: any, inputData?: any): Promise<any> {
    const dbConfig = config as DatabaseConfig;
    const startTime = Date.now();

    try {
      let result: any;

      // Use mock service if enabled
      if (this.useMockData) {
        console.log('🎭 Using mock database service');
        result = await this.mockService.executeQuery(config, inputData);
      } else {
        switch (dbConfig.type) {
          case 'postgresql':
            result = await this.executePostgreSQLQuery(dbConfig, inputData);
            break;
          case 'mysql':
            result = await this.executeMySQLQuery(dbConfig, inputData);
            break;
          case 'mongodb':
            result = await this.executeMongoDBQuery(dbConfig, inputData);
            break;
          default:
            throw new Error(`Unsupported database type: ${dbConfig.type}`);
        }
      }

      const duration = Date.now() - startTime;
      logDatabaseOperation('query', dbConfig.type, duration, true);

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logDatabaseOperation('query', dbConfig.type, duration, false, error.message);
      throw error;
    }
  }

  async testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      let result: ConnectionTestResult;

      // Use mock service if enabled
      if (this.useMockData) {
        console.log('🎭 Using mock database connection test');
        result = await this.mockService.testConnection(config);
      } else {
        switch (config.type) {
          case 'postgresql':
            await this.testPostgreSQLConnection(config);
            break;
          case 'mysql':
            await this.testMySQLConnection(config);
            break;
          case 'mongodb':
            await this.testMongoDBConnection(config);
            break;
          default:
            throw new Error(`Unsupported database type: ${config.type}`);
        }

        const latency = Date.now() - startTime;
        result = {
          success: true,
          message: `Successfully connected to ${config.type} database`,
          latency,
          details: {
            host: config.host,
            port: config.port,
            database: config.database,
          },
        };
      }

      const latency = Date.now() - startTime;
      logDatabaseOperation('test_connection', config.type, latency, result.success);

      return result;

    } catch (error: any) {
      const latency = Date.now() - startTime;
      logDatabaseOperation('test_connection', config.type, latency, false, error.message);

      return {
        success: false,
        message: `Failed to connect to ${config.type} database: ${error.message}`,
        latency,
      };
    }
  }

  private async executePostgreSQLQuery(config: DatabaseConfig, inputData?: any): Promise<any> {
    const connectionKey = this.generateConnectionKey(config);
    
    let pool = this.connectionCache.get(connectionKey);
    if (!pool) {
      pool = new PgPool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: 5,
        idleTimeoutMillis: 30000,
      });
      this.connectionCache.set(connectionKey, pool);
    }

    // Default query if no specific query provided
    const defaultQuery = 'SELECT * FROM information_schema.tables LIMIT 10';
    let queryText = defaultQuery;
    let queryParams: any[] = [];

    // If inputData contains query information, use it
    if (inputData && typeof inputData === 'object') {
      if (inputData.query) {
        queryText = inputData.query;
        queryParams = inputData.params || [];
      } else if (inputData.table) {
        // Generate a simple SELECT query for the specified table
        queryText = `SELECT * FROM ${inputData.table} LIMIT 100`;
      }
    }

    const result = await pool.query(queryText, queryParams);
    
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      query: queryText,
      executedAt: new Date().toISOString(),
    };
  }

  private async executeMySQLQuery(config: DatabaseConfig, inputData?: any): Promise<any> {
    const connectionKey = this.generateConnectionKey(config);
    
    let connection = this.connectionCache.get(connectionKey);
    if (!connection) {
      connection = mysql.createPool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? {} : undefined,
        connectionLimit: 5,
      });
      this.connectionCache.set(connectionKey, connection);
    }

    // Default query if no specific query provided
    const defaultQuery = 'SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? LIMIT 10';
    let queryText = defaultQuery;
    let queryParams: any[] = [config.database];

    // If inputData contains query information, use it
    if (inputData && typeof inputData === 'object') {
      if (inputData.query) {
        queryText = inputData.query;
        queryParams = inputData.params || [];
      } else if (inputData.table) {
        // Generate a simple SELECT query for the specified table
        queryText = `SELECT * FROM ?? LIMIT 100`;
        queryParams = [inputData.table];
      }
    }

    const [rows] = await connection.execute(queryText, queryParams);
    
    return {
      rows: Array.isArray(rows) ? rows : [rows],
      rowCount: Array.isArray(rows) ? rows.length : 1,
      query: queryText,
      executedAt: new Date().toISOString(),
    };
  }

  private async executeMongoDBQuery(config: DatabaseConfig, inputData?: any): Promise<any> {
    const connectionKey = this.generateConnectionKey(config);
    
    let client = this.connectionCache.get(connectionKey);
    if (!client) {
      const connectionString = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
      client = new MongoClient(connectionString);
      await client.connect();
      this.connectionCache.set(connectionKey, client);
    }

    const db = client.db(config.database);

    let result: any;
    
    // Default operation if no specific operation provided
    if (inputData && typeof inputData === 'object') {
      const { collection, operation = 'find', query = {}, options = {} } = inputData;
      
      if (!collection) {
        // List collections if no collection specified
        const collections = await db.listCollections().toArray();
        result = {
          collections: collections.map((c: any) => c.name),
          operation: 'listCollections',
        };
      } else {
        const coll = db.collection(collection);
        
        switch (operation) {
          case 'find':
            const documents = await coll.find(query, options).limit(100).toArray();
            result = {
              documents,
              count: documents.length,
              collection,
              operation: 'find',
            };
            break;
          case 'count':
            const count = await coll.countDocuments(query);
            result = {
              count,
              collection,
              operation: 'count',
            };
            break;
          case 'aggregate':
            const pipeline = inputData.pipeline || [];
            const aggregateResult = await coll.aggregate(pipeline).toArray();
            result = {
              documents: aggregateResult,
              count: aggregateResult.length,
              collection,
              operation: 'aggregate',
            };
            break;
          default:
            throw new Error(`Unsupported MongoDB operation: ${operation}`);
        }
      }
    } else {
      // Default: list collections
      const collections = await db.listCollections().toArray();
      result = {
        collections: collections.map((c: any) => c.name),
        operation: 'listCollections',
      };
    }

    return {
      ...result,
      executedAt: new Date().toISOString(),
    };
  }

  private async testPostgreSQLConnection(config: DatabaseConfig): Promise<void> {
    const pool = new PgPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 1,
    });

    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    } finally {
      await pool.end();
    }
  }

  private async testMySQLConnection(config: DatabaseConfig): Promise<void> {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? {} : undefined,
    });

    try {
      await connection.execute('SELECT 1');
    } finally {
      await connection.end();
    }
  }

  private async testMongoDBConnection(config: DatabaseConfig): Promise<void> {
    const connectionString = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    const client = new MongoClient(connectionString);
    
    try {
      await client.connect();
      await client.db(config.database).admin().ping();
    } finally {
      await client.close();
    }
  }

  private generateConnectionKey(config: DatabaseConfig): string {
    return `${config.type}:${config.host}:${config.port}:${config.database}:${config.username}`;
  }

  // Utility methods for encryption/decryption of connection details
  encryptConnectionConfig(config: DatabaseConfig): string {
    if (this.useMockData) {
      return this.mockService.encryptConnectionConfig(config);
    }
    
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decryptConnectionConfig(encryptedConfig: string): DatabaseConfig {
    if (this.useMockData) {
      return this.mockService.decryptConnectionConfig(encryptedConfig);
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedConfig, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Clean up connections
  async closeAllConnections(): Promise<void> {
    for (const [key, connection] of this.connectionCache.entries()) {
      try {
        if (connection instanceof PgPool) {
          await connection.end();
        } else if (connection.end) {
          await connection.end();
        } else if (connection.close) {
          await connection.close();
        }
      } catch (error) {
        console.error(`Error closing connection ${key}:`, error);
      }
    }
    this.connectionCache.clear();
  }
}
