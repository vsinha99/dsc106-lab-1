import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h3');

const countHeading = document.querySelector('.projects-title');
if (countHeading && Array.isArray(projects)) {
  countHeading.textContent = `Projects (${projects.length})`;
}
