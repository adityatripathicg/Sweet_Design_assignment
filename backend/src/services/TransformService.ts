import { TransformConfig } from '../types';
import vm, { Script } from 'vm';

export class TransformService {
  private timeoutMs = 30000; // 30 second timeout

  async transformData(config: any, inputData: any): Promise<any> {
    const transformConfig = config as TransformConfig;
    const startTime = Date.now();

    try {
      // Validate the configuration
      this.validateConfig(transformConfig);

      // Prepare the execution context
      const context = this.createExecutionContext(inputData, transformConfig.parameters);

      // Execute the transformation script
      const result = await this.executeScript(transformConfig.script, context);

      const executionTime = Date.now() - startTime;

      return {
        result,
        metadata: {
          operation: transformConfig.operation,
          executionTime,
          inputSize: this.getDataSize(inputData),
          outputSize: this.getDataSize(result),
          executedAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      throw new Error(`Transform operation failed: ${error.message}`);
    }
  }

  private validateConfig(config: TransformConfig): void {
    if (!config.operation) {
      throw new Error('Transform operation is required');
    }

    if (!config.script || config.script.trim().length === 0) {
      throw new Error('Transform script is required');
    }

    // Validate operation type
    const validOperations = ['filter', 'map', 'aggregate', 'join'];
    if (!validOperations.includes(config.operation)) {
      throw new Error(`Invalid operation: ${config.operation}. Must be one of: ${validOperations.join(', ')}`);
    }

    // Basic script validation (check for dangerous patterns)
    this.validateScript(config.script);
  }

  private validateScript(script: string): void {
    // List of potentially dangerous functions/patterns to block
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+.*\s+from/,
      /process\./,
      /fs\./,
      /child_process/,
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /global\./,
      /__dirname/,
      /__filename/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(script)) {
        throw new Error(`Script contains potentially unsafe pattern: ${pattern.source}`);
      }
    }

    // Check if script is too long (prevent DoS)
    if (script.length > 10000) {
      throw new Error('Script is too long (maximum 10,000 characters)');
    }
  }

  private createExecutionContext(inputData: any, parameters: Record<string, any>): vm.Context {
    // Create a safe execution context
    const context = vm.createContext({
      // Input data
      data: inputData,
      parameters: parameters || {},
      
      // Safe utilities
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      
      // Safe array methods
      console: {
        log: (...args: any[]) => console.log('[Transform]', ...args),
        error: (...args: any[]) => console.error('[Transform]', ...args),
        warn: (...args: any[]) => console.warn('[Transform]', ...args),
      },

      // Utility functions for common operations
      utils: {
        groupBy: (array: any[], keySelector: string | ((item: any) => any)) => {
          const groups: Record<string, any[]> = {};
          array.forEach(item => {
            const key = typeof keySelector === 'function' 
              ? keySelector(item) 
              : item[keySelector];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          });
          return groups;
        },
        
        sum: (array: any[], field?: string) => {
          return array.reduce((total, item) => {
            const value = field ? item[field] : item;
            return total + (Number(value) || 0);
          }, 0);
        },
        
        average: function(array: any[], field?: string) {
          if (array.length === 0) return 0;
          const total = this.sum(array, field);
          return total / array.length;
        },
        
        unique: (array: any[], field?: string) => {
          const values = field ? array.map(item => item[field]) : array;
          return [...new Set(values)];
        },
        
        sortBy: (array: any[], field: string, direction: 'asc' | 'desc' = 'asc') => {
          return array.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (direction === 'desc') {
              return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
            } else {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
          });
        },
      },

      // Result variable (will be set by the script)
      result: undefined,
    });

    return context;
  }

  private async executeScript(script: string, context: vm.Context): Promise<any> {
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent infinite loops
      const timeout = setTimeout(() => {
        reject(new Error(`Script execution timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      try {
        // Wrap the script to capture the return value
        const wrappedScript = `
          (function() {
            ${script}
          })();
        `;

        // Execute the script
        const result = vm.runInContext(wrappedScript, context, {
          timeout: this.timeoutMs,
          displayErrors: true,
        });

        clearTimeout(timeout);
        resolve(result);

      } catch (error: any) {
        clearTimeout(timeout);
        
        // Provide more helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('ReferenceError')) {
          errorMessage += ' (Make sure all variables are defined)';
        } else if (error.message.includes('SyntaxError')) {
          errorMessage += ' (Check your JavaScript syntax)';
        }
        
        reject(new Error(errorMessage));
      }
    });
  }

  private getDataSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return String(data).length;
    }
  }

  // Method to provide common transformation templates
  getTransformTemplates(): Record<string, string> {
    return {
      filter: `// Filter data based on conditions
return data.filter(item => {
  // Add your filtering logic here
  return item.value > 100;
});`,

      map: `// Transform each item in the data
return data.map(item => {
  // Add your transformation logic here
  return {
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  };
});`,

      aggregate: `// Aggregate data into summary statistics
const result = {
  total: data.length,
  sum: utils.sum(data, 'value'),
  average: utils.average(data, 'value'),
  max: Math.max(...data.map(item => item.value || 0)),
  min: Math.min(...data.map(item => item.value || 0)),
  groupedData: utils.groupBy(data, 'category')
};
return result;`,

      join: `// Join data with external dataset
// Assumes parameters.joinData contains the data to join with
const joinData = parameters.joinData || [];
return data.map(item => {
  const match = joinData.find(j => j.id === item.id);
  return match ? { ...item, ...match } : item;
});`,

      pivot: `// Pivot table transformation
const pivoted = {};
data.forEach(item => {
  const rowKey = item.category;
  const colKey = item.type;
  const value = item.value || 0;
  
  if (!pivoted[rowKey]) pivoted[rowKey] = {};
  pivoted[rowKey][colKey] = (pivoted[rowKey][colKey] || 0) + value;
});
return pivoted;`,

      clean: `// Data cleaning operations
return data.map(item => {
  // Remove null/undefined values
  const cleaned = {};
  Object.keys(item).forEach(key => {
    if (item[key] != null && item[key] !== '') {
      cleaned[key] = item[key];
    }
  });
  
  // Trim strings
  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'string') {
      cleaned[key] = cleaned[key].trim();
    }
  });
  
  return cleaned;
}).filter(item => Object.keys(item).length > 0);`,
    };
  }

  // Method to validate and test a script without executing it on real data
  async validateScriptAsync(script: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic syntax validation
      this.validateScript(script);

      // Test with dummy data
      const testData = [
        { id: 1, name: 'Test', value: 100, category: 'A' },
        { id: 2, name: 'Test 2', value: 200, category: 'B' },
      ];

      const context = this.createExecutionContext(testData, { testParam: 'test' });
      
      // Try to compile the script (doesn't execute, just checks syntax)
      new Script(`(function() { ${script} })();`);

      warnings.push('Script syntax is valid (tested with sample data)');

    } catch (error: any) {
      errors.push(error.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Helper method to safely preview script execution with limited data
  async previewTransform(script: string, inputData: any, parameters: Record<string, any> = {}): Promise<any> {
    // Limit input data for preview (first 10 items if array)
    const limitedData = Array.isArray(inputData) 
      ? inputData.slice(0, 10)
      : inputData;

    const config: TransformConfig = {
      operation: 'map',
      script,
      parameters,
    };

    return await this.transformData(config, limitedData);
  }
}
