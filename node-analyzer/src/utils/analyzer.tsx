import * as Babel from '@babel/standalone';
import traverse from '@babel/traverse'; 
import OpenAI from 'openai';
import { PerformanceIssue, AnalysisResult } from '../types';

interface BabelFileResult {
  ast: any;
}

interface AIAnalysisResponse {
  loadTimeImpact: number;
  databaseEfficiency: number;
  networkOptimization: number;
  potentialImprovement: number;
  additionalIssues: PerformanceIssue[];
}

export class CodeAnalyzer {
  private issues: PerformanceIssue[] = [];
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: '', 
      dangerouslyAllowBrowser: true 
    });
  }

  async analyzeCode(code: string): Promise<AnalysisResult> {
    try {
      // Fixed Babel configuration
      const result = Babel.transform(code, {
        ast: true,
        code: false,
        filename: 'analysis.tsx', // Changed to .tsx
        sourceType: 'module',
        presets: [[
          'typescript', {
            isTSX: true,
            allExtensions: true, // Added this option
            allowNamespaces: true,
            allowDeclareFields: true,
          }
        ]],
        plugins: [
          ['transform-react-jsx', { runtime: 'automatic' }],
          'proposal-class-properties',
          'proposal-object-rest-spread'
        ]
      }) as BabelFileResult;

      this.issues = [];

      if (result.ast) {
        traverse(result.ast, {
          CallExpression: (path: any) => {
            this.checkForNPlusOneQueries(path);
          },
        });
      }

      // Enhanced analysis with OpenAI using regex patterns
      const aiAnalysis = await this.getAIAnalysis(code);

      return this.mergeAnalysisResults(aiAnalysis);

    } catch (error) {
      console.error('Error analyzing code:', error);
      const aiAnalysis = await this.getAIAnalysis(code);
      return this.mergeAnalysisResults(aiAnalysis);
    }
  }

  private async getAIAnalysis(code: string): Promise<AIAnalysisResponse> {
    try {
      const prompt = `Analyze the following code for performance issues and provide metrics in the exact format shown below:

Code:
${code}

Please format your response exactly as follows:
LOAD_TIME: {number} seconds
DATABASE_EFFICIENCY: {number}/10
NETWORK_OPTIMIZATION: {number}/10
POTENTIAL_IMPROVEMENT: {number}%

PERFORMANCE_ISSUES:
1. TYPE: {critical|warning|info}
   TITLE: {issue title}
   DESCRIPTION: {detailed description}
   LINE: {line number if applicable}
   SUGGESTION: {improvement suggestion}
   IMPACT: {number}

2. TYPE: {critical|warning|info}
   ...
(repeat for each issue found)`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.choices[0].message?.content || '';
      
      // Extract metrics using regex patterns
      const loadTime = this.extractNumber(content, /LOAD_TIME: ([\d.]+)/);
      const dbEfficiency = this.extractNumber(content, /DATABASE_EFFICIENCY: ([\d.]+)/);
      const networkOpt = this.extractNumber(content, /NETWORK_OPTIMIZATION: ([\d.]+)/);
      const potentialImp = this.extractNumber(content, /POTENTIAL_IMPROVEMENT: ([\d.]+)/);
      
      // Extract performance issues
      const issues = this.extractPerformanceIssues(content);

      return {
        loadTimeImpact: loadTime,
        databaseEfficiency: dbEfficiency,
        networkOptimization: networkOpt,
        potentialImprovement: potentialImp,
        additionalIssues: issues,
      };
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      return {
        loadTimeImpact: 0,
        databaseEfficiency: 0,
        networkOptimization: 0,
        potentialImprovement: 0,
        additionalIssues: [],
      };
    }
  }

  private extractNumber(content: string, pattern: RegExp): number {
    const match = content.match(pattern);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractPerformanceIssues(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const issuePattern = /TYPE: (critical|warning|info)\s+TITLE: (.+?)\s+DESCRIPTION: (.+?)\s+(?:LINE: ([\d]+)\s+)?SUGGESTION: (.+?)\s+IMPACT: ([\d]+)/gs;
    
    let match;
    while ((match = issuePattern.exec(content)) !== null) {
      const [_, type, title, description, line, suggestion, impact] = match;
      
      issues.push({
        type: type as 'critical' | 'warning' | 'info',
        title: title.trim(),
        description: description.trim(),
        line: line ? parseInt(line) : undefined,
        suggestion: suggestion.trim(),
        impact: parseInt(impact),
      });
    }

    return issues;
  }

  private mergeAnalysisResults(aiAnalysis: AIAnalysisResponse): AnalysisResult {
    const allIssues = [...this.issues, ...aiAnalysis.additionalIssues];

    const metrics = {
      loadTime: aiAnalysis.loadTimeImpact || this.calculateBaseLoadTime(),
      databaseLoad: aiAnalysis.databaseEfficiency || this.calculateBaseDatabaseLoad(),
      networkRequests: aiAnalysis.networkOptimization || this.calculateBaseNetworkRequests(),
      potentialImprovement: aiAnalysis.potentialImprovement || this.calculateBasePotentialImprovement(),
    };

    return {
      issues: allIssues,
      metrics,
      recommendations: this.generateEnhancedRecommendations(allIssues, metrics),
    };
  }

  private checkForNPlusOneQueries(path: any) {
    if (
      path.node.callee?.type === 'MemberExpression' &&
      path.node.callee.property?.type === 'Identifier' &&
      path.node.callee.property.name === 'map' &&
      this.hasAwaitParent(path)
    ) {
      this.issues.push({
        type: 'critical',
        title: 'N+1 Query Pattern Detected',
        description: 'Multiple sequential database queries found inside a loop',
        line: path.node.loc?.start.line,
        suggestion: 'Use batch fetching to reduce database calls',
        impact: 70,
      });
    }
  }

  private hasAwaitParent(path: any): boolean {
    let parent = path.parentPath;
    while (parent) {
      if (parent.node.type === 'AwaitExpression') {
        return true;
      }
      parent = parent.parentPath;
    }
    return false;
  }

  private calculateBaseLoadTime(): number {
    const criticalIssues = this.issues.filter(i => i.type === 'critical').length;
    return 2.8 + (criticalIssues * 0.5);
  }

  private calculateBaseDatabaseLoad(): number {
    const criticalIssues = this.issues.filter(i => i.type === 'critical').length;
    return criticalIssues * 1.5;
  }

  private calculateBaseNetworkRequests(): number {
    const criticalIssues = this.issues.filter(i => i.type === 'critical').length;
    return criticalIssues * 15;
  }

  private calculateBasePotentialImprovement(): number {
    const criticalIssues = this.issues.filter(i => i.type === 'critical').length;
    return Math.min(criticalIssues * 20, 80);
  }

  private generateEnhancedRecommendations(
    issues: PerformanceIssue[],
    metrics: AnalysisResult['metrics']
  ): AnalysisResult['recommendations'] {
    const recommendations = issues.map(issue => ({
      title: `Fix ${issue.title}`,
      description: issue.suggestion || 'No specific recommendation available',
      code: this.getExampleCode(issue.title),
    }));

    if (metrics.networkRequests > 10) {
      recommendations.push({
        title: 'Implement Request Batching',
        description: 'Reduce the number of network requests by implementing request batching',
        code: this.getBatchingExampleCode(),
      });
    }

    if (metrics.databaseLoad > 5) {
      recommendations.push({
        title: 'Optimize Database Queries',
        description: 'Implement database query optimization techniques',
        code: this.getQueryOptimizationCode(),
      });
    }

    return recommendations;
  }

  private getExampleCode(issueTitle: string): string {
    const examples: Record<string, string> = {
      'N+1 Query Pattern Detected': `
const fetchProductsWithDetails = async (productIds) => {
  const response = await fetch('/api/products/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: productIds })
  });
  return response.json();
};`,
    };
    return examples[issueTitle] || '';
  }

  private getBatchingExampleCode(): string {
    return `
const batchRequests = async (requests) => {
  return Promise.all(
    requests.map(req => fetch(req.url, req.options))
  );
};`;
  }

  private getQueryOptimizationCode(): string {
    return `
const getProductsWithCategories = async () => {
  return await prisma.product.findMany({
    include: { category: true },
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });
};`;
  }
}