import { DatabaseConfig, ConnectionTestResult } from '../types';

export class MockDatabaseService {
  // Mock data for demonstration
  private mockData = {
    customers: [
      { id: 1, name: 'John Doe', email: 'john@example.com', total_spent: 1250.00, status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', total_spent: 890.50, status: 'active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', total_spent: 2100.75, status: 'premium' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', total_spent: 450.25, status: 'active' },
      { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', total_spent: 3200.00, status: 'premium' },
    ],
    orders: [
      { id: 1, customer_id: 1, product: 'Laptop', amount: 999.99, date: '2024-01-15' },
      { id: 2, customer_id: 1, product: 'Mouse', amount: 25.99, date: '2024-01-16' },
      { id: 3, customer_id: 2, product: 'Keyboard', amount: 89.99, date: '2024-01-17' },
      { id: 4, customer_id: 3, product: 'Monitor', amount: 299.99, date: '2024-01-18' },
      { id: 5, customer_id: 3, product: 'Webcam', amount: 79.99, date: '2024-01-19' },
    ],
    products: [
      { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99, stock: 50 },
      { id: 2, name: 'Mouse', category: 'Accessories', price: 25.99, stock: 200 },
      { id: 3, name: 'Keyboard', category: 'Accessories', price: 89.99, stock: 150 },
      { id: 4, name: 'Monitor', category: 'Electronics', price: 299.99, stock: 75 },
      { id: 5, name: 'Webcam', category: 'Electronics', price: 79.99, stock: 100 },
    ]
  };

  async executeQuery(config: any, inputData?: any): Promise<any> {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine what data to return based on config type
    const dbConfig = config as DatabaseConfig;
    
    // Return different mock data based on database name or query
    if (inputData?.table) {
      const tableName = inputData.table.toLowerCase();
      const tableData = (this.mockData as any)[tableName];
      if (tableData) {
        return {
          rows: tableData,
          rowCount: tableData.length,
          query: `SELECT * FROM ${tableName}`,
          executedAt: new Date().toISOString(),
          source: 'mock_database',
        };
      }
    }

    // Default response - customer data for demo
    return {
      rows: this.mockData.customers,
      rowCount: this.mockData.customers.length,
      query: 'SELECT * FROM customers (mock)',
      executedAt: new Date().toISOString(),
      source: 'mock_database',
      note: 'This is mock data for demonstration purposes',
    };
  }

  async testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    // Simulate connection test delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      message: `Successfully connected to MOCK ${config.type} database`,
      latency: 50, // Mock latency
      details: {
        host: config.host,
        port: config.port,
        database: config.database,
        mock: true,
        note: 'This is a simulated database connection for testing'
      },
    };
  }

  // Mock encryption/decryption (just returns the same data)
  encryptConnectionConfig(config: DatabaseConfig): string {
    return JSON.stringify({ ...config, encrypted: true, mock: true });
  }

  decryptConnectionConfig(encryptedConfig: string): DatabaseConfig {
    const config = JSON.parse(encryptedConfig);
    delete config.encrypted;
    delete config.mock;
    return config;
  }

  // Mock connection management
  async closeAllConnections(): Promise<void> {
    console.log('🔌 Mock database connections closed');
  }

  // Get sample data for different scenarios
  getSampleData(type: 'customer_analysis' | 'sales_data' | 'product_inventory' = 'customer_analysis') {
    switch (type) {
      case 'customer_analysis':
        return {
          rows: this.mockData.customers,
          rowCount: this.mockData.customers.length,
          analysis_type: 'customer_behavior',
          insights: [
            'Premium customers spend 3x more on average',
            'Active customers show consistent purchasing patterns',
            'Email engagement correlates with purchase frequency'
          ]
        };
      
      case 'sales_data':
        return {
          rows: this.mockData.orders,
          rowCount: this.mockData.orders.length,
          analysis_type: 'sales_performance',
          metrics: {
            total_revenue: 1495.95,
            avg_order_value: 299.19,
            top_product: 'Laptop'
          }
        };
      
      case 'product_inventory':
        return {
          rows: this.mockData.products,
          rowCount: this.mockData.products.length,
          analysis_type: 'inventory_status',
          alerts: [
            'Electronics category has highest margins',
            'Accessories show consistent demand',
            'Monitor stock running low'
          ]
        };
      
      default:
        return this.mockData.customers;
    }
  }
}
