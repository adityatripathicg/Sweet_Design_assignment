// Mock database connection for testing without real database setup
export const initializeDatabase = async (): Promise<void> => {
  console.log('🎭 Initializing MOCK database connection...');
  
  // Simulate database initialization delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Mock database initialized successfully');
  console.log('📝 Using sample data for demonstration:');
  console.log('   - 5 sample customers');
  console.log('   - 5 sample orders');
  console.log('   - 5 sample products');
  console.log('   - All database operations will use mock data');
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  console.log(`🎭 Mock Query: ${text.substring(0, 100)}...`);
  
  // Simulate query delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock responses for common queries
  if (text.includes('workflows')) {
    if (text.includes('INSERT')) {
      return {
        rows: [{
          id: 'mock-workflow-' + Date.now(),
          name: 'Sample Workflow',
          description: 'This is a mock workflow',
          config: '{}',
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date()
        }]
      };
    } else if (text.includes('SELECT')) {
      return {
        rows: [{
          id: 'mock-workflow-123',
          name: 'Customer Insight Workflow',
          description: 'Mock workflow for testing',
          config: JSON.stringify({
            nodes: [],
            edges: [],
            version: '1.0.0'
          }),
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
          node_count: 0,
          edge_count: 0
        }]
      };
    }
  }

  if (text.includes('workflow_executions')) {
    return {
      rows: [{
        id: 'mock-execution-' + Date.now(),
        workflow_id: params?.[0] || 'mock-workflow-123',
        status: 'completed',
        input_data: null,
        output_data: { message: 'Mock execution completed successfully' },
        execution_time_ms: 1500,
        started_at: new Date(),
        completed_at: new Date()
      }]
    };
  }

  if (text.includes('connections')) {
    return {
      rows: [{
        id: 'mock-connection-' + Date.now(),
        workflow_id: null,
        name: 'Mock Database Connection',
        type: 'postgresql',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]
    };
  }

  // Default mock response
  return {
    rows: [],
    rowCount: 0
  };
};

export const getClient = async (): Promise<any> => {
  return {
    query,
    release: () => console.log('🎭 Mock client released')
  };
};

export const closePool = async (): Promise<void> => {
  console.log('🔒 Mock database pool closed');
};

export const healthCheck = async (): Promise<{ healthy: boolean; latency: number }> => {
  return { 
    healthy: true, 
    latency: 50 // Mock latency
  };
};

