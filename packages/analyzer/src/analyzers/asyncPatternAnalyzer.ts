import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { parse } from '@typescript-eslint/typescript-estree';
import { PerfIssue } from '../types';

export class AsyncPatternAnalyzer {
  analyze(code: string, filename: string): PerfIssue[] {
    const ast = parse(code, {
      loc: true,
      range: true,
      tokens: true,
      comment: true,
      useJSXTextNode: true,
      jsx: true,
    });

    const issues: PerfIssue[] = [];
    
    // Detect Promise.all with map pattern (potential N+1)
    this.findPromiseAllMaps(ast, issues, filename);
    
    return issues;
  }

  private findPromiseAllMaps(ast: any, issues: PerfIssue[], filename: string) {
    const visit = (node: any) => {
      if (
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.object.name === 'Promise' &&
        node.callee.property.name === 'all'
      ) {
        // Check if first argument is a map
        const [arg] = node.arguments;
        if (
          arg?.type === AST_NODE_TYPES.CallExpression &&
          arg.callee.type === AST_NODE_TYPES.MemberExpression &&
          arg.callee.property.name === 'map'
        ) {
          issues.push({
            type: 'warning',
            code: 'PROMISE_ALL_MAP',
            message: 'Potential N+1 query pattern detected with Promise.all and map',
            line: node.loc.start.line,
            column: node.loc.start.column,
            file: filename,
            suggestion: 'Consider using batch fetching instead of multiple parallel requests'
          });
        }
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          visit(node[key]);
        }
      }
    };

    visit(ast);
  }
}

export default AsyncPatternAnalyzer;

