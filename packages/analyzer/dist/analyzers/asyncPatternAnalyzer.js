"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncPatternAnalyzer = void 0;
const types_1 = require("@typescript-eslint/types");
const typescript_estree_1 = require("@typescript-eslint/typescript-estree");
class AsyncPatternAnalyzer {
    analyze(code, filename) {
        const ast = (0, typescript_estree_1.parse)(code, {
            loc: true,
            range: true,
            tokens: true,
            comment: true,
            useJSXTextNode: true,
            jsx: true,
        });
        const issues = [];
        // Detect Promise.all with map pattern (potential N+1)
        this.findPromiseAllMaps(ast, issues, filename);
        return issues;
    }
    findPromiseAllMaps(ast, issues, filename) {
        const visit = (node) => {
            if (node.type === types_1.AST_NODE_TYPES.CallExpression &&
                node.callee.type === types_1.AST_NODE_TYPES.MemberExpression &&
                node.callee.object.name === 'Promise' &&
                node.callee.property.name === 'all') {
                // Check if first argument is a map
                const [arg] = node.arguments;
                if ((arg === null || arg === void 0 ? void 0 : arg.type) === types_1.AST_NODE_TYPES.CallExpression &&
                    arg.callee.type === types_1.AST_NODE_TYPES.MemberExpression &&
                    arg.callee.property.name === 'map') {
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
exports.AsyncPatternAnalyzer = AsyncPatternAnalyzer;
exports.default = AsyncPatternAnalyzer;
//# sourceMappingURL=asyncPatternAnalyzer.js.map