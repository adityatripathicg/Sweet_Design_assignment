import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseConfig as DatabaseConfigType, DatabaseType } from '../../types/workflow';
import { Eye, EyeOff } from 'lucide-react';

interface DatabaseConfigProps {
  config: any;
  onUpdate: (config: DatabaseConfigType) => void;
}

const DatabaseConfig: React.FC<DatabaseConfigProps> = ({ config, onUpdate }) => {
  const [formData, setFormData] = useState<DatabaseConfigType>({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
    ...config,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const validateField = useCallback((field: keyof DatabaseConfigType, value: any): string => {
    switch (field) {
      case 'host':
        if (!value || value.trim() === '') {
          return 'Host is required';
        }
        break;
      case 'port':
        if (!value || value < 1 || value > 65535) {
          return 'Port must be between 1 and 65535';
        }
        break;
      case 'database':
        if (!value || value.trim() === '') {
          return 'Database name is required';
        }
        break;
      case 'username':
        if (!value || value.trim() === '') {
          return 'Username is required';
        }
        break;
      case 'password':
        if (!value || value.trim() === '') {
          return 'Password is required';
        }
        break;
    }
    return '';
  }, []);

  const handleInputChange = useCallback((field: keyof DatabaseConfigType, value: any) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [validateField]);

  const handleDatabaseTypeChange = useCallback((type: DatabaseType) => {
    let defaultPort = 5432;
    switch (type) {
      case 'mysql':
        defaultPort = 3306;
        break;
      case 'postgresql':
        defaultPort = 5432;
        break;
      case 'mongodb':
        defaultPort = 27017;
        break;
    }

    setFormData(prev => ({
      ...prev,
      type,
      port: defaultPort,
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Database Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Database Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['postgresql', 'mysql', 'mongodb'] as DatabaseType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleDatabaseTypeChange(type)}
              className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors duration-150 ${
                formData.type === type
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type === 'postgresql' ? 'PostgreSQL' : type === 'mysql' ? 'MySQL' : 'MongoDB'}
            </button>
          ))}
        </div>
      </div>

      {/* Host */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Host *
        </label>
        <input
          type="text"
          value={formData.host}
          onChange={(e) => handleInputChange('host', e.target.value)}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            errors.host 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="localhost"
          aria-describedby={errors.host ? 'host-error' : undefined}
          aria-invalid={!!errors.host}
        />
        {errors.host && (
          <p id="host-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.host}
          </p>
        )}
      </div>

      {/* Port */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Port *
        </label>
        <input
          type="number"
          value={formData.port}
          onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 5432)}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            errors.port
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="5432"
          min="1"
          max="65535"
          aria-describedby={errors.port ? 'port-error' : undefined}
          aria-invalid={!!errors.port}
        />
        {errors.port && (
          <p id="port-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.port}
          </p>
        )}
      </div>

      {/* Database Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Database Name *
        </label>
        <input
          type="text"
          value={formData.database}
          onChange={(e) => handleInputChange('database', e.target.value)}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            errors.database
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="my_database"
          aria-describedby={errors.database ? 'database-error' : undefined}
          aria-invalid={!!errors.database}
        />
        {errors.database && (
          <p id="database-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.database}
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            errors.username
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="username"
          aria-describedby={errors.username ? 'username-error' : undefined}
          aria-invalid={!!errors.username}
        />
        {errors.username && (
          <p id="username-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.username}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full px-3 py-2 pr-10 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.password
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500'
            }`}
            placeholder="password"
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* SSL */}
      {formData.type !== 'mongodb' && (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.ssl || false}
              onChange={(e) => handleInputChange('ssl', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Use SSL</span>
          </label>
        </div>
      )}

      {/* Connection String Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Connection Preview
        </label>
        <div className="text-xs font-mono text-gray-600 break-all">
          {formData.type === 'mongodb' 
            ? `mongodb://${formData.username ? `${formData.username}:***@` : ''}${formData.host}:${formData.port}/${formData.database || 'database'}`
            : `${formData.type}://${formData.username ? `${formData.username}:***@` : ''}${formData.host}:${formData.port}/${formData.database || 'database'}${formData.ssl ? '?ssl=true' : ''}`
          }
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfig;
