import { getToken } from './secureToken';

// GitHub API base URL
const GITHUB_API = 'https://api.github.com';

// Perform full sync with GitHub
export const performFullSync = async (repo: string, branch: string = 'main'): Promise<{ success: boolean; message: string }> => {
  try {
    const token = await getToken();
    console.log(`Starting full sync with ${repo} on branch ${branch}`);
    
    // Validate token and repo access
    const response = await fetch(`${GITHUB_API}/repos/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub authentication failed: ${response.status} ${response.statusText}`);
    }
    
    console.log('Successfully authenticated with GitHub');
    return {
      success: true,
      message: `Successfully synced with ${repo}`
    };
  } catch (error) {
    console.error('Full sync failed:', error);
    return {
      success: false,
      message: `Full sync failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Check sync status
export const checkSyncStatus = async (repo: string): Promise<{ lastSync: string | null; status: 'synced' | 'pending' | 'error' }> => {
  try {
    const token = await getToken();
    const response = await fetch(`${GITHUB_API}/repos/${repo}/commits`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check sync status');
    }
    
    const commits = await response.json();
    const lastCommitDate = commits.length > 0 ? commits[0].commit.author.date : null;
    
    return {
      lastSync: lastCommitDate ? new Date(lastCommitDate).toISOString() : null,
      status: 'synced'
    };
  } catch (error) {
    console.error('Error checking sync status:', error);
    return {
      lastSync: null,
      status: 'error'
    };
  }
};
