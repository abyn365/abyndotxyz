import { NextApiRequest, NextApiResponse } from 'next';
import { projects as fallbackProjects } from '../../data/projects';

interface RepoData {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  github: string;
  tech: string[];
}

let cache: { data: RepoData[]; timestamp: number } | null = null;
const CACHE_TTL = 300 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check cache
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL) {
    return res.status(200).json({ projects: cache.data });
  }

  const username = 'abyn365';

  try {
    // 1. Scrape pinned repos from GitHub Profile HTML
    let pinnedNames: string[] = [];
    try {
      const profileResponse = await fetch(`https://github.com/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (profileResponse.ok) {
        const html = await profileResponse.text();
        const containerMatch = html.match(/class="[^"]*js-pinned-items-reorder-list[^"]*"([\s\S]*?)<\/ol>/);
        if (containerMatch) {
          const containerHtml = containerMatch[1];
          const hrefRegex = new RegExp(`href="\\/${username}\\/([a-zA-Z0-9_.-]+)"`, 'g');
          let match;
          while ((match = hrefRegex.exec(containerHtml)) !== null) {
            const name = match[1];
            if (!pinnedNames.includes(name) && name !== 'stargazers' && name !== 'forks') {
              pinnedNames.push(name);
            }
          }
        }
      }
    } catch (scrapeError) {
      console.error('Error scraping pinned repos:', scrapeError);
    }

    // 2. Fetch all public repos from official GitHub API
    let apiRepos: any[] = [];
    try {
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
        headers: {
          'User-Agent': 'bio-with-spotify-app'
        }
      });
      if (reposResponse.ok) {
        apiRepos = await reposResponse.json();
      } else {
        console.warn(`GitHub API returned status ${reposResponse.status}`);
      }
    } catch (apiError) {
      console.error('Error fetching public repos from GitHub API:', apiError);
    }

    // Map of name -> repo object for fast lookup
    const repoMap = new Map<string, any>();
    apiRepos.forEach(repo => {
      repoMap.set(repo.name.toLowerCase(), repo);
    });

    const finalProjects: RepoData[] = [];

    // First: Pinned projects in order
    pinnedNames.forEach(pinnedName => {
      const repo = repoMap.get(pinnedName.toLowerCase());
      if (repo) {
        finalProjects.push({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          github: repo.html_url,
          tech: repo.language ? [repo.language] : []
        });
        // Remove from pool of available repos to avoid duplication
        repoMap.delete(pinnedName.toLowerCase());
      }
    });

    // Sort remaining repos by stars (Popular)
    const remainingRepos = Array.from(repoMap.values()).sort((a, b) => b.stargazers_count - a.stargazers_count);

    // Second: Fill up with popular repos
    remainingRepos.forEach(repo => {
      if (finalProjects.length < 4) {
        finalProjects.push({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          github: repo.html_url,
          tech: repo.language ? [repo.language] : []
        });
        repoMap.delete(repo.name.toLowerCase());
      }
    });

    // Third: If still less than 4, append other repos (default to whatever's left)
    if (finalProjects.length < 4) {
      const leftovers = Array.from(repoMap.values());
      for (const repo of leftovers) {
        if (finalProjects.length >= 4) break;
        finalProjects.push({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          github: repo.html_url,
          tech: repo.language ? [repo.language] : []
        });
      }
    }

    // Fourth: If even that's not enough (or GitHub API/scrape failed completely), use our fallback static list
    if (finalProjects.length === 0) {
      const fallbackList = fallbackProjects.slice(0, 4).map(p => ({
        name: p.name,
        description: p.description,
        language: p.tech[0] || null,
        stars: 0,
        forks: 0,
        github: p.github || 'https://github.com/abyn365',
        tech: p.tech
      }));
      return res.status(200).json({ projects: fallbackList });
    }

    // Limit to exactly 4 projects
    const limitedProjects = finalProjects.slice(0, 4);

    // Save to cache
    cache = {
      data: limitedProjects,
      timestamp: now
    };

    return res.status(200).json({ projects: limitedProjects });

  } catch (error) {
    console.error('Fatal error in github-projects API:', error);
    // Return fallback projects
    const fallbackList = fallbackProjects.slice(0, 4).map(p => ({
      name: p.name,
      description: p.description,
      language: p.tech[0] || null,
      stars: 0,
      forks: 0,
      github: p.github || 'https://github.com/abyn365',
      tech: p.tech
    }));
    return res.status(200).json({ projects: fallbackList });
  }
}
