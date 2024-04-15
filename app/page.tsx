'use client';

import { useState } from 'react';

export default function Home() {
  const [workflow, setWorkflow] = useState('');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const executeWorkflow = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call to orchestrator
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResults(`Workflow executed successfully:\n\nCode Review: ✅ No issues found\nTesting: ✅ All tests passed\nDeployment: ✅ Deployed to staging`);
    } catch (error) {
      setResults(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DevMind
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered development workflow orchestration platform
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Workflow Designer</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your workflow:
              </label>
              <textarea
                value={workflow}
                onChange={(e) => setWorkflow(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Example: Review my pull request, run tests, and deploy to staging if everything passes"
              />
            </div>
            
            <button
              onClick={executeWorkflow}
              disabled={!workflow.trim() || loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Executing Workflow...' : 'Execute Workflow'}
            </button>
            
            {results && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                  {results}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}