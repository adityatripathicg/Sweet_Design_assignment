import { WorkflowNode, WorkflowEdge, WorkflowValidationResult } from '../types';

export const validateWorkflowNodes = (nodes: WorkflowNode[]): WorkflowValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(nodes)) {
    return {
      isValid: false,
      errors: ['Nodes must be an array'],
      warnings: [],
    };
  }

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  const duplicateIds = new Set<string>();

  nodes.forEach((node, index) => {
    // Validate node structure
    if (!node.id) {
      errors.push(`Node at index ${index} is missing required 'id' field`);
    } else {
      if (nodeIds.has(node.id)) {
        duplicateIds.add(node.id);
      }
      nodeIds.add(node.id);
    }

    if (!node.type) {
      errors.push(`Node ${node.id || index} is missing required 'type' field`);
    } else if (!['database', 'ai', 'transform', 'output'].includes(node.type)) {
      errors.push(`Node ${node.id || index} has invalid type: ${node.type}`);
    }

    if (!node.data) {
      errors.push(`Node ${node.id || index} is missing required 'data' field`);
    } else {
      // Validate node data
      if (!node.data.label) {
        warnings.push(`Node ${node.id} is missing a label`);
      }

      if (!node.data.config) {
        warnings.push(`Node ${node.id} has no configuration`);
      } else {
        // Type-specific validation
        validateNodeConfig(node, errors, warnings);
      }
    }

    // Validate position
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push(`Node ${node.id || index} has invalid position data`);
    }
  });

  // Report duplicate IDs
  duplicateIds.forEach(id => {
    errors.push(`Duplicate node ID found: ${id}`);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateWorkflowEdges = (
  edges: WorkflowEdge[], 
  nodes: WorkflowNode[]
): WorkflowValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(edges)) {
    return {
      isValid: false,
      errors: ['Edges must be an array'],
      warnings: [],
    };
  }

  const nodeIds = new Set(nodes.map(node => node.id));
  const edgeIds = new Set<string>();

  edges.forEach((edge, index) => {
    // Validate edge structure
    if (!edge.id) {
      errors.push(`Edge at index ${index} is missing required 'id' field`);
    } else if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge ID found: ${edge.id}`);
    } else {
      edgeIds.add(edge.id);
    }

    if (!edge.source) {
      errors.push(`Edge ${edge.id || index} is missing required 'source' field`);
    } else if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id || index} references non-existent source node: ${edge.source}`);
    }

    if (!edge.target) {
      errors.push(`Edge ${edge.id || index} is missing required 'target' field`);
    } else if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id || index} references non-existent target node: ${edge.target}`);
    }

    // Check for self-referencing edges
    if (edge.source === edge.target) {
      errors.push(`Edge ${edge.id || index} is self-referencing (source and target are the same)`);
    }
  });

  // Check for disconnected nodes (warning only)
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach(node => {
    if (!connectedNodes.has(node.id)) {
      warnings.push(`Node ${node.id} is not connected to any other nodes`);
    }
  });

  // Check for cycles (warning only for now)
  const cycles = detectCycles(nodes, edges);
  if (cycles.length > 0) {
    warnings.push(`Workflow contains ${cycles.length} cycle(s). This may cause infinite loops during execution.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

const validateNodeConfig = (node: WorkflowNode, errors: string[], warnings: string[]): void => {
  const config = node.data.config as any;

  switch (node.type) {
    case 'database':
      if (!config.type) {
        errors.push(`Database node ${node.id} is missing database type`);
      }
      if (!config.host) {
        errors.push(`Database node ${node.id} is missing host`);
      }
      if (!config.database) {
        warnings.push(`Database node ${node.id} is missing database name`);
      }
      if (!config.username) {
        warnings.push(`Database node ${node.id} is missing username`);
      }
      if (!config.password) {
        warnings.push(`Database node ${node.id} is missing password`);
      }
      break;

    case 'ai':
      if (!config.model) {
        errors.push(`AI node ${node.id} is missing model specification`);
      }
      if (!config.prompt) {
        errors.push(`AI node ${node.id} is missing prompt`);
      }
      if (config.temperature && (config.temperature < 0 || config.temperature > 1)) {
        errors.push(`AI node ${node.id} has invalid temperature (must be between 0 and 1)`);
      }
      if (config.maxTokens && config.maxTokens < 1) {
        errors.push(`AI node ${node.id} has invalid maxTokens (must be positive)`);
      }
      break;

    case 'transform':
      if (!config.operation) {
        errors.push(`Transform node ${node.id} is missing operation type`);
      }
      if (!config.script) {
        errors.push(`Transform node ${node.id} is missing script`);
      }
      break;

    case 'output':
      if (!config.type) {
        errors.push(`Output node ${node.id} is missing output type`);
      }
      
      switch (config.type) {
        case 'webhook':
          if (!config.webhook?.url) {
            errors.push(`Output node ${node.id} webhook is missing URL`);
          }
          break;
        case 'slack':
          if (!config.slack?.webhook) {
            errors.push(`Output node ${node.id} slack is missing webhook URL`);
          }
          break;
        case 'email':
          if (!config.email?.to || config.email.to.length === 0) {
            errors.push(`Output node ${node.id} email is missing recipients`);
          }
          break;
      }
      break;
  }
};

// Simple cycle detection using DFS
const detectCycles = (nodes: WorkflowNode[], edges: WorkflowEdge[]): string[][] => {
  const adjacencyList = new Map<string, string[]>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  // Build adjacency list
  nodes.forEach(node => adjacencyList.set(node.id, []));
  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });

  const dfs = (nodeId: string, path: string[]): void => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        cycles.push([...path.slice(cycleStart), neighbor]);
      }
    }

    recursionStack.delete(nodeId);
  };

  // Check each unvisited node
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return cycles;
};

export const validateExecutionOrder = (nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] => {
  // Topological sort to determine execution order
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();
  
  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });

  // Build graph and calculate in-degrees
  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
    
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Kahn's algorithm for topological sorting
  const queue: string[] = [];
  const result: string[] = [];

  // Find all nodes with no incoming edges
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = adjacencyList.get(current) || [];
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
};
