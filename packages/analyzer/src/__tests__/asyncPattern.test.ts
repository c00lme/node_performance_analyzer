import { AsyncPatternAnalyzer } from '../analyzers/asyncPatternAnalyzer';

describe('AsyncPatternAnalyzer', () => {
  it('should detect Promise.all with map pattern', () => {
    const code = `
      async function fetchUsers() {
        const results = await Promise.all(
          users.map(async user => {
            return await fetch(\`/api/users/\${user.id}\`)
          })
        )
        return results
      }
    `;

    const analyzer = new AsyncPatternAnalyzer();
    const issues = analyzer.analyze(code, 'test.ts');
    
    expect(issues.length).toBe(1);
    expect(issues[0].code).toBe('PROMISE_ALL_MAP');
  });
});
