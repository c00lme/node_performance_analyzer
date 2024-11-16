export interface AnalysisResult {
    issues: PerfIssue[];
    metrics: PerfMetrics;
  }
  
  export interface PerfIssue {
    type: 'warning' | 'error';
    code: string;
    message: string;
    line: number;
    column: number;
    file: string;
    suggestion?: string;
  }
  
  export interface PerfMetrics {
    networkRequests: number;
    databaseQueries: number;
    asyncOperations: number;
    renderCalls: number;
    estimatedLoadTime: number;
  }
  