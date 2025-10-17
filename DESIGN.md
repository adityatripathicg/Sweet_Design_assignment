# Sweet Design Hub - Design Document

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture Decisions](#architecture-decisions)
- [Frontend Design](#frontend-design)
- [Backend Design](#backend-design)
- [Database Design](#database-design)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)
- [Scalability Considerations](#scalability-considerations)
- [Known Limitations](#known-limitations)

## 🎯 Overview

Sweet Design Hub is a Business Process Automation Platform designed to bridge the gap between business requirements and technical implementation. The platform enables non-technical users to create sophisticated data workflows through an intuitive drag-and-drop interface.

### Core Design Principles

1. **User-First Design** - Intuitive interface that doesn't require technical expertise
2. **Modularity** - Loosely coupled components for easy maintenance and extension
3. **Security by Default** - Secure handling of credentials and data processing
4. **Scalability** - Architecture that can grow with business needs
5. **Reliability** - Robust error handling and execution tracking

## 🏛️ Architecture Decisions

### Technology Stack Selection

#### Frontend: React + TypeScript + React Flow
**Rationale:**
- **React**: Mature ecosystem, excellent component reusability, strong community support
- **TypeScript**: Enhanced developer experience, compile-time error detection, better refactoring capabilities
- **React Flow**: Specialized library for creating node-based interfaces, handles complex interactions out-of-the-box
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development and consistent design

#### Backend: Node.js + Express + TypeScript
**Rationale:**
- **Node.js**: JavaScript across the full stack, excellent for I/O-intensive operations
- **Express**: Minimal and flexible web framework, extensive middleware ecosystem
- **TypeScript**: Shared type definitions between frontend and backend, improved code quality

#### Database: PostgreSQL
**Rationale:**
- **JSON Support**: Native JSONB support for storing workflow configurations
- **ACID Compliance**: Ensures data consistency for critical business processes
- **Extensibility**: Rich extension ecosystem (uuid-ossp, encryption functions)
- **Scalability**: Proven track record for enterprise applications

### Architectural Patterns

#### 1. Layered Architecture
```
┌─────────────────────┐
│   Presentation      │  React Components, UI Logic
├─────────────────────┤
│   API Layer         │  Express Routes, Middleware
├─────────────────────┤
│   Business Logic    │  Services, Validation, Execution Engine
├─────────────────────┤
│   Data Access       │  Database Queries, Connection Management
└─────────────────────┘
```

#### 2. Service-Oriented Design
Each node type (Database, AI, Transform, Output) is handled by a dedicated service class:
- **DatabaseService** - Handles multiple database connections and queries
- **AIService** - Manages Groq AI integration and prompt processing
- **TransformService** - Provides secure JavaScript execution environment
- **OutputService** - Handles multiple output channels (Slack, Email, Webhook)

#### 3. Execution Engine Pattern
The `WorkflowExecutionService` implements a sophisticated execution engine:
- **Topological Sorting** - Determines correct node execution order
- **Dependency Resolution** - Handles data flow between connected nodes
- **Error Isolation** - Prevents single node failures from crashing entire workflows
- **Progress Tracking** - Real-time execution status updates

## 🎨 Frontend Design

### Component Architecture

```
src/
├── components/
│   ├── nodes/               # React Flow node components
│   │   ├── DatabaseNode.tsx
│   │   ├── AINode.tsx
│   │   ├── TransformNode.tsx
│   │   └── OutputNode.tsx
│   ├── config/              # Node configuration panels
│   │   ├── DatabaseConfig.tsx
│   │   ├── AIConfig.tsx
│   │   ├── TransformConfig.tsx
│   │   └── OutputConfig.tsx
│   ├── Sidebar.tsx          # Draggable node palette
│   ├── Toolbar.tsx          # Workflow actions
│   └── NodeConfigPanel.tsx  # Configuration interface
├── types/
│   └── workflow.ts          # TypeScript definitions
├── services/
│   └── api.ts               # API integration
└── App.tsx                  # Main application component
```

### State Management Strategy

**Local State with React Hooks:**
- `useNodesState` and `useEdgesState` from React Flow for workflow state
- `useState` for UI state (selected node, execution status)
- Context API avoided to prevent unnecessary re-renders in large workflows

**Data Flow:**
```
User Action → State Update → Component Re-render → API Call (if needed)
     ↑                                                    ↓
     └─────────────── Response Handling ←─────────────────┘
```

### Design System

#### Color Scheme
- **Primary Blue** (#0ea5e9) - Actions, selected states
- **Secondary Purple** (#a855f7) - AI-related features
- **Success Green** (#22c55e) - Successful operations
- **Warning Orange** (#f59e0b) - Attention-needed states
- **Error Red** (#ef4444) - Error states

#### Node Types Visual Identity
- **Database Nodes** - Blue theme, database icon
- **AI Nodes** - Purple theme, brain icon, lightning accent
- **Transform Nodes** - Green theme, settings/gear icon
- **Output Nodes** - Orange theme, appropriate service icons (Slack, Email, etc.)

### Responsive Design Considerations

- **Grid Layout** - CSS Grid for main layout (sidebar, canvas, config panel)
- **Flexible Canvas** - React Flow handles zoom and pan automatically
- **Collapsible Panels** - Sidebar and config panel can be collapsed on smaller screens
- **Touch Support** - React Flow provides touch event handling for mobile devices

## 🔧 Backend Design

### API Design Philosophy

**RESTful Principles:**
- Resource-based URLs (`/api/workflows/:id`)
- HTTP methods map to operations (GET, POST, PUT, DELETE)
- Consistent response formats
- Proper HTTP status codes

**Error Handling Strategy:**
```typescript
interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
  details?: any;
}
```

### Service Layer Architecture

#### WorkflowExecutionService
**Responsibilities:**
- Orchestrates workflow execution
- Manages node dependencies
- Tracks execution progress
- Handles error recovery

**Key Methods:**
```typescript
class WorkflowExecutionService {
  async executeWorkflow(workflow: Workflow, inputData?: any): Promise<WorkflowExecution>
  private async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<void>
  private async getNodeInputData(node: WorkflowNode, context: ExecutionContext): Promise<any>
}
```

#### DatabaseService
**Connection Management:**
- Connection pooling for each database type
- Encrypted credential storage
- Connection testing and validation
- Query execution with timeout protection

#### AIService
**Groq Integration:**
- Model selection and configuration
- Prompt templating and data injection
- Response parsing and error handling
- Token usage tracking

#### TransformService
**Security Features:**
- Sandboxed JavaScript execution using Node.js `vm` module
- Whitelist of allowed operations
- Timeout protection against infinite loops
- Memory usage monitoring

#### OutputService
**Multi-channel Support:**
- Webhook delivery with retry logic
- Slack integration with message formatting
- Email templating system (simulated in MVP)
- Delivery confirmation tracking

### Middleware Design

#### Error Handling Middleware
```typescript
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Structured error handling with proper HTTP status codes
  // Security-conscious error message filtering
  // Comprehensive logging for debugging
}
```

#### Request Logging Middleware
- Structured logging with Winston
- Request/response correlation IDs
- Performance timing
- Security event logging

### Database Integration

#### Connection Strategy
- PostgreSQL as primary database for workflow metadata
- Connection pooling with configurable limits
- Health check endpoints for monitoring
- Graceful connection cleanup on shutdown

#### Query Optimization
- Prepared statements for security
- Indexing strategy for common queries
- Pagination for large result sets
- Connection timeout management

## 🗄️ Database Design

### Schema Overview

#### workflows Table
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',  -- Stores nodes and edges
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Design Decisions:**
- **JSONB for Config**: Flexible storage for varying node configurations
- **UUID Primary Keys**: Distributed system compatibility
- **Status Field**: Workflow lifecycle tracking
- **Timestamps**: Audit trail and ordering

#### connections Table
```sql
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,  -- Encrypted connection details
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Security Considerations:**
- **Encrypted Config**: Sensitive credentials encrypted at application level
- **Cascade Delete**: Automatic cleanup when workflows are deleted
- **Active Flag**: Soft disable without data loss

#### workflow_executions Table
```sql
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

**Audit and Performance Features:**
- **Complete Execution History**: All runs preserved for analysis
- **Performance Metrics**: Execution time tracking
- **Error Tracking**: Detailed error information
- **Data Lineage**: Input/output data preservation

### Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_connections_workflow_id ON connections(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
```

### Data Migration Strategy

- **Version-controlled Migrations**: Each schema change tracked
- **Rollback Capability**: Safe deployment practices
- **Data Seeding**: Sample data for development/testing

## 🔒 Security Considerations

### Authentication & Authorization
**Current Implementation (MVP):**
- No authentication layer (suitable for internal tools)
- IP-based access control via reverse proxy (recommended)

**Future Enhancements:**
- JWT-based authentication
- Role-based access control (RBAC)
- OAuth integration

### Data Protection

#### Encryption at Rest
```typescript
class DatabaseService {
  encryptConnectionConfig(config: DatabaseConfig): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    // ... encryption logic
  }
}
```

#### Encryption in Transit
- HTTPS for all API communications
- TLS for database connections
- Encrypted webhook payloads

#### Input Validation & Sanitization
- **Joi Schemas**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Input sanitization and CSP headers
- **Script Sandboxing**: Restricted JavaScript execution environment

### API Security

#### Rate Limiting
```typescript
// Future implementation
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

#### CORS Configuration
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
```

## ⚡ Performance Optimizations

### Frontend Performance

#### React Flow Optimizations
- **Node Memoization**: React.memo for node components
- **Connection Batching**: Batch edge updates to prevent cascading renders
- **Viewport Virtualization**: Only render visible nodes in large workflows

#### Bundle Optimization
- **Code Splitting**: Lazy loading of configuration panels
- **Tree Shaking**: Remove unused dependencies
- **Asset Optimization**: Optimized images and fonts

### Backend Performance

#### Database Query Optimization
- **Connection Pooling**: Reuse database connections
- **Query Batching**: Combine multiple queries where possible
- **Pagination**: Limit large result sets
- **Indexed Queries**: Strategic index placement

#### Caching Strategy
**Future Enhancements:**
- Redis for session and execution state caching
- CDN for static assets
- Database query result caching

#### Asynchronous Processing
```typescript
// Workflow execution is fully asynchronous
async executeWorkflow(workflow: Workflow): Promise<WorkflowExecution> {
  // Non-blocking execution with progress updates
}
```

### Memory Management

#### Node.js Optimizations
- **Garbage Collection Monitoring**: Track memory usage patterns
- **Stream Processing**: Handle large datasets without loading entirely into memory
- **Connection Cleanup**: Proper resource disposal

## 📈 Scalability Considerations

### Horizontal Scaling

#### Stateless Design
- No server-side session storage
- Database-backed state management
- Load balancer-friendly architecture

#### Microservices Evolution Path
```
Current Monolith → Service Separation → Container Orchestration
     ↓                    ↓                       ↓
   Easy Deploy       Independent Scaling    Full Orchestration
```

#### Database Scaling
- **Read Replicas**: Separate read/write workloads
- **Connection Pooling**: Efficient connection management
- **Partitioning Strategy**: Partition by workflow_id or date

### Vertical Scaling

#### Resource Optimization
- **Memory Profiling**: Identify and fix memory leaks
- **CPU Optimization**: Async processing for I/O operations
- **Database Tuning**: Query optimization and index management

### Message Queue Integration
**Future Enhancement:**
```typescript
// Queue-based workflow execution
interface WorkflowQueue {
  enqueue(workflowId: string, inputData: any): Promise<string>;
  process(): Promise<WorkflowExecution>;
}
```

## 🚨 Known Limitations

### Current MVP Limitations

#### Frontend
1. **No Multi-User Support** - Single-user interface, no real-time collaboration
2. **Limited Undo/Redo** - Basic browser back/forward only
3. **No Workflow Versioning** - No version control for workflow changes
4. **Basic Error Reporting** - Limited error context in UI

#### Backend
1. **No Authentication** - Open access to all APIs
2. **No Rate Limiting** - Vulnerable to abuse without proper deployment
3. **Simulated Email** - Email output is logged only, not actually sent
4. **No Workflow Scheduling** - Manual execution only
5. **Limited Monitoring** - Basic logging without comprehensive metrics

#### Database
1. **Single Database** - No distributed database support
2. **No Backup Strategy** - Manual database backup required
3. **Limited Audit Trail** - Basic execution logging only

### Performance Limitations

#### Concurrent Execution
- Single-threaded JavaScript limits parallel workflow execution
- No queue system for managing multiple concurrent workflows
- Database connection limits may be reached under load

#### Large Dataset Handling
- Transform scripts run in-memory (not suitable for very large datasets)
- No streaming data processing
- No data pagination in AI processing

#### Scalability Constraints
- Monolithic architecture limits independent component scaling
- No caching layer for frequently accessed data
- No CDN integration for static assets

### Security Limitations

#### Authentication & Authorization
- No user authentication or session management
- No role-based access control
- No audit logging for user actions

#### Data Security
- Database credentials stored in environment variables
- No data encryption in database (only connection configs)
- No secure key management system

### Integration Limitations

#### External Services
- Limited to specific versions of database systems
- No retry logic for failed external API calls
- No circuit breaker pattern for service failures

#### Monitoring & Observability
- No distributed tracing
- Limited metrics collection
- No alerting system for failures

## 🔄 Future Enhancements

### Short-term Improvements (Next 3 months)
1. **User Authentication** - JWT-based auth system
2. **Workflow Templates** - Pre-built common workflow patterns
3. **Enhanced Error Handling** - Better error messages and recovery options
4. **Email Service Integration** - Real email sending capability
5. **Basic Monitoring** - Health checks and basic metrics

### Medium-term Improvements (3-6 months)
1. **Real-time Collaboration** - Multiple users editing workflows simultaneously
2. **Workflow Scheduling** - Cron-like scheduling for automated execution
3. **Advanced AI Features** - Multiple AI providers, custom model fine-tuning
4. **Data Pipeline Optimization** - Streaming data processing
5. **Mobile Responsive UI** - Better mobile/tablet experience

### Long-term Vision (6-12 months)
1. **Microservices Architecture** - Break into independent services
2. **Advanced Security** - Zero-trust security model
3. **Enterprise Features** - SSO, LDAP integration, advanced RBAC
4. **AI Marketplace** - Custom AI model marketplace
5. **Workflow Analytics** - Advanced analytics and optimization suggestions

---

This design document represents the current state of the Sweet Design Hub platform and provides a roadmap for future development. The architecture has been designed with growth and extensibility in mind, allowing for incremental improvements while maintaining system stability.
