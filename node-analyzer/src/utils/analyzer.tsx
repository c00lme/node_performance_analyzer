import * as Babel from '@babel/standalone';
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
    this.openai = new OpenAI({ apiKey: 'x', dangerouslyAllowBrowser: true });
  }

  async analyzeCode(code: string): Promise<AnalysisResult> {
    try {
      // Static analysis with Babel
      const result = Babel.transform(code, {
        ast: true,
        code: false,
        filename: 'analysis.ts', // Fix for Babel preset filename error
        sourceType: 'module',
        presets: [['typescript', { isTSX: true }]],
        plugins: [
          'transform-react-jsx',
          'proposal-class-properties',
          'proposal-object-rest-spread'
        ]
      }) as BabelFileResult;

      this.issues = [];

      if (result.ast) {
        (Babel as any).traverse(result.ast, {
          CallExpression: (path: any) => {
            this.checkForNPlusOneQueries(path);
          },
        });
      }

      // Enhance analysis with OpenAI, fallback to this even if static analysis fails
      const aiAnalysis = await this.getAIAnalysis(code);

      // Merge static analysis with AI insights
      return this.mergeAnalysisResults(aiAnalysis);

    } catch (error) {
      console.error('Error analyzing code:', error);

      // In case of Babel analysis failure, perform only AI analysis
      const aiAnalysis = await this.getAIAnalysis(code);

      // Return only AI results if static analysis fails
      return this.mergeAnalysisResults(aiAnalysis);
    }
  }

  private async getAIAnalysis(code: string): Promise<AIAnalysisResponse> {
    try {
      const prompt = `Analyze the following code for performance issues and provide metrics:

Code:
${code}

Please provide:
1. Estimated load time impact (in seconds)
2. Database efficiency assessment (0-10 scale)
3. Network optimization opportunities (0-10 scale)
4. Overall potential improvement percentage
5. List of any additional performance issues found

Return the response as **strictly valid JSON**. Ensure all property names are enclosed in double quotes.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      console.log(response);

      const analysis = JSON.parse(response.choices[0].message?.content || '{}');

      return {
        loadTimeImpact: analysis.loadTimeImpact || 0,
        databaseEfficiency: analysis.databaseEfficiency || 0,
        networkOptimization: analysis.networkOptimization || 0,
        potentialImprovement: analysis.potentialImprovement || 0,
        additionalIssues: analysis.issues || [],
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

  private mergeAnalysisResults(aiAnalysis: AIAnalysisResponse): AnalysisResult {
    // Combine static and AI-detected issues
    const allIssues = [...this.issues, ...aiAnalysis.additionalIssues];

    // Calculate combined metrics
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

    // Add general recommendations based on metrics
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
