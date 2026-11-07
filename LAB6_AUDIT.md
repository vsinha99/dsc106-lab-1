# Lab 6 implementation, verification, and demo

Audited November 6, 2026 against the complete instructions at https://dsc106.com/labs/lab06/.
Implementation completed and committed for publication at the user's request. No Lab 7 work was performed.

## PASS/FAIL checklist

| Lab requirement | Result | Files and verification |
| --- | --- | --- |
| Step 0: Node/npm and analysis package | PASS | Node v22.20.0, npm 10.9.3, elocuent 0.0.4 installed as the only direct development dependency. `package.json` and `package-lock.json`; `npm ls --depth=0` passes. |
| Step 0: Meta page and navigation | PASS | `meta/index.html`, `meta/main.js`, and the added Meta entry in `global.js`. Browser navigation reaches Meta from every existing page, with one current link. |
| Step 0: Actual CSV and indentation | PASS | Ran `npx elocuent -d . -o meta/loc.csv --spaces 2` at the website repository root. Existing source uses two-space indentation. CSV contains 1,194 rows from actual source and Git history. |
| Step 0: Ignore dependencies, retain CSV | PASS | New `.gitignore` excludes `node_modules/`; no prior ignore file existed. `git check-ignore` confirms dependencies are ignored and `meta/loc.csv` is not. The generated CSV is tracked and included in the deployment commits. |
| Step 1: CSV conversion | PASS | `loadData()` uses `d3.csv('loc.csv', rowConverter)` and converts line/depth/length to numbers and date/datetime to valid Date objects. Browser verifies every row's types. |
| Step 1: Commit objects | PASS | `processCommits()` uses `d3.groups()`. Objects include id, actual repository URL, author, date/time/timezone, datetime, hourFrac, totalLines, and a non-enumerable `lines` property. Verified row totals and Git hashes against local history. |
| Step 1: Summary statistics | PASS | `renderCommitInfo()` renders seven statistics in a semantic definition list using D3 and CSS Grid. Independent Python CSV calculation confirms the numerical results below. Weekday is based on number of analyzed commits. |
| Step 2: Quantitative scatterplot | PASS | `renderScatterPlot()` uses a responsive SVG viewBox, margins and `usableArea`, `scaleTime`, `extent`, `nice`, a 0–24 linear hour scale, bottom/left axes, hour labels, and horizontal axis grid lines. One circle per analyzed commit. |
| Step 3: Tooltip | PASS | All three required tooltip functions are in `meta/main.js`; `meta/index.html` contains the requested hidden `<dl>`. Actual pointer hover updates commit link, date, time, author, and line count. Mouse movement repositions it; leaving hides it. Verified viewport bounds in desktop and mobile light/dark modes. |
| Step 3: Hover/accessibility | PASS | Scoped hover transitions enlarge circles and raise fill opacity from .7 to 1. Focusable circles show the same details and Enter opens the real commit URL. Focus styling, Escape dismissal, reduced-motion handling, and pointer-transparent tooltip avoid obscuring other targets. |
| Step 4: Area sizing and overlap | PASS | `d3.scaleSqrt()` maps line counts to radii; rendering order is descending totalLines. Browser checks confirm radius squared divided by line count is constant. Smaller points remain above larger ones. |
| Step 5: Brush | PASS | `createBrushSelector()` uses `d3.brush()` with `start brush end` events and explicit plot bounds. Shared scales support `isCommitSelected()`. Real mouse dragging and phone touch dragging select the expected six-commit cluster. |
| Step 5: Brush and hover together | PASS | `.dots` is raised above the brush layer. Verified tooltips still work inside an active selection. |
| Step 5: Selection count and language breakdown | PASS | `renderSelectionCount()` and `renderLanguageBreakdown()` update after brushing. Hidden line objects are combined with `flatMap()` and grouped with `d3.rollup()`. Percentages use `.1~%`. Clear selection and Escape reset the rectangle, selected classes, count, and breakdown. |
| Previous labs | PASS | Regression tests cover all five pages, themes/persistence, project previews, live GitHub statistics, resume, encoded mailto form, pie chart/legend/search, and both orders of the Lab 5 combined filters. |
| Responsive layouts | PASS | All five pages tested at 1440, 768, and 375px in both themes. Meta additionally tested at 320px, including duplicate-chart and element-bound checks. Screenshots inspected. |
| GitHub Pages folder paths | PASS | Browser tests at `http://pages.localhost:8765/dsc106-lab-1/meta/` loaded Meta modules, CSV, CSS, and navigation correctly. Navigating to Projects and combining its filters also passed. These paths were verified with a local simulation of the deployed folder. |
| Errors and duplicate elements | PASS | No relevant browser console errors in successful Meta/regression runs. Repeated rendering creates one SVG, one brush, and ten circles after the data refresh. Empty and single-commit histories were tested without fabricated history. Syntax and whitespace checks pass. |

