import Groq from 'groq-sdk';
import { AIConfig, AIProcessResult } from '../types';
import { logAIRequest } from '../middleware/logger';

export class AIService {
  private groq: Groq | null;
  private useMockMode: boolean;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GROQ_API_KEY not provided - using MOCK AI mode');
      this.groq = null;
      this.useMockMode = true;
    } else {
      this.groq = new Groq({
        apiKey: apiKey,
      });
      this.useMockMode = false;
    }
  }

  async processData(config: any, inputData: any): Promise<any> {
    const aiConfig = config as AIConfig;
    const startTime = Date.now();

    try {
      // Prepare the prompt with input data
      const fullPrompt = this.buildPrompt(aiConfig.prompt, inputData);
      
      // Use mock mode if no API key
      if (this.useMockMode || !this.groq) {
        return this.generateMockResponse(fullPrompt, inputData, aiConfig);
      }
      
      // Make the AI request
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        model: aiConfig.model || 'mixtral-8x7b-32768',
        temperature: aiConfig.temperature || 0.7,
        max_tokens: aiConfig.maxTokens || 1000,
        top_p: 1,
        stream: false,
      });

      const result = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      const duration = Date.now() - startTime;

      logAIRequest(
        aiConfig.model || 'mixtral-8x7b-32768',
        fullPrompt.length,
        result.length,
        duration,
        tokensUsed
      );

      // Try to parse the result as JSON if possible
      let processedResult: any;
      try {
        processedResult = JSON.parse(result);
      } catch {
        // If not JSON, return as structured text result
        processedResult = {
          analysis: result,
          type: 'text',
          generatedAt: new Date().toISOString(),
        };
      }

      return {
        result: processedResult,
        metadata: {
          model: aiConfig.model || 'mixtral-8x7b-32768',
          tokensUsed,
          processingTime: duration,
          prompt: {
            length: fullPrompt.length,
            temperature: aiConfig.temperature || 0.7,
            maxTokens: aiConfig.maxTokens || 1000,
          },
          executedAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logAIRequest(
        aiConfig.model || 'mixtral-8x7b-32768',
        (aiConfig.prompt || '').length,
        undefined,
        duration,
        undefined,
        error.message
      );

      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  private buildPrompt(basePrompt: string, inputData: any): string {
    if (!inputData) {
      return basePrompt;
    }

    let prompt = basePrompt + '\n\n';

    // Format the input data based on its type
    if (typeof inputData === 'string') {
      prompt += inputData;
    } else if (Array.isArray(inputData)) {
      // Handle array data (like database results)
      if (inputData.length > 0) {
        prompt += 'Data to analyze:\n';
        if (typeof inputData[0] === 'object') {
          // JSON data
          prompt += JSON.stringify(inputData, null, 2);
        } else {
          // Simple array
          prompt += inputData.join('\n');
        }
      } else {
        prompt += 'No data provided for analysis.';
      }
    } else if (typeof inputData === 'object') {
      // Handle object data
      if (inputData.rows && Array.isArray(inputData.rows)) {
        // Database result format
        prompt += `Database Query Results (${inputData.rowCount || inputData.rows.length} rows):\n`;
        prompt += JSON.stringify(inputData.rows, null, 2);
      } else if (inputData.documents) {
        // MongoDB result format
        prompt += `MongoDB Query Results (${inputData.count || inputData.documents.length} documents):\n`;
        prompt += JSON.stringify(inputData.documents, null, 2);
      } else if (inputData.result) {
        // Previous AI or transform result
        prompt += 'Previous Analysis Result:\n';
        prompt += typeof inputData.result === 'string' 
          ? inputData.result 
          : JSON.stringify(inputData.result, null, 2);
      } else {
        // Generic object
        prompt += 'Data to analyze:\n';
        prompt += JSON.stringify(inputData, null, 2);
      }
    } else {
      prompt += String(inputData);
    }

    return prompt;
  }

  // Method to test AI connectivity and API key
  async testConnection(): Promise<AIProcessResult> {
    try {
      // Use mock mode if no API key
      if (this.useMockMode || !this.groq) {
        return {
          success: true,
          result: '🎭 Mock AI mode active - AI connection successful (demo mode)',
          tokens_used: 0,
          processing_time: 100,
        };
      }
      
      const testPrompt = 'Respond with "AI connection successful" to confirm the API is working.';
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: testPrompt,
          },
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0,
        max_tokens: 50,
        top_p: 1,
        stream: false,
      });

      const result = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        success: true,
        result,
        tokens_used: tokensUsed,
        processing_time: 0,
      };

    } catch (error: any) {
      return {
        success: false,
        error: `AI connection test failed: ${error.message}`,
        processing_time: 0,
      };
    }
  }

  // Method to get available models (static for now, as Groq has specific models)
  getAvailableModels(): string[] {
    return [
      'mixtral-8x7b-32768',
      'llama2-70b-4096',
      'gemma-7b-it',
    ];
  }

  // Method to validate AI configuration
  validateConfig(config: AIConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.model) {
      errors.push('Model is required');
    } else if (!this.getAvailableModels().includes(config.model)) {
      errors.push(`Unsupported model: ${config.model}`);
    }

    if (!config.prompt) {
      errors.push('Prompt is required');
    } else if (config.prompt.length < 10) {
      errors.push('Prompt is too short (minimum 10 characters)');
    }

    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 1) {
        errors.push('Temperature must be between 0 and 1');
      }
    }

    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 4000) {
        errors.push('Max tokens must be between 1 and 4000');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to estimate token count (rough estimation)
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Helper method to truncate input data if it's too large
  private truncateInputData(inputData: any, maxTokens: number = 2000): any {
    const dataString = JSON.stringify(inputData);
    const estimatedTokens = this.estimateTokens(dataString);

    if (estimatedTokens <= maxTokens) {
      return inputData;
    }

    // If it's an array, truncate it
    if (Array.isArray(inputData)) {
      const itemsPerToken = inputData.length / estimatedTokens;
      const maxItems = Math.floor(maxTokens * itemsPerToken);
      return {
        ...inputData,
        truncated: true,
        originalLength: inputData.length,
        items: inputData.slice(0, maxItems),
      };
    }

    // If it's an object with rows (database result), truncate rows
    if (inputData.rows && Array.isArray(inputData.rows)) {
      const itemsPerToken = inputData.rows.length / estimatedTokens;
      const maxItems = Math.floor(maxTokens * itemsPerToken);
      return {
        ...inputData,
        rows: inputData.rows.slice(0, maxItems),
        truncated: true,
        originalRowCount: inputData.rows.length,
      };
    }

    // For other objects, truncate the string representation
    const maxLength = maxTokens * 4; // Approximate characters
    return {
      data: dataString.substring(0, maxLength),
      truncated: true,
      originalLength: dataString.length,
    };
  }

  // Generate mock AI response when no API key is available
  private generateMockResponse(prompt: string, inputData: any, config: any): any {
    console.log('🎭 Generating mock AI response (no API key provided)');
    
    const mockAnalysis = {
      summary: 'This is a mock AI analysis result. To use real AI, provide a GROQ_API_KEY.',
      insights: [
        'Mock insight: Your workflow is configured correctly',
        'Mock insight: The data structure looks valid',
        'Mock insight: This is demonstration mode'
      ],
      recommendations: [
        'Add a real GROQ API key to get actual AI analysis',
        'Test your workflow logic with sample data',
        'Deploy and configure API keys in production'
      ],
      dataProcessed: Array.isArray(inputData) ? inputData.length : 1,
      mockMode: true
    };

    return {
      success: true,
      result: mockAnalysis,
      metadata: {
        model: config.model || 'mock-model',
        tokensUsed: 0,
        processingTime: 50,
        prompt: {
          length: prompt.length,
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 1000,
        },
        executedAt: new Date().toISOString(),
        mockMode: true,
      },
    };
  }
}
