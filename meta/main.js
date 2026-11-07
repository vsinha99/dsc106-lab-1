import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let data = [];
let commits = [];
let xScale;
let yScale;
let brush;
let brushLayer;
let isBrushing = false;

export async function loadData() {
  return d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
}

export function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([id, lines]) => {
    const { author, date, time, timezone, datetime } = lines[0];
    const commit = {
      id,
      url: `https://github.com/vsinha99/dsc106-lab-1/commit/${id}`,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    Object.defineProperty(commit, 'lines', { value: lines, enumerable: false });
    return commit;
  });
}

export function renderCommitInfo(data, commits) {
  const fileLengths = d3.rollups(data, (lines) => d3.max(lines, (d) => d.line), (d) => d.file);
  const workByDay = d3.rollup(commits, (group) => group.length, (d) => d.datetime.toLocaleDateString('en', { weekday: 'long' }));
  const largestDayCount = d3.max(workByDay.values());
  const activeDays = [...workByDay].filter(([, count]) => count === largestDayCount).map(([day]) => day);
  const stats = [
    ['Analyzed lines', d3.format(',')(data.length)],
    ['Analyzed commits', d3.format(',')(commits.length)],
    ['Distinct files', d3.group(data, (d) => d.file).size],
    ['Average line length', `${d3.format('.1f')(d3.mean(data, (d) => d.length) ?? 0)} characters`],
    ['Maximum indentation depth', d3.max(data, (d) => d.depth) ?? 0],
    ['Most active weekday (commits)', activeDays.join(', ') || 'No commits'],
    ['Average file length', `${d3.format('.1f')(d3.mean(fileLengths, (d) => d[1]) ?? 0)} lines`],
  ];
  const container = d3.select('#stats');
  container.selectAll('*').remove();
  const list = container.append('dl').attr('class', 'stats');
  for (const [label, value] of stats) {
    const item = list.append('div');
    item.append('dt').text(label);
    item.append('dd').text(value);
  }
}

export function renderTooltipContent(commit) {
  const link = document.querySelector('#commit-link');
  link.href = commit.url;
  link.textContent = commit.id;
  document.querySelector('#commit-date').textContent = commit.datetime.toLocaleDateString('en', { dateStyle: 'long' });
  document.querySelector('#commit-time').textContent = commit.datetime.toLocaleTimeString('en', { timeZoneName: 'short' });
  document.querySelector('#commit-author').textContent = commit.author;
  document.querySelector('#commit-lines').textContent = d3.format(',')(commit.totalLines);
}

export function updateTooltipVisibility(isVisible) {
  document.querySelector('#commit-tooltip').hidden = !isVisible;
}

export function updateTooltipPosition(event) {
  const tooltip = document.querySelector('#commit-tooltip');
  // Keyboard focus has no cursor: position beside the focused circle instead.
  const rect = event.currentTarget.getBoundingClientRect();
  const x = Number.isFinite(event.clientX) ? event.clientX : rect.right;
  const y = Number.isFinite(event.clientY) ? event.clientY : rect.top;
  const gap = 12;
  let left = x + gap;
  let top = y + gap;
  if (left + tooltip.offsetWidth > innerWidth - gap) left = x - tooltip.offsetWidth - gap;
  if (top + tooltip.offsetHeight > innerHeight - gap) top = y - tooltip.offsetHeight - gap;
  tooltip.style.left = `${Math.max(gap, Math.min(left, innerWidth - tooltip.offsetWidth - gap))}px`;
  tooltip.style.top = `${Math.max(gap, Math.min(top, innerHeight - tooltip.offsetHeight - gap))}px`;
}

export function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

export function renderSelectionCount(selection) {
  const selected = commits.filter((commit) => isCommitSelected(selection, commit));
  document.querySelector('#selection-count').textContent = selected.length
    ? `${selected.length} commit${selected.length === 1 ? '' : 's'} selected`
    : 'No commits selected';
  document.querySelector('#clear-selection').disabled = !selection;
  return selected;
}

export function renderLanguageBreakdown(selection) {
  const selected = commits.filter((commit) => isCommitSelected(selection, commit));
  const lines = selected.flatMap((commit) => commit.lines);
  const breakdown = d3.rollup(lines, (group) => group.length, (d) => d.type);
  const list = d3.select('#language-breakdown');
  list.selectAll('*').remove();
  const names = { js: 'JavaScript', html: 'HTML', css: 'CSS', svelte: 'Svelte' };
  for (const [language, count] of [...breakdown].sort((a, b) => b[1] - a[1])) {
    const item = list.append('div');
    item.append('dt').text(names[language] || language);
    item.append('dd').text(`${count} lines (${d3.format('.1~%')(count / lines.length)})`);
  }
}

function brushed(event) {
  isBrushing = event.type !== 'end';
  updateTooltipVisibility(false);
  d3.selectAll('#commit-scatterplot .dots circle').classed('selected', (commit) => isCommitSelected(event.selection, commit));
  renderSelectionCount(event.selection);
  renderLanguageBreakdown(event.selection);
}

export function createBrushSelector(svg, usableArea) {
  brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on('start brush end', brushed);
  brushLayer = svg.append('g').attr('class', 'brush').call(brush);
  // Put circles above the brush overlay so their hover handlers remain reachable.
  svg.select('.dots').raise();
}

function clearSelection() {
  if (brushLayer && brush) brushLayer.call(brush.move, null);
}

export function renderScatterPlot(data, commits) {
  const container = d3.select('#chart');
  container.selectAll('*').remove();
  updateTooltipVisibility(false);
  if (commits.length === 0) {
    container.append('p').text('No analyzed commits are available yet.');
    return;
  }
  const width = Math.max(300, Math.min(1000, container.node().clientWidth));
  const height = width < 600 ? 400 : 520;
  const margin = { top: 40, right: 40, bottom: 60, left: 64 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  const svg = container.append('svg')
    .attr('id', 'commit-scatterplot')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group')
    .attr('aria-label', 'Commit date versus time of day. Circle area represents analyzed lines. Drag to select; focus a circle for details.');

  let [start, end] = d3.extent(commits, (d) => d.datetime);
  if (+start === +end) {
    start = d3.timeDay.offset(start, -1);
    end = d3.timeDay.offset(end, 1);
  }
  // Leave room at both date extremes for the circles, including their hover size.
  const datePadding = Math.max(86400000, (+end - +start) * 48 / (usableArea.width - 96));
  xScale = d3.scaleTime().domain([new Date(+start - datePadding), new Date(+end + datePadding)])
    .nice().range([usableArea.left, usableArea.right]);
  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  // Including zero makes circle area directly proportional to the line count.
  const rScale = d3.scaleSqrt().domain([0, maxLines || minLines || 1]).range([0, 30]);
  const hourTicks = [0, 6, 12, 18, 24];
  svg.append('g').attr('class', 'gridlines').attr('transform', `translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(hourTicks).tickFormat('').tickSize(-usableArea.width));
  svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).ticks(width < 600 ? 3 : 6).tickFormat(d3.timeFormat('%b %d')));
  svg.append('g').attr('class', 'y-axis').attr('transform', `translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickValues(hourTicks).tickFormat((hour) => `${String(hour).padStart(2, '0')}:00`));
  svg.append('text').attr('class', 'axis-label').attr('x', usableArea.left + usableArea.width / 2).attr('y', height - 12).attr('text-anchor', 'middle').text('Commit date');
  svg.append('text').attr('class', 'axis-label').attr('transform', 'rotate(-90)').attr('x', -(usableArea.top + usableArea.height / 2)).attr('y', 14).attr('text-anchor', 'middle').text('Time of day');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const dots = svg.append('g').attr('class', 'dots');
  const showTooltip = (event, commit) => {
    if (isBrushing) return;
    renderTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  };
  dots.selectAll('circle').data(sortedCommits, (d) => d.id).join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('data-commit', (d) => d.id)
    .attr('tabindex', 0)
    .attr('role', 'link')
    .attr('aria-label', (d) => `${d.id}, ${d.datetime.toLocaleString()}, ${d.totalLines} analyzed lines. Enter opens the commit.`)
    .attr('aria-describedby', 'commit-tooltip')
    .on('mouseenter mousemove focus', showTooltip)
    .on('mouseleave blur', () => updateTooltipVisibility(false))
    .on('keydown', (event, commit) => {
      if (event.key === 'Enter') window.open(commit.url, '_blank', 'noopener,noreferrer');
    });
  createBrushSelector(svg, usableArea);
  renderSelectionCount(null);
  renderLanguageBreakdown(null);
}

document.querySelector('#clear-selection').addEventListener('click', clearSelection);
document.querySelector('#chart').addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clearSelection();
    updateTooltipVisibility(false);
  }
});

try {
  data = await loadData();
  commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
  let lastWidth = document.querySelector('#chart').clientWidth;
  new ResizeObserver(([entry]) => {
    if (Math.abs(entry.contentRect.width - lastWidth) < 1) return;
    lastWidth = entry.contentRect.width;
    renderScatterPlot(data, commits);
  }).observe(document.querySelector('#chart'));
} catch (error) {
  console.error('Could not load code analysis:', error);
  document.querySelector('#stats').textContent = 'Code analysis could not be loaded. Refresh to try again.';
}
