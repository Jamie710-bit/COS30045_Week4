# Appliance Energy Consumption Website

## 📖 Data Story

### Story title: "The TV Industry's Green Revolution: Who's Leading the Race?"

### Audience
Market analysts, product engineers, and brand/technology managers — people who need to
understand how the display-technology transition has reshaped energy performance across the
industry, and which manufacturers are actually winning on efficiency, not end consumers
comparing two TVs to buy. This audience is comfortable with technical units (W, kWh/year) and
cares about competitive benchmarking and engineering trends more than purchase advice.

**Guidelines followed for the visual storytelling on the Insights page:**
- Keep charts clean and interactive, but do not oversimplify — this audience can read raw
  figures and benchmarks, not just a plain-language takeaway.
- Lead every chart with technology- or brand-level comparison, since that is the unit of
  analysis this audience thinks in (not an individual product purchase).
- Where the dataset cannot answer a question the audience would ask, say so explicitly rather
  than implying full coverage (see Limitations).

### Key questions
1. How do the display technologies (Plasma, LCD, LCD (LED), OLED) compare on energy use, and how has
   average active-mode power draw (`Avg_mode_power`) moved over time (by registration expiry year)?
2. Among the major brands (Samsung, LG, Panasonic, TCL, Kogan, and other high-volume brands in
   the dataset), which one optimises energy consumption best?

### Core message
The move away from Plasma and plain LCD to LCD (LED) delivered a real, measurable efficiency
gain (average star rating 1.87 → 4.39 from Plasma to LCD (LED), and a much lower average CEC).
However, that gain does not show up as lower *absolute* power draw over time: average
active-mode power fell from about 107 W (2015) to about 66 W (2018) but has risen since, to about
147 W in 2026, while the average screen size in the dataset grew from roughly 87 cm (2012) to
154 cm (2026). Bigger screens are absorbing the efficiency gains. The gain is also not shared
evenly across brands: some budget brands still trail the leaders on star rating, so "newer
technology" alone does not guarantee a "greener" product; brand-level engineering still matters.

### How the Insights charts answer this
- **Bar chart** (Star rating / CEC by technology) and **Line chart** (`Avg_mode_power` by
  registration expiry year, 2012–2026) answer **Question 1** — together they show the size of the
  efficiency gain between technologies and how absolute power draw has moved over time.
- **Lollipop chart** (top 8 brands by average star rating) answers **Question 2** directly.
- **Scatter plot** (screen size in cm vs. CEC, coloured by technology) supports the core message
  by showing how strongly energy use grows with screen size, and that models of the same size
  differ widely by technology. Brand is not shown in the scatter (only in the tooltip), so it does
  not by itself separate the effect of brand from technology.
---

## 📊 About the data

### Data source
The dataset is the **Feb '21 Historical Data for Televisions**, sourced from the official
Australian Energy Rating registration database (Equipment Energy Efficiency — E3 Program).

### Data processing & cleaning workflow
The original dataset (9,316 rows, 31 columns) was cleaned and transformed in **KNIME Analytics
Platform**:
1. **Column Filter** — kept the 11 core attributes needed for analysis (`Brand_Reg`, `Model_No`,
   `screensize`, `Screen_Area`, `Screen_Tech`, `Avg_mode_power`, `CEC`, `Star2`,
   `Availability Status`, `ExpDate`, `ExpYear`) and discarded administrative/URL columns.
2. **String Cleaner + String Replacer** — standardised brand names to uppercase and stripped
   leading/trailing spaces (e.g. `Sony` and `SONY` unified to `SONY`), and merged the duplicate
   brand label `SAMSUNG ELECTRONICS` into `SAMSUNG` (1,344 Samsung models in total).
3. **Rule-based Row Filter** — removed obsolete CRT records (13 rows) and invalid rows where
   screen size or power consumption was ≤ 0, producing a cleaned dataset of **9,259 records**.
4. **Date&Time Part Extractor + Math Formula** — extracted `ExpYear` from `ExpDate` and
   corrected 22nd-century formatting anomalies (e.g. `2113` → `2013`) with
   `if(ExpYear > 2050, ExpYear - 100, ExpYear)`.

### From cleaned CSV to the Insights page
The cleaned CSV above is what `insights.html` visualises. Because the dataset is large (9,259
rows), a second, offline pass in **Python** pre-aggregates it into `assets/js/data.js` before
the page ever loads in a browser — see "Insights page (D3.js)" below for what that pass
computes and why.

### Privacy
The dataset consists entirely of public regulatory compliance data for commercial appliance
models. It contains **no personally identifiable information (PII)** or private user data.

### Accuracy and limitations
- **Testing standards:** energy metrics are measured under standard laboratory testing
  procedures (AS/NZS 62087.1:2010). Real-world electricity consumption may vary depending on
  user settings (brightness, HDR usage) and daily viewing hours.
