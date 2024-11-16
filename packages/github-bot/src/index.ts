import { Octokit } from '@octokit/rest';
import { AsyncPatternAnalyzer } from '@node-perf-analyzer/analyzer';  // Fixed package name
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function processPullRequest(owner: string, repo: string, pullNumber: number) {
  // Get PR diff
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber
  });

  const analyzer = new AsyncPatternAnalyzer();
  
  for (const file of files) {
    if (!file.filename.endsWith('.ts') && !file.filename.endsWith('.tsx')) {
      continue;
    }

    // Get file content
    const { data: content } = await octokit.repos.getContent({
      owner,
      repo,
      path: file.filename,
      ref: file.sha
    });

    if (typeof content === 'object' && 'content' in content) {
      const decoded = Buffer.from(content.content, 'base64').toString();
      const issues = analyzer.analyze(decoded, file.filename);

      // Post comments for each issue
      for (const issue of issues) {
        await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: pullNumber,
          commit_id: file.sha,
          path: file.filename,
          line: issue.line,
          body: `🔍 Performance Issue Detected: ${issue.message}\n\nSuggestion: ${issue.suggestion}`
        });
      }
    }
  }
}