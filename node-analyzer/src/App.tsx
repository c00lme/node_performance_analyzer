import { useState } from 'react';
import { CodeAnalyzer } from './utils/analyzer';
import { PerformanceReport } from './components/PerformanceReport';
import { AnalysisResult } from './types';

const analyzer = new CodeAnalyzer();

export default function App() {
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = () => {
    const result = analyzer.analyzeCode(code);
    setAnalysis(result);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Node.js Performance Analyzer</h1>
      
      <div className="mb-4">
        <textarea
          className="w-full h-64 p-4 border rounded"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
        />
      </div>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleAnalyze}
      >
        Analyze Code
      </button>

      {analysis && <PerformanceReport analysis={analysis} />}
    </div>
  );
}