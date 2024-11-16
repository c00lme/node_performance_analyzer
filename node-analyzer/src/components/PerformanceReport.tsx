import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AnalysisResult } from '../types';
import { MetricCard } from './MetricCard';

interface PerformanceReportProps {
  analysis: AnalysisResult;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({ analysis }) => {
  const loadTimeData = [
    { name: 'Current', time: analysis.metrics.loadTime },
    { name: 'With Changes', time: analysis.metrics.loadTime * (1 - analysis.metrics.potentialImprovement / 100) }
  ];

  return (
    <div className="space-y-6">
      {analysis.issues.some(issue => issue.type === 'critical') && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
          <div className="font-bold text-red-800">Critical Performance Issues Detected</div>
          <div className="text-red-700">Performance issues found that require immediate attention</div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Performance Impact Summary</h2>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Estimated Load Time Impact</h3>
          <LineChart width={600} height={200} data={loadTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="time" stroke="#8884d8" />
          </LineChart>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="Database Load"
            value={`${analysis.metrics.databaseLoad}x Higher`}
            description="Than necessary"
            variant="warning"
          />
          
          <MetricCard
            title="Network Requests"
            value={`${analysis.metrics.networkRequests}+`}
            description="Per page load"
            variant="error"
          />

          <MetricCard
            title="Potential Improvement"
            value={`${analysis.metrics.potentialImprovement}%`}
            description="Load time reduction"
            variant="success"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Detected Issues</h3>
          {analysis.issues.map((issue, index) => (
            <div 
              key={index}
              className={`p-4 rounded ${
                issue.type === 'critical' ? 'bg-red-50' :
                issue.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`px-2 py-1 text-sm rounded ${
                  issue.type === 'critical' ? 'bg-red-200 text-red-800' :
                  issue.type === 'warning' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'
                }`}>
                  {issue.type}
                </span>
                <div>
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-sm text-gray-600">{issue.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recommended Solutions</h2>
        <div className="space-y-4">
          {analysis.recommendations.map((rec, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-medium">{rec.title}</h3>
              <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                {rec.code}
              </pre>
              <p className="text-sm text-gray-600">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
