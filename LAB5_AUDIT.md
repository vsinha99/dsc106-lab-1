# Lab 5 audit and recording notes

Checked on October 30, 2026 against https://dsc106.com/labs/lab05/.
Implementation and browser tests are complete, including the combined-filter extra-credit feature.
Changes are local; no commit, push, or Lab 6 work was performed.

## Requirement checklist

| Requirement | Result | Implementation and verification |
| --- | --- | --- |
| Existing project data and years | PASS | `lib/projects.json` is unchanged: 15 entries, numeric years, three real projects and twelve placeholders. `global.js` already renders each year in `<time>`, so it is unchanged. Browser cards match JSON titles and years. |
| SVG coordinate system | PASS | `projects/index.html`: `#projects-pie-plot`, `viewBox="-50 -50 100 100"`. |
| D3 7.9.0 module | PASS | `projects/projects.js`: exact jsDelivr module import. Browser network response verified. |
| D3 geometry and path marks | PASS | `d3.arc().innerRadius(0).outerRadius(50)`, `d3.pie()`, dynamically bound SVG paths. No dummy data remains. |
| Categorical colors | PASS | `d3.scaleOrdinal()` with `d3.schemeTableau10` and a fixed year domain; tested that filtering preserves each year's base color. |
| Actual-data aggregation | PASS | `renderPieChart()` uses `d3.rollups()` and `{label, value}` objects. Browser checks verify counts, angles, and total. |
| Dynamic legend | PASS | D3 builds `.legend` list items with swatches, years, counts, and `--color`; values match wedges. |
| Responsive layout | PASS | `style.css`: `.project-chart` Flexbox with wrapping, `.legend` Grid, `.legend-item` Flexbox. Desktop chart/legend sit side by side and phone layout stacks. Existing project Grid/subgrid retained. |
| Search | PASS | `.searchBar` uses an `input` listener and `Object.values().join().toLowerCase()` with `.filter()`. Title, description, year, and image-path searches tested; case-insensitivity verified. |
| Reactive chart | PASS | `renderPieChart(projectsGiven)` rebuilds paths and legend after clearing them. Repeated searches produce no duplicate wedges, legend items, or cards. |
| Hover | PASS | Scoped `#projects-pie-plot:has(path:hover)` dims other paths to 0.5 over 300ms. Verified using real browser pointer movement and computed opacity. |
| Selection/deselection | PASS | `selectYear()` uses a stable year instead of an index. Wedge/legend clicks select, deselect, and switch years. Selected path and swatch share a distinct magenta highlight. |
| Accessibility | PASS | Tab-focusable SVG buttons with labels and pressed states, Enter/Space support, native legend buttons, visible focus, focus retained after rebuilding, and a live result count. Browser keyboard activation and focus styles verified. |
| Combined filters: 10% extra-credit implementation | PASS | Shared `query` and `selectedYear`; `updateView()` applies both predicates. All scenarios A–E tested in an actual browser. |
| Zero matches | PASS | Empty chart/list messages, zero wedges, and recovery on clearing the query. A selected year with no search matches remains a clickable zero-count legend entry, allowing deselection without a phantom wedge. |
| Previous labs | PASS | All four pages tested; one current nav link per page; homepage still has first three projects; live GitHub statistics match the API; theme refresh/navigation persistence and automatic OS light/dark behavior verified. Contact form markup/handler and resume content are unchanged. |
| GitHub Pages paths | PASS | Browser test host `http://pages.localhost:8766/dsc106-lab-1/` exercises the deployed-folder branch of URL handling. Modules, JSON, all internal nav paths, and images load; combined filtering also passes there. This is a local deployment simulation, not a published Lab 5 site. |
| Browser errors and syntax | PASS | No relevant console errors in successful test runs. `node --check projects/projects.js` and `git diff --check` pass. |

## Verified data and layouts

- Initial counts: 2026 = 3, 2025 = 3, 2024 = 3, 2023 = 2, 2022 = 2, 2021 = 2; total = 15, six slices.
- Projects chart tested at 1440, 768, 375, and 320 pixels in both themes. All four pages additionally tested at 1440, 768, and 375 pixels in both themes.
- Checked actual element bounds, not only scroll width, to catch clipped content despite the site's existing overflow rules.
- Inspected screenshots of light/dark desktop, tablet, and phone charts, plus selected and empty states.
- Found an existing theme-selector overlap that obscured the GitHub nav link. Added space in `.header-inner` and adjusted its narrow-screen placement; browser hit tests now reach every navigation link.

## Extra credit: why the bug occurred and what changed

The lab's separate event handlers each render their own filtered list from the full dataset. A year click forgets the query; a search forgets the year. The last handler wins.

In `projects/projects.js`:

- Lines 13–14 hold `query` and `selectedYear` as shared state.
- `selectYear()` at line 22 toggles a year and calls `updateView()`.
- `updateView()` at line 82 computes `searchMatches` at line 88 and then `visibleProjects` at line 91. These are the search/year intersection.
- Lines 95–97 render cards from `visibleProjects` and the chart from `searchMatches`. This keeps the other matching years available for switching/deselection.
- The search and clear-year handlers at lines 110–117 update only their own state, then call the same coordinator.
- Lines 60–66 keep a selected zero-result year in the legend so it can always be deselected.

Interaction checks:

| Scenario | Browser action | Verified outcome |
| --- | --- | --- |
| A | Search `project 0`, then select 2025 | Six search matches become three cards; chart still represents all six search matches. |
| B | Select 2025, then search `project 04` | Only Project 04 remains. |
| C | Search `project 0`, select 2025, then select it again | Six search matches return; query remains. |
| D | Select 2025 and search `project 04`, then clear query | Three 2025 cards remain; year stays selected. |
| E | Search a nonexistent term, then clear it | No crash or wedges for zero matches; normal chart returns. Also verified this while retaining a selected year. |

## Recording plan and narration

Aim for 50–55 seconds. Narration is about 115 words; rehearse once and keep the recording below one minute.

1. Show the full chart and legend; briefly hover a wedge.
2. Type `project 0` (six results), then click 2024 (Project 06 and Project 07).
3. Deselect 2024 (six results), select it again, then clear the query (three 2024 results).
4. Switch to `projects/projects.js` and point to `updateView()`, especially lines 88–97.

> My projects page uses D3 to count projects by year and draw these pie slices. The legend shows each year's count, and hovering fades the other slices. I'll search for “project zero,” then select 2024. Now the list shows only projects matching both filters. Deselecting the year keeps my search; clearing the search keeps my year selection. The original bug happened because separate handlers each replaced the list using only their own filter. I fixed it with shared query and selected-year state, plus one updateView function. The chart uses search matches, while cards also apply the year filter. I learned that D3 separates data aggregation from the SVG geometry used to draw it.

## Remaining submission tasks

Review locally, authorize a commit/push when ready, and record/submit the required video with the repository and website links. No implementation failures remain from the checks above. D3 still loads from the required external CDN, so the project explorer needs internet access.
