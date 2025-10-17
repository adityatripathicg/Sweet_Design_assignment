# Sweet Design Hub - Business Process Automation Platform

A comprehensive drag-and-drop workflow builder that enables non-technical business teams to design, visualize, and execute complex data workflows through an intuitive visual interface.

![Workflow Builder](https://via.placeholder.com/800x400?text=Sweet+Design+Hub+Workflow+Builder)

## 🚀 Features

### Core Functionality
- **Drag & Drop Interface** - Intuitive workflow creation with React Flow
- **Multiple Database Support** - Connect to MySQL, PostgreSQL, and MongoDB
- **AI-Powered Analysis** - Integrate Groq AI for intelligent data processing
- **Data Transformation** - Custom JavaScript-based data transformation engine
- **Multi-Channel Output** - Send results via Slack, Email, or REST API webhooks
- **Workflow Persistence** - Save, load, and manage workflow configurations
- **Real-time Execution** - Monitor workflow execution with live status updates

### Advanced Features
- **Connection Testing** - Validate database connections before execution
- **Script Validation** - Safe JavaScript execution environment for transformations
- **Execution History** - Track and analyze past workflow runs
- **Error Handling** - Comprehensive error tracking and reporting
- **Configuration Management** - Encrypted storage of sensitive connection data

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Node.js API   │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • React Flow    │◄──►│ • Express       │◄──►│ • Workflows     │
│ • TypeScript    │    │ • TypeScript    │    │ • Executions    │
│ • Tailwind CSS  │    │ • Validation    │    │ • Connections   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Groq AI API   │  Database Conn. │    Output Services      │
│                 │                 │                         │
│ • Mixtral       │ • MySQL         │ • Slack Webhooks        │
│ • Llama 2       │ • PostgreSQL    │ • Email (Simulated)     │
│ • Gemma         │ • MongoDB       │ • REST API Webhooks     │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Docker (optional, for database setup)

### Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/sweet-design-hub/automation-platform.git
cd automation-platform
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Environment Configuration:**
Create a `.env` file in the project root:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweet_automation
DB_USER=postgres
DB_PASSWORD=postgres123

# Server Configuration
PORT=3001
NODE_ENV=development

# Groq AI Configuration (Required)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=mixtral-8x7b-32768

# Security
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-32-char-encryption-key-here

# External Services (Optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
SENDGRID_API_KEY=your_sendgrid_api_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

4. **Database Setup:**

**Option A: Using Docker (Recommended)**
```bash
npm run docker:up
```

**Option B: Manual PostgreSQL Setup**
```bash
# Create database
createdb sweet_automation

# Run migration script
npm run db:migrate
```

5. **Get Groq API Key:**
   - Visit [Groq Console](https://console.groq.com/)
   - Create an account and generate an API key
   - Add the key to your `.env` file

## 🚀 Running the Application

### Development Mode
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run frontend:dev  # Frontend only (port 3000)
npm run backend:dev   # Backend only (port 3001)
```

### Production Mode
```bash
# Build applications
npm run frontend:build
npm run backend:build

# Start production server
npm start
```

### Using Docker
```bash
# Start all services including databases
npm run docker:up

# Stop services
npm run docker:down
```

## 📱 Usage Guide

### 1. Creating Your First Workflow

1. **Access the Application**
   - Open http://localhost:3000 in your browser

2. **Add Nodes to Canvas**
   - Drag node types from the left sidebar to the canvas
   - Available node types:
     - **Database** - Connect to data sources
     - **AI Processor** - Analyze data with Groq AI
     - **Transform** - Process and manipulate data
     - **Output** - Send results to external services

3. **Configure Nodes**
   - Click on any node to open the configuration panel
   - Set up database connections, AI prompts, or output destinations

4. **Connect Nodes**
   - Drag from the output handle (right side) of one node to the input handle (left side) of another
   - Data flows from left to right through your workflow

5. **Save & Execute**
   - Click "Save" to store your workflow
   - Click "Execute" to run the workflow and see results

### 2. Node Configuration Examples

#### Database Node
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "sales_data",
  "username": "analyst",
  "password": "secure_password"
}
```

#### AI Node
```javascript
// Example AI Prompt
Analyze the customer data and provide:
1. Key customer segments
2. Buying patterns and trends
3. Customer satisfaction indicators
4. Recommendations for improvement

Data to analyze:
```

#### Transform Node
```javascript
// Example transformation script
return data.map(customer => ({
  ...customer,
  totalSpent: customer.orders.reduce((sum, order) => sum + order.amount, 0),
  avgOrderValue: customer.orders.length > 0 
    ? customer.totalSpent / customer.orders.length 
    : 0,
  riskScore: customer.totalSpent < 100 ? 'high' : 'low'
}));
```

#### Output Node - Slack
```json
{
  "type": "slack",
  "webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "channel": "marketing-insights"
}
```

## 🔧 API Documentation

### Workflows API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List all workflows |
| POST | `/api/workflows` | Create new workflow |
| GET | `/api/workflows/:id` | Get workflow details |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:id/run` | Execute workflow |

### Database Connections API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connections/test` | Test database connection |
| GET | `/api/connections` | List saved connections |
| POST | `/api/connections` | Save new connection |
| PUT | `/api/connections/:id` | Update connection |
| DELETE | `/api/connections/:id` | Delete connection |

### AI Processing API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/process` | Process data with AI |
| POST | `/api/ai/test` | Test AI connectivity |
| GET | `/api/ai/models` | List available models |
| POST | `/api/ai/validate` | Validate AI config |

### Example API Request

```bash
# Test database connection
curl -X POST http://localhost:3001/api/connections/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "postgresql",
    "config": {
      "host": "localhost",
      "port": 5432,
      "database": "test_db",
      "username": "user",
      "password": "password"
    }
  }'
```

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### Integration Testing
```bash
npm run test:integration
```

## 📊 Database Schema

### Core Tables

```sql
-- Workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Database Connections (encrypted)
CREATE TABLE connections (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL, -- encrypted
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution History
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

## 🔒 Security

- **Data Encryption** - Database credentials are encrypted at rest
- **Input Validation** - Comprehensive validation for all API endpoints
- **Script Sandboxing** - Safe execution environment for transformation scripts
- **CORS Protection** - Configurable CORS policies
- **Rate Limiting** - API rate limiting to prevent abuse

## 🐳 Docker Support

The project includes Docker configuration for easy development setup:

```yaml
# docker-compose.yml includes:
- PostgreSQL database
- MySQL database (for testing)
- MongoDB (for testing)
- Redis (for caching)
```

## 🚧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker ps
   
   # Restart database services
   npm run docker:down
   npm run docker:up
   ```

2. **Groq AI API Errors**
   ```bash
   # Test your API key
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.groq.com/openai/v1/models
   ```

3. **Frontend Build Issues**
   ```bash
   # Clear node modules and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Port Already in Use**
   ```bash
   # Kill processes using the port
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development DEBUG=* npm run backend:dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all linting passes (`npm run lint`)


## 🎯 Roadmap

### Upcoming Features
- [ ] Workflow Templates Library
- [ ] Real-time Collaboration
- [ ] Advanced Monitoring Dashboard
- [ ] Custom Node Development SDK
- [ ] Workflow Version Control
- [ ] Advanced Security Features

### Version History
- **v1.0.0** - Initial MVP release with core functionality
- **v1.1.0** - Enhanced AI capabilities and better error handling
- **v1.2.0** - Advanced transformation features and output options

---

