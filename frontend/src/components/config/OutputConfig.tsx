import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OutputConfig as OutputConfigType, OutputType } from '../../types/workflow';
import { Slack, Mail, Globe, Send } from 'lucide-react';

interface OutputConfigProps {
  config: any;
  onUpdate: (config: OutputConfigType) => void;
}

const OutputConfig: React.FC<OutputConfigProps> = ({ config, onUpdate }) => {
  const [formData, setFormData] = useState<OutputConfigType>({
    type: 'webhook',
    webhook: {
      url: '',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    ...config,
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const handleTypeChange = useCallback((type: OutputType) => {
    let newConfig: OutputConfigType;
    
    switch (type) {
      case 'slack':
        newConfig = {
          type: 'slack',
          slack: {
            webhook: '',
            channel: '',
          },
        };
        break;
      case 'email':
        newConfig = {
          type: 'email',
          email: {
            to: [],
            subject: '',
            template: '',
          },
        };
        break;
      case 'webhook':
      default:
        newConfig = {
          type: 'webhook',
          webhook: {
            url: '',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
        };
        break;
    }

    setFormData(newConfig);
  }, []);

  const updateWebhookField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      webhook: {
        ...prev.webhook!,
        [field]: value,
      },
    }));
  }, []);

  const updateSlackField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      slack: {
        ...prev.slack!,
        [field]: value,
      },
    }));
  }, []);

  const updateEmailField = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      email: {
        ...prev.email!,
        [field]: value,
      },
    }));
  }, []);

  // State for better UX instead of window.prompt
  const [newEmail, setNewEmail] = useState('');
  const [showAddEmail, setShowAddEmail] = useState(false);

  const addEmailRecipient = useCallback(() => {
    if (newEmail.trim() && newEmail.includes('@')) {
      setFormData(prev => ({
        ...prev,
        email: {
          ...prev.email!,
          to: [...(prev.email?.to || []), newEmail.trim()],
        },
      }));
      setNewEmail('');
      setShowAddEmail(false);
    }
  }, [newEmail]);

  const removeEmailRecipient = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      email: {
        ...prev.email!,
        to: prev.email!.to.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // State for better UX instead of window.prompt
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [showAddHeader, setShowAddHeader] = useState(false);

  const addHeader = useCallback(() => {
    if (newHeaderKey.trim()) {
      setFormData(prev => ({
        ...prev,
        webhook: {
          ...prev.webhook!,
          headers: {
            ...prev.webhook?.headers,
            [newHeaderKey.trim()]: newHeaderValue,
          },
        },
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
      setShowAddHeader(false);
    }
  }, [newHeaderKey, newHeaderValue]);

  const removeHeader = useCallback((key: string) => {
    setFormData(prev => ({
      ...prev,
      webhook: {
        ...prev.webhook!,
        headers: Object.fromEntries(
          Object.entries(prev.webhook?.headers || {}).filter(([k]) => k !== key)
        ),
      },
    }));
  }, []);

  const outputTypes = useMemo(() => [
    { type: 'webhook', label: 'Webhook', icon: Globe, color: 'purple' },
    { type: 'slack', label: 'Slack', icon: Slack, color: 'green' },
    { type: 'email', label: 'Email', icon: Mail, color: 'blue' },
  ], []);

  return (
    <div className="space-y-4">
      {/* Output Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {outputTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => handleTypeChange(type.type as OutputType)}
              className={`p-3 text-center border rounded-md transition-colors duration-150 ${
                formData.type === type.type
                  ? type.color === 'purple'
                    ? 'bg-purple-50 border-purple-500 text-purple-800'
                    : type.color === 'green'
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : 'bg-blue-50 border-blue-500 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <type.icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Webhook Configuration */}
      {formData.type === 'webhook' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhook?.url || ''}
              onChange={(e) => updateWebhookField('url', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://api.example.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              value={formData.webhook?.method || 'POST'}
              onChange={(e) => updateWebhookField('method', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Headers
              </label>
              <button
                onClick={() => setShowAddHeader(!showAddHeader)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {showAddHeader ? 'Cancel' : '+ Add Header'}
              </button>
            </div>
            
            {/* Inline Add Header Form */}
            {showAddHeader && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                    placeholder="Header name (e.g., Authorization)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                    placeholder="Header value (e.g., Bearer token123)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addHeader}
                      disabled={!newHeaderKey.trim()}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Header
                    </button>
                    <button
                      onClick={() => {
                        setShowAddHeader(false);
                        setNewHeaderKey('');
                        setNewHeaderValue('');
                      }}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {Object.entries(formData.webhook?.headers || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(formData.webhook?.headers || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={key}
                      disabled
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md font-mono"
                    />
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => updateWebhookField('headers', { ...formData.webhook?.headers, [key]: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Header value"
                    />
                    <button
                      onClick={() => removeHeader(key)}
                      className="text-red-500 hover:text-red-700 text-xs px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-gray-500 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm">No custom headers</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slack Configuration */}
      {formData.type === 'slack' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slack Webhook URL
            </label>
            <input
              type="url"
              value={formData.slack?.webhook || ''}
              onChange={(e) => updateSlackField('webhook', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel (Optional)
            </label>
            <input
              type="text"
              value={formData.slack?.channel || ''}
              onChange={(e) => updateSlackField('channel', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="general"
            />
            <p className="mt-1 text-xs text-gray-500">
              Channel name without # (leave empty to use webhook default)
            </p>
          </div>
        </div>
      )}

      {/* Email Configuration */}
      {formData.type === 'email' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Recipients
              </label>
              <button
                onClick={() => setShowAddEmail(!showAddEmail)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {showAddEmail ? 'Cancel' : '+ Add Recipient'}
              </button>
            </div>
            
            {/* Inline Add Email Form */}
            {showAddEmail && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addEmailRecipient}
                      disabled={!newEmail.trim() || !newEmail.includes('@')}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Recipient
                    </button>
                    <button
                      onClick={() => {
                        setShowAddEmail(false);
                        setNewEmail('');
                      }}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {formData.email?.to && formData.email.to.length > 0 ? (
              <div className="space-y-2">
                {formData.email.to.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const newTo = [...formData.email!.to];
                        newTo[index] = e.target.value;
                        updateEmailField('to', newTo);
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                    <button
                      onClick={() => removeEmailRecipient(index)}
                      className="text-red-500 hover:text-red-700 text-xs px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-gray-500 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm">No recipients added</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.email?.subject || ''}
              onChange={(e) => updateEmailField('subject', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Workflow Results"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Template (Optional)
            </label>
            <textarea
              value={formData.email?.template || ''}
              onChange={(e) => updateEmailField('template', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none custom-scrollbar"
              placeholder="Custom email template (leave empty for default formatting)"
            />
          </div>
        </div>
      )}

      {/* Configuration Preview */}
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
        <div className="flex items-center mb-2">
          <Send className="w-4 h-4 text-orange-600 mr-2" />
          <span className="text-sm font-medium text-orange-800">Output Configuration</span>
        </div>
        <div className="text-xs space-y-1 text-gray-600">
          <div><span className="font-medium">Type:</span> {formData.type}</div>
          {formData.type === 'webhook' && (
            <div><span className="font-medium">URL:</span> {formData.webhook?.url || 'Not set'}</div>
          )}
          {formData.type === 'slack' && (
            <div><span className="font-medium">Channel:</span> {formData.slack?.channel ? `#${formData.slack.channel}` : 'Default'}</div>
          )}
          {formData.type === 'email' && (
            <div><span className="font-medium">Recipients:</span> {formData.email?.to?.length || 0}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputConfig;
