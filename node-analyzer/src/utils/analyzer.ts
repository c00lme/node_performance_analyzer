import * as Babel from '@babel/standalone';
import { PerformanceIssue, AnalysisResult } from '../types';

interface BabelFileResult {
  ast: any;
}

export class CodeAnalyzer {
  private issues: PerformanceIssue[] = [];

  analyzeCode(code: string): AnalysisResult {
    try {
      // Use the correct plugin name 'transform-react-jsx' instead of 'jsx'
      const result = Babel.transform(code, {
        ast: true,
        code: false,
        sourceType: 'module',
        presets: ['typescript'], // Add typescript preset
        plugins: [
          'transform-react-jsx', // Correct plugin name for JSX
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

      return {
        issues: this.issues,
        metrics: this.calculateMetrics(),
        recommendations: this.generateRecommendations(),
      };
    } catch (error) {
      console.error('Error analyzing code:', error);
      return {
        issues: [{
          type: 'warning',
          title: 'Analysis Error',
          description: String(error) || 'Failed to analyze code',
          line: 0,
        }],
        metrics: {
          loadTime: 0,
          databaseLoad: 0,
          networkRequests: 0,
          potentialImprovement: 0,
        },
        recommendations: [],
      };
    }
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

  private calculateMetrics(): AnalysisResult['metrics'] {
    const criticalIssues = this.issues.filter((issue) => issue.type === 'critical').length;
    
    return {
      loadTime: 2.8,
      databaseLoad: criticalIssues * 1.5,
      networkRequests: criticalIssues * 15,
      potentialImprovement: Math.min(criticalIssues * 20, 80),
    };
  }

  private generateRecommendations(): AnalysisResult['recommendations'] {
    return this.issues.map((issue) => ({
      title: `Fix ${issue.title}`,
      description: issue.suggestion || 'No specific recommendation available',
      code: this.getExampleCode(issue.title),
    }));
  }

  private getExampleCode(issueTitle: string): string {
    const examples: Record<string, string> = {
      'N+1 Query Pattern Detected': `
const fetchProductsWithDetails = async (productIds) => {
  const response = await fetch('/api/products/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: productIds }),
  });
  return response.json();
};`,
    };
    return examples[issueTitle] || '';
  }
}