import { fetchGitHubData, fetchJSON, renderProjects } from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];
renderProjects(latestProjects, document.querySelector('.projects'), 'h3');

const profileStats = document.querySelector('#profile-stats');
try {
  const githubData = await fetchGitHubData('vsinha99');
  if (profileStats && githubData) {
    const stats = [
      ['Public repositories', githubData.public_repos],
      ['Public gists', githubData.public_gists],
      ['Followers', githubData.followers],
      ['Following', githubData.following],
    ];
    const list = document.createElement('dl');
    for (const [label, value] of stats) {
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = String(value);
      list.append(term, detail);
    }
    profileStats.replaceChildren(list);
  }
} catch (error) {
  console.error('Could not load GitHub profile statistics:', error);
}