- **Year meaning:** `ExpYear` is the year a model's registration **expires**, not its release
  year. The line chart therefore shows trends by registration expiry year, which is only a proxy
  for when models were launched. 2026 is a partial year (187 models) and some technologies have
  gaps (Plasma has no data for 2020–2021; OLED none for 2016).
- **Units:** `screensize` is the screen diagonal in **centimetres** (e.g. 132 cm ≈ 52"), and
  `Star2` is not capped at 5 (values reach about 12 for some models).
- **Data discrepancy note:** the original dataset contained formatting entry errors in
  registration expiration years (21xx), which were detected and transformed back to a valid
  2012–2026 range during data wrangling. One residual out-of-range year (2032) remained after
  cleaning; the Python aggregation step for the line chart excludes anything outside 2012–2026
  so it cannot distort the trend.

### Ethics
All comparisons between display technologies and commercial brands are made objectively from
registered test data. No brand data has been intentionally omitted, skewed, or misrepresented
to favour specific commercial products. The "top 8 brands" shown on the Insights page are
selected by how many models each brand has in the dataset (a proxy for market presence), not by
how favourably they rank — all eight are shown regardless of whether their efficiency score is
high or low.

---

## Pages
- `index.html` — Home (placeholder content + FAQ accordion)
- `televisions.html` — Televisions (+ Appliance Energy Calculator)
- `about.html` — About Us
- `insights.html` — Insights (the data story: 4 interactive D3.js charts)

## Folder structure
```
/
  index.html
  televisions.html
  about.html
  insights.html
  assets/
    css/style.css
    css/insights.css    (styles specific to the Insights page)
    js/main.js           (footer year, FAQ accordion)
    js/calculator.js     (energy calculator)
    js/data.js            (pre-aggregated data generated from the CSV)
    js/insights.js         (D3 chart logic for the Insights page)
    img/logo.svg
  README.md
```

## Insights page (D3.js)
Built from the cleaned `_Cleaned__Historical_Data_for_Television.csv` (9,259 rows, see "About
the data" above). A Python script groups and averages the raw rows offline into four smaller
structures, written once into `assets/js/data.js` so the page loads fast and D3 v7 (via CDN)
only has to handle scales, rendering and interaction — not statistics:

1. **Bar chart — "Energy Efficiency by Screen Technology."** Average star rating and CEC per
   technology, toggle between the two metrics, hover tooltip with the exact figure.
2. **Scatter plot — "The Big-Screen Trap: Size vs. Power Consumption."** Every model in the
   dataset, screen size against yearly CEC, colour-coded by technology. Zoom & pan, a category
   filter (view one technology at a time or all of them), hover tooltip with model and brand.
3. **Lollipop chart — "Top Brand Energy Efficiency Ranking."** The 8 best-represented brands by
   average star rating, animated re-sort (ascending/descending), click a brand to see its
   top-rated models.
4. **Line chart — "The Energy Race Over Time (2012–2026)."** Average active-mode power by
   registration expiry year, dropdown to switch between the whole industry and a single technology,
   animated draw-in.

## Features
- Top navigation on every page with logo (links to Home), hover effect and active-page highlight
- FAQ accordion (hidden by default, JavaScript toggle)
- External CSS only, colours taken from the logo (plus a technology colour scheme on Insights)
- Footer with current year, name and GenAI acknowledgement
- Energy calculator: daily/monthly/yearly kWh and cost, with input validation and no alerts
- Insights page: four interactive D3.js charts built from real historical TV data

## Run online
The wesite has been deployed through link: cos30045week4.vercel.app
---

## 🤖 Generative AI declaration

Generative AI was used at two different stages of this project, for two different tasks:

**Gemini** was used for Exercise 3 preparation:
- Brainstorming data story angles and the target audience persona.
- Assisting with structured Markdown documentation and early D3.js chart architecture ideas.

**Claude (Anthropic)** was used for building the website and the Insights page:
- Writing the Python script that pre-aggregates the cleaned CSV into `assets/js/data.js`.
- Writing the D3.js chart code in `insights.js` for all four charts, including the zoom/pan,
  filter, sort-animation and tooltip interactions.
- Debugging issues found during testing, e.g. a scatter-plot zoom performance fix (replacing a
  per-point attribute update with a single CSS custom property) and a null-reference bug
  (`svg.style.removeProperty` called on a D3 selection instead of the underlying DOM node).

All generated logic, calculations, and data outputs were independently checked against the
dataset using Python (e.g. verifying the calculator's energy formula by hand: 100 W × 5 h =
0.5 kWh/day).

**What I learned:** 
I have learnt valuable knowledge in using D3 scales map data to pixels, and how to visualize data in a efficient way.