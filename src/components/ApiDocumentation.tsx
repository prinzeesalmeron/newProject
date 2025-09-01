import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, Database, Key } from 'lucide-react';

export const ApiDocumentation = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string>('');
  
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;
  
  const endpoints = [
    {
      method: 'GET',
      path: '/properties',
      description: 'Get all active properties',
      example: `${baseUrl}/properties`
    },
    {
      method: 'GET',
      path: '/properties/{id}',
      description: 'Get specific property with details',
      example: `${baseUrl}/properties/123e4567-e89b-12d3-a456-426614174000`
    },
    {
      method: 'GET',
      path: '/users',
      description: 'Get all active users (public info only)',
      example: `${baseUrl}/users`
    },
    {
      method: 'GET',
      path: '/transactions',
      description: 'Get transactions (optionally filter by user_id)',
      example: `${baseUrl}/transactions?user_id=123e4567-e89b-12d3-a456-426614174000`
    },
    {
      method: 'GET',
      path: '/staking-pools',
      description: 'Get all active staking pools',
      example: `${baseUrl}/staking-pools`
    },
    {
      method: 'GET',
      path: '/shares',
      description: 'Get user shares (optionally filter by user_id)',
      example: `${baseUrl}/shares?user_id=123e4567-e89b-12d3-a456-426614174000`
    },
    {
      method: 'GET',
      path: '/analytics/overview',
      description: 'Get platform analytics and overview stats',
      example: `${baseUrl}/analytics/overview`
    }
  ];

  const handleCopy = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">API Documentation</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Access your BlockEstate data via REST API</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">Base URL</h3>
            <div className="flex items-center space-x-2">
              <code className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded border text-gray-900 dark:text-white">
                {baseUrl}
              </code>
              <button
                onClick={() => handleCopy(baseUrl, 'base-url')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {copiedEndpoint === 'base-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Endpoints</h3>
        
        {endpoints.map((endpoint, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  endpoint.method === 'GET' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-gray-900 dark:text-white">{endpoint.path}</code>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(endpoint.example, endpoint.path)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Copy example URL"
                >
                  {copiedEndpoint === endpoint.path ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={endpoint.example}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{endpoint.description}</p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
              <code className="text-xs text-gray-700 dark:text-gray-300 break-all">
                {endpoint.example}
              </code>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Authentication</h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          These endpoints use your Supabase configuration. Make sure you have connected to Supabase for the API to work properly.
        </p>
      </div>

      <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Response Format</h4>
        <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "data": [...],
  "count": 10
}`}
        </pre>
      </div>
    </div>
  );
};