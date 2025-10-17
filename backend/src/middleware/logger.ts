import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sweet-design-hub-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Log completion after response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log request completion
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

// Workflow execution logger
export const logWorkflowExecution = (
  workflowId: string,
  executionId: string,
  status: string,
  duration?: number,
  error?: string
): void => {
  logger.info('Workflow execution event', {
    workflowId,
    executionId,
    status,
    duration: duration ? `${duration}ms` : undefined,
    error,
    timestamp: new Date().toISOString(),
  });
};

// Node execution logger
export const logNodeExecution = (
  nodeId: string,
  nodeType: string,
  status: string,
  duration?: number,
  error?: string
): void => {
  logger.info('Node execution event', {
    nodeId,
    nodeType,
    status,
    duration: duration ? `${duration}ms` : undefined,
    error,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logger
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: string
): void => {
  logger.info('Database operation', {
    operation,
    table,
    duration: `${duration}ms`,
    success,
    error,
    timestamp: new Date().toISOString(),
  });
};

// AI service logger
export const logAIRequest = (
  model: string,
  promptLength: number,
  responseLength?: number,
  duration?: number,
  tokensUsed?: number,
  error?: string
): void => {
  logger.info('AI service request', {
    model,
    promptLength,
    responseLength,
    duration: duration ? `${duration}ms` : undefined,
    tokensUsed,
    error,
    timestamp: new Date().toISOString(),
  });
};

// Export the winston logger for direct use
export { logger };

// Utility function to create structured log entries
export const createLogEntry = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata: Record<string, any> = {}
): void => {
  logger.log(level, message, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
