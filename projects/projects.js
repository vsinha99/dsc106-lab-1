import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const data = await fetchJSON('../lib/projects.json');
const projects = Array.isArray(data) ? data : [];
const projectsContainer = document.querySelector('.projects');
const countHeading = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
const summary = document.querySelector('#filter-summary');
const clearYear = document.querySelector('.clear-year');

// Both controls update this shared state, then call updateView().
let query = '';
let selectedYear = null;

// Fix the color domain once, so a year keeps its color after filtering.
const years = [...new Set(projects.map((project) => project.year))].sort(d3.descending);
const colors = d3.scaleOrdinal().domain(years).range(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value((d) => d.value).sort(null);

function selectYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updateView();
}

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(projectsGiven, (v) => v.length, (d) => d.year);
  const chartData = rolledData
    .map(([year, count]) => ({ label: year, value: count }))
    .sort((a, b) => d3.descending(a.label, b.label));
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  svg.selectAll('path').remove();
  legend.selectAll('*').remove();
  svg.attr('hidden', projectsGiven.length === 0 ? true : null);
  document.querySelector('.chart-empty').hidden = projectsGiven.length > 0;

  svg.selectAll('path')
    .data(sliceGenerator(chartData))
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d) => colors(d.data.label))
    .attr('class', (d) => d.data.label === selectedYear ? 'selected' : null)
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('data-year', (d) => d.data.label)
    .attr('aria-label', (d) => `${d.data.label}: ${d.data.value} projects. Toggle year filter.`)
    .attr('aria-pressed', (d) => String(d.data.label === selectedYear))
    .on('click', (event, d) => selectYear(d.data.label))
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectYear(d.data.label);
      }
    })
    .append('title')
    .text((d) => `${d.data.label}: ${d.data.value} projects`);

  // A selected year with no search matches stays available in the legend.
  // Its count is zero, so it does not add a wedge or change the chart total.
  const legendData = [...chartData];
  if (selectedYear !== null && !legendData.some((d) => d.label === selectedYear)) {
    legendData.push({ label: selectedYear, value: 0 });
    legendData.sort((a, b) => d3.descending(a.label, b.label));
  }
  const items = legend.selectAll('li')
    .data(legendData)
    .join('li')
    .attr('class', (d) => `legend-item${d.label === selectedYear ? ' selected' : ''}`)
    .style('--color', (d) => colors(d.label));
  const buttons = items.append('button')
    .attr('type', 'button')
    .attr('data-year', (d) => d.label)
    .attr('aria-label', (d) => `${d.label}: ${d.value} projects. Toggle year filter.`)
    .attr('aria-pressed', (d) => String(d.label === selectedYear))
    .on('click', (event, d) => selectYear(d.label));
  buttons.append('span').attr('class', 'swatch').attr('aria-hidden', 'true');
  buttons.append('span').text((d) => `${d.label} (${d.value})`);
}

function updateView() {
  // Preserve keyboard focus when rebuilding the chart and legend.
  const focused = document.activeElement;
  const focusYear = focused?.dataset.year;
  const focusType = focused?.tagName.toLowerCase();

  const searchMatches = projects.filter((project) =>
    Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase()),
  );
  const visibleProjects = searchMatches.filter((project) =>
    selectedYear === null || project.year === selectedYear,
  );

  renderProjects(visibleProjects, projectsContainer, 'h3');
  // Keep all search-matching years available for switching or deselecting.
  renderPieChart(searchMatches);
  countHeading.textContent = `Projects (${visibleProjects.length})`;
  const yearMessage = selectedYear === null ? 'All years' : `Year: ${selectedYear}`;
  summary.textContent = `${visibleProjects.length} of ${projects.length} projects shown. ${yearMessage}. Chart: ${searchMatches.length} search matches.`;
  clearYear.disabled = selectedYear === null;
  if (visibleProjects.length === 0) {
    projectsContainer.querySelector('.empty-state').textContent = 'No projects match these filters. Try another search or clear the year filter.';
  }
  if (focusYear) {
    document.querySelector(`${focusType}[data-year="${focusYear}"]`)?.focus({ preventScroll: true });
  }
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updateView();
});
clearYear.addEventListener('click', () => {
  selectedYear = null;
  updateView();
});

updateView();
if (!Array.isArray(data)) {
  summary.textContent = 'Project data could not be loaded. Please refresh to try again.';
  searchInput.disabled = true;
}
