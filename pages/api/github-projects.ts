import type { NextApiRequest, NextApiResponse } from 'next';

type GithubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
};

type RepoLanguage = {
  name: string;
  percentage: number;
};

type RepoResponse = {
  name: string;
  description: string;
  github: string;
  homepage?: string | null;
  tech: string[];
  languages?: RepoLanguage[];
  stars: number;
  popular: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ repos?: RepoResponse[]; error?: string }>
) {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      'https://api.github.com/users/abyn365/repos?per_page=100&sort=updated&direction=desc',
      { headers }
    );

    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).json({ error: message || 'Failed to fetch GitHub repos' });
    }

    const repositories: GithubRepo[] = await response.json();
    
    // Helper function to fetch languages for a repo
    const fetchLanguages = async (owner: string, repo: string): Promise<RepoLanguage[]> => {
      try {
        const langResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/languages`,
          { headers }
        );
        if (!langResponse.ok) return [];
        
        const languages: Record<string, number> = await langResponse.json();
        const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
        
        return Object.entries(languages)
          .map(([lang, count]) => ({
            name: lang,
            percentage: parseFloat(((count / total) * 100).toFixed(1)),
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5); // Top 5 languages
      } catch (error) {
        return [];
      }
    };

    const repos = await Promise.all(
      repositories
        .filter((repo) => !repo.fork)
        .map(async (repo) => {
          const languages = await fetchLanguages('abyn365', repo.name);
          return {
            name: repo.name,
            description: repo.description || '',
            github: repo.html_url,
            homepage: repo.homepage,
            tech: repo.language ? [repo.language] : ['GitHub'],
            languages,
            stars: repo.stargazers_count,
            popular: repo.stargazers_count >= 12,
          };
        })
    );

    const sortedRepos = repos.sort((a, b) => b.stars - a.stars);

    return res.status(200).json({ repos: sortedRepos });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch GitHub repositories' });
  }
}
