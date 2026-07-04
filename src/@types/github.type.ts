export interface GitHubCommit {
  sha: string;
  message: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  payload?: {
    commits?: GitHubCommit[];
    head?: string;
    ref_type?: string;
    ref?: string;
    action?: string;
    release?: { tag_name: string };
  };
  created_at: string;
  displayMessage?: string;
}
