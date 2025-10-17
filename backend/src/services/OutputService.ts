import axios from 'axios';
import { OutputConfig } from '../types';

export class OutputService {
  private readonly timeoutMs = 30000; // 30 second timeout

  async sendOutput(config: any, inputData: any): Promise<any> {
    const outputConfig = config as OutputConfig;
    const startTime = Date.now();

    try {
      let result: any;

      switch (outputConfig.type) {
        case 'webhook':
          result = await this.sendWebhook(outputConfig, inputData);
          break;
        case 'slack':
          result = await this.sendSlack(outputConfig, inputData);
          break;
        case 'email':
          result = await this.sendEmail(outputConfig, inputData);
          break;
        default:
          throw new Error(`Unsupported output type: ${outputConfig.type}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        result,
        metadata: {
          outputType: outputConfig.type,
          executionTime,
          success: true,
          sentAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      throw new Error(`Output delivery failed (${outputConfig.type}): ${error.message}`);
    }
  }

  private async sendWebhook(config: OutputConfig, inputData: any): Promise<any> {
    if (!config.webhook?.url) {
      throw new Error('Webhook URL is required');
    }

    // Prepare payload
    const payload = this.formatOutputData(inputData, 'webhook');

    // Prepare headers
    const headers = {
      'User-Agent': 'Sweet-Design-Hub-Workflow/1.0',
      ...config.webhook.headers,
    };

    try {
      const response = await axios({
        method: config.webhook.method || 'POST',
        url: config.webhook.url,
        headers,
        data: payload,
        timeout: this.timeoutMs,
        validateStatus: (status: number) => status < 400, // Accept 2xx and 3xx responses
      });

      return {
        success: true,
        statusCode: response.status,
        statusText: response.statusText,
        responseHeaders: response.headers,
        responseData: response.data,
        url: config.webhook.url,
        method: config.webhook.method || 'POST',
      };

    } catch (error: any) {
      if (error.response) {
        // HTTP error response
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to reach webhook URL');
      } else {
        // Other error
        throw error;
      }
    }
  }

  private async sendSlack(config: OutputConfig, inputData: any): Promise<any> {
    if (!config.slack?.webhook) {
      throw new Error('Slack webhook URL is required');
    }

    // Format data for Slack
    const formattedData = this.formatOutputData(inputData, 'slack');

    // Create Slack message payload
    const slackPayload: any = {
      text: 'Workflow Execution Results',
      attachments: [
        {
          color: 'good',
          title: 'Workflow Data',
          fields: [
            {
              title: 'Execution Time',
              value: new Date().toLocaleString(),
              short: true,
            },
            {
              title: 'Data Type',
              value: Array.isArray(formattedData) ? 'Array' : typeof formattedData,
              short: true,
            },
          ],
          text: '```\n' + JSON.stringify(formattedData, null, 2) + '\n```',
        },
      ],
    };

    // Add channel if specified
    if (config.slack.channel) {
      slackPayload.channel = config.slack.channel.startsWith('#') 
        ? config.slack.channel 
        : `#${config.slack.channel}`;
    }

    try {
      const response = await axios.post(config.slack.webhook, slackPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Sweet-Design-Hub-Workflow/1.0',
        },
        timeout: this.timeoutMs,
      });

      return {
        success: true,
        statusCode: response.status,
        slackResponse: response.data,
        channel: config.slack.channel,
        webhook: config.slack.webhook,
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Invalid Slack webhook URL');
      } else if (error.response?.status === 403) {
        throw new Error('Slack webhook access denied');
      } else if (error.response) {
        throw new Error(`Slack API error: ${error.response.status}`);
      } else {
        throw new Error('Failed to send Slack message');
      }
    }
  }

  private async sendEmail(config: OutputConfig, inputData: any): Promise<any> {
    if (!config.email?.to || config.email.to.length === 0) {
      throw new Error('Email recipients are required');
    }

    // Note: This is a simplified email implementation
    // In production, you would integrate with a service like SendGrid, AWS SES, etc.
    
    const formattedData = this.formatOutputData(inputData, 'email');
    const subject = config.email.subject || 'Workflow Execution Results';
    
    // Create email content
    const emailContent = this.createEmailContent(formattedData, config.email.template);

    // Simulate email sending (replace with actual email service)
    console.log('📧 Email would be sent:');
    console.log('To:', config.email.to);
    console.log('Subject:', subject);
    console.log('Content:', emailContent);

    // In a real implementation, you would use an email service here:
    /*
    const emailService = new EmailService(); // e.g., SendGrid, AWS SES
    await emailService.send({
      to: config.email.to,
      subject: subject,
      html: emailContent,
    });
    */

    return {
      success: true,
      message: 'Email sent successfully (simulated)',
      recipients: config.email.to,
      subject: subject,
      // In production, include actual email service response
      emailServiceResponse: {
        messageId: `sim_${Date.now()}`,
        status: 'sent',
      },
    };
  }

