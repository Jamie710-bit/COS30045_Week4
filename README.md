# Appliance Energy Consumption Website

COS30045 Data Visualisation - Exercise 0.2

A small three-page website built with HTML, CSS and vanilla JavaScript.

## Pages
- `index.html` - Home (placeholder content + FAQ accordion)
- `televisions.html` - Televisions (+ Appliance Energy Calculator)
- `about.html` - About Us
- `insights.html` - Insights (4 interactive D3.js charts built from the cleaned TV dataset)

## Folder structure
```
/
  index.html
  televisions.html
  about.html
  insights.html
  assets/
    css/style.css
    css/insights.css   (styles specific to the Insights page)
    js/main.js          (footer year, FAQ accordion)
    js/calculator.js    (energy calculator)
    js/data.js           (pre-aggregated data generated from the CSV)
    js/insights.js        (D3 chart logic for the Insights page)
    img/logo.svg
  README.md
```

## Insights page (D3.js)
Built from `_Cleaned_Historical_Data_for_Television.csv` (9,259 rows). Aggregates were
pre-computed offline into `assets/js/data.js` so the page loads fast; D3 v7 (via CDN) renders
the charts client-side.

1. **Bar chart** - average star rating / CEC by screen technology, toggle between metrics, hover tooltip.
2. **Scatter plot** - screen size vs. yearly CEC for every model, colour-coded by technology, zoom & pan, hover tooltip with model/brand.
3. **Lollipop chart** - top 8 best-selling brands by average star rating, animated re-sort, click a brand to see its top-rated models.
4. **Line chart** - average active-mode power by release year (2012-2026), dropdown to switch between the whole industry and a single technology, animated draw-in.

## Features
- Top navigation on every page with logo (links to Home), hover effect and active-page highlight
- FAQ accordion (hidden by default, JavaScript toggle)
- External CSS only, colours taken from the logo
- Footer with current year, name and GenAI acknowledgement
- Energy calculator: daily/monthly/yearly kWh and cost, with input validation and no alerts

## Run locally
Open the folder in VS Code and use the Live Server extension (or open `index.html` directly).

## Generative AI Reflection
**Tools used:** Claude (Anthropic).

**What I used it for:** Generating the initial project structure, HTML/CSS layout, the accordion and the calculator logic.

**What I changed or adapted:** _(Fill in: e.g. changed colours/text, adjusted validation, replaced the placeholder logo with the official one, tested in browser.)_

**What I learned:** _(Fill in: e.g. DOM events, aria-expanded for accessibility, form validation.)_

**Limitations or issues:** _(Fill in: e.g. AI made up example TV wattages; I had to check calculations by hand: 100 W x 5 h = 0.5 kWh/day.)_