## Snapshot scope and verified values

The CSV was refreshed after committing the Lab 6 source at `8bd48581b37a1d16f752375ca95356e207f9b63e`. It now includes the Meta page, its JavaScript, and the committed navigation/CSS changes. Every row resolves to a real Git commit; there are no uncommitted `00000000` entries. The full original implementation tests used the earlier Lab 5 snapshot; a follow-up browser check verified the refreshed totals, ten plotted commits, brush selection and language counts, the new commit tooltip, responsive rendering, and absence of relevant console errors.

The analyzer looks at supported source file types and their surviving lines. Its terminal message counts 139 candidate files, including dependency paths for which Git blame emits no rows; the CSV itself contains ten website source files. The page calculates its file count from CSV rows, not that candidate count. JSON, Markdown, images, and dependency code are not counted as website code in this CSV.

| Statistic | Verified value |
| --- | --- |
| Analyzed current lines, including blank lines | 1,194 |
| Analyzed commits | 10 |
| Distinct source files | 10 |
| Average analyzed line length | 43.2 characters |
| Maximum indentation depth | 6 |
| Most active weekday by analyzed commit count | Friday |
| Average analyzed file length | 119.4 lines |

Brushing the October 23 cluster selects six commits and 299 analyzed lines: JavaScript 187 (62.5%), CSS 84 (28.1%), and HTML 28 (9.4%). These are independently checked against the original line objects, not hardcoded into the website.

## Small implementation choices

- Circle sizes use a zero baseline with a maximum radius of 30. This makes circle **areas** exactly proportional to line counts; the smallest real commits contain one line and have a radius of about 1.63. Keyboard focus provides an alternative to hitting these tiny, overlapping points.
- The date domain includes padding so large edge points do not cover date-axis or time-axis labels. Their positions still come directly from the quantitative scales.
- The final y-axis label is `24:00`, marking the end of the day rather than repeating `00:00` at both ends.
- Times are displayed in the browser's local timezone, as in the lab's `datetime.getHours()` approach. Original CSV time/timezone fields are preserved in each commit object.
- A resize rebuilds the chart and resets the selection, keeping pixel-based brush coordinates consistent with the new scales.

## Local preview and data refresh

From the `personal website` folder:

```sh
python3 -m http.server 8765
```

Open `http://localhost:8765/meta/`. Use an HTTP server, not `file://`.

After future source changes are committed, refresh the snapshot to include those commits:

```sh
npm run analyze
```

This runs the lab's `elocuent -d . -o meta/loc.csv --spaces 2` command. Include the updated CSV in a subsequent commit so Pages can serve it. Running the analysis with uncommitted edits may produce a `00000000` blame entry; generate the published snapshot after committing the source.

## 45–55 second narrated MP4 plan

Use a desktop browser and scroll to “Commits by time of day” before starting. Rehearse the approximately 110-word script and keep the exported MP4 under one minute.

1. **0–14 seconds:** Point to the date axis, hour axis, and the differently sized dots.
2. **14–25 seconds:** Hover the isolated October 30 dot on the right. Let the tooltip show the author, time, and 167 represented lines.
3. **25–38 seconds:** Start on empty plot space just above/left of the October 23 afternoon cluster. Drag down/right to enclose the cluster. The six selected dots change color.
4. **38–45 seconds:** Point to “6 commits selected.” Scroll slightly down to show the JavaScript/CSS/HTML counts and percentages; click Clear selection.
5. **45–55 seconds:** Explain the drawing-order insight while keeping the chart visible.

> This Meta page plots my website's analyzed commits. The horizontal axis shows commit dates, and the vertical axis shows the time of day in my browser's timezone. Circle area represents the current lines attributed to each commit, using a square-root radius scale. When I hover over a dot, the tooltip shows the commit, author, timestamp, and line count. Now I'll drag a rectangle around this cluster. The highlighted dots are selected, and the count and language percentages update below. Clearing the brush resets both. The most interesting thing I learned was that drawing order affects interaction: raising dots above the brush overlay keeps tooltips working.

## Remaining submission actions

Record/submit the required MP4 with the repository and website links. The source and refreshed CSV are included in the authorized publication commits. No implementation requirement remains failed or blocked after testing. D3 loads from the required external CDN and needs internet access.