  private formatOutputData(data: any, outputType: 'webhook' | 'slack' | 'email'): any {
    if (!data) {
      return { message: 'No data to output' };
    }

    // Handle different data formats
    let formattedData: any;

    if (data.result !== undefined) {
      // Data from AI or Transform services
      formattedData = data.result;
    } else if (data.rows !== undefined) {
      // Database query results
      formattedData = {
        type: 'database_results',
        rowCount: data.rowCount || data.rows.length,
        data: data.rows,
      };
    } else if (data.documents !== undefined) {
      // MongoDB query results
      formattedData = {
        type: 'mongodb_results',
        count: data.count || data.documents.length,
        data: data.documents,
      };
    } else {
      formattedData = data;
    }

    // Apply output type specific formatting
    switch (outputType) {
      case 'slack':
        return this.formatForSlack(formattedData);
      case 'email':
        return this.formatForEmail(formattedData);
      case 'webhook':
      default:
        return {
          workflowData: formattedData,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'Sweet Design Hub Workflow',
          },
        };
    }
  }

  private formatForSlack(data: any): any {
    // Truncate data if too large for Slack
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 3000) {
      // Truncate and add indication
      return {
        ...data,
        _truncated: true,
        _note: 'Data truncated for Slack display',
        _originalSize: dataStr.length,
      };
    }
    return data;
  }

  private formatForEmail(data: any): any {
    // Email can handle larger payloads than Slack
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 50000) {
      // Very large data - create summary
      return {
        summary: this.createDataSummary(data),
        _truncated: true,
        _note: 'Large dataset summarized for email',
        _originalSize: dataStr.length,
      };
    }
    return data;
  }

  private createDataSummary(data: any): any {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        firstItem: data[0],
        lastItem: data[data.length - 1],
        sampleItems: data.slice(0, 3),
      };
    } else if (data && typeof data === 'object') {
      return {
        type: 'object',
        keys: Object.keys(data),
        sampleData: Object.fromEntries(
          Object.entries(data).slice(0, 5)
        ),
      };
    } else {
      return { type: typeof data, value: String(data).substring(0, 200) };
    }
  }

  private createEmailContent(data: any, template?: string): string {
    if (template) {
      // Use custom template (basic template variable replacement)
      return template
        .replace(/\{\{data\}\}/g, JSON.stringify(data, null, 2))
        .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())
        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    }

    // Default email template
    return `
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #0369a1;">Sweet Design Hub - Workflow Results</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Execution Details</h3>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Data Type:</strong> ${Array.isArray(data) ? 'Array' : typeof data}</p>
              ${Array.isArray(data) ? `<p><strong>Records:</strong> ${data.length}</p>` : ''}
            </div>

            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3>Data</h3>
              <pre style="background-color: #f1f5f9; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
              <p>This email was generated automatically by Sweet Design Hub Workflow Engine.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Method to test output configuration
  async testOutput(config: OutputConfig): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const testData = {
        test: true,
        message: 'This is a test from Sweet Design Hub',
        timestamp: new Date().toISOString(),
      };

      const result = await this.sendOutput(config, testData);

      return {
        success: true,
        message: `${config.type} output test successful`,
        details: result,
      };

    } catch (error: any) {
      return {
        success: false,
        message: `${config.type} output test failed: ${error.message}`,
      };
    }
  }

  // Method to validate output configuration
  validateConfig(config: OutputConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Output type is required');
      return { isValid: false, errors };
    }

    switch (config.type) {
      case 'webhook':
        if (!config.webhook?.url) {
          errors.push('Webhook URL is required');
        } else {
          try {
            new URL(config.webhook.url);
          } catch {
            errors.push('Invalid webhook URL format');
          }
        }

        if (config.webhook?.method && 
            !['POST', 'PUT', 'PATCH'].includes(config.webhook.method)) {
          errors.push('Invalid HTTP method (must be POST, PUT, or PATCH)');
        }
        break;

      case 'slack':
        if (!config.slack?.webhook) {
          errors.push('Slack webhook URL is required');
        } else if (!config.slack.webhook.includes('hooks.slack.com')) {
          errors.push('Invalid Slack webhook URL format');
        }
        break;

      case 'email':
        if (!config.email?.to || config.email.to.length === 0) {
          errors.push('Email recipients are required');
        } else {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          for (const email of config.email.to) {
            if (!emailRegex.test(email)) {
              errors.push(`Invalid email address: ${email}`);
            }
          }
        }
        break;

      default:
        errors.push(`Unsupported output type: ${config.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
