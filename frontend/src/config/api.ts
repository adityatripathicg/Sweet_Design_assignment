// API Configuration for production and development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://sweet-design-hub-backend.onrender.com'
  : process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Health check
  health: '/api/health',
  
  // Workflows
  workflows: '/api/workflows',
  workflow: (id: string) => `/api/workflows/${id}`,
  workflowExecute: (id: string) => `/api/workflows/${id}/run`,
  workflowExecutions: (id: string) => `/api/workflows/${id}/executions`,
  workflowValidate: (id: string) => `/api/workflows/${id}/validate`,
  workflowDuplicate: (id: string) => `/api/workflows/${id}/duplicate`,
  
  // AI
  aiProcess: '/api/ai/process',
  aiTest: '/api/ai/test',
  aiModels: '/api/ai/models',
  aiValidate: '/api/ai/validate',
  aiPreview: '/api/ai/preview',
  
  // Connections
  connections: '/api/connections',
  connection: (id: string) => `/api/connections/${id}`,
  connectionTest: (id: string) => `/api/connections/${id}/test`,
  
  // Execution
  execution: '/api/execution',
  executionStatus: (id: string) => `/api/execution/${id}`,
  executionLogs: (id: string) => `/api/execution/${id}/logs`,
};

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;
