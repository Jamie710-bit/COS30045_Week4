// Insights page — four D3 charts driven by TV_DATA (assets/js/data.js)

const TECH_COLOR = {
  "LCD": "#9C8B6F",
  "LCD (LED)": "#3FA34D",
  "OLED": "#2D6CDF",
  "Plasma": "#D64545"
};

const tooltip = document.getElementById("tooltip");

function showTooltip(event, html) {
  tooltip.innerHTML = html;
  tooltip.hidden = false;
  moveTooltip(event);
}
function moveTooltip(event) {
  const pad = 14;
  let x = event.clientX + pad;
  let y = event.clientY + pad;
  const tw = tooltip.offsetWidth || 180;
  const th = tooltip.offsetHeight || 40;
  if (x + tw > window.innerWidth) x = event.clientX - tw - pad;
  if (y + th > window.innerHeight) y = event.clientY - th - pad;
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
}
function hideTooltip() { tooltip.hidden = true; }

// Debounced resize redraw
function onResize(fn) {
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(fn, 150);
  });
}

/* =========================================================
   1. BAR CHART — avg Star rating vs avg CEC by technology
   ========================================================= */
(function barChart() {
  const svgEl = document.getElementById("chart-bar");
  const data = TV_DATA.techStats; // [{tech, avgStar, avgCEC, count}]
  let metric = "avgStar";

  const METRIC_LABEL = {
    avgStar: "Average star rating",
    avgCEC: "Average CEC (kWh / year)"
  };

  function render() {
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const width = svgEl.parentElement.clientWidth;
    const height = 360;
    const margin = { top: 24, right: 20, bottom: 50, left: 56 };
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.tech))
      .range([0, innerW])
      .padding(0.35);

    const maxVal = d3.max(data, d => d[metric]);
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([innerH, 0]);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5));

    const bars = g.selectAll(".bar")
      .data(data, d => d.tech);

    bars.join(
      enter => enter.append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.tech))
        .attr("width", x.bandwidth())
        .attr("y", innerH)
        .attr("height", 0)
        .attr("fill", d => TECH_COLOR[d.tech])
        .call(enter => enter.transition().duration(500)
          .attr("y", d => y(d[metric]))
          .attr("height", d => innerH - y(d[metric]))),
      update => update.call(update => update.transition().duration(500)
        .attr("y", d => y(d[metric]))
        .attr("height", d => innerH - y(d[metric])))
    )
      .on("mousemove", (event, d) => {
        showTooltip(event, `<strong>${d.tech}</strong><br>Star rating: ${d.avgStar.toFixed(2)} / 5<br>CEC: ${d.avgCEC.toFixed(0)} kWh/year<br>${d.count} models`);
        moveTooltip(event);
      })
      .on("mouseleave", hideTooltip);

    g.selectAll(".bar-value-label")
      .data(data, d => d.tech)
      .join("text")
      .attr("class", "bar-value-label")
      .attr("text-anchor", "middle")
      .attr("x", d => x(d.tech) + x.bandwidth() / 2)
      .attr("y", d => y(d[metric]) - 8)
      .text(d => metric === "avgStar" ? d.avgStar.toFixed(2) : Math.round(d.avgCEC));

    svg.append("text")
      .attr("x", -innerH / 2 - margin.top)
      .attr("y", 16)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("class", "bar-value-label")
      .text(METRIC_LABEL[metric]);
  }

  document.querySelectorAll("#section-bar .chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#section-bar .chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      metric = btn.dataset.metric;
      render();
    });
  });

  render();
  onResize(render);
})();

/* =========================================================
   2. SCATTER PLOT — screen size vs CEC, colored by technology, zoom/pan
   ========================================================= */
(function scatterChart() {
  const svgEl = document.getElementById("chart-scatter");
  const allData = TV_DATA.scatter; // [{s, c, t, m, b}] — full dataset, 9,259 points
  const legendEl = document.getElementById("scatter-legend");
  const select = document.getElementById("scatter-tech-select");
  const countEl = document.getElementById("scatter-count");

  // Legend (static, built once)
  legendEl.innerHTML = Object.entries(TECH_COLOR).map(([tech, color]) =>
    `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${tech}</span>`
  ).join("");

  // Axis domains come from the FULL dataset so the scale stays consistent
  // when switching categories — only the points drawn change, not the ruler.
  const xMax = d3.max(allData, d => d.s) * 1.03;
  const yMax = d3.max(allData, d => d.c) * 1.05;

  const height = 440;
  const margin = { top: 16, right: 20, bottom: 46, left: 60 };
  let zoomTransform = d3.zoomIdentity;
  let xBase, yBase, gDots;

  function currentData() {
    const tech = select.value;
    return tech === "All" ? allData : allData.filter(d => d.t === tech);
  }

  function render() {
    const data = currentData();
    countEl.textContent = `${data.length.toLocaleString()} models shown`;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svgEl.style.removeProperty("--zoom-k");

    const width = svgEl.parentElement.clientWidth;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const clipId = "scatter-clip";
    svg.append("clipPath").attr("id", clipId)
      .append("rect").attr("width", innerW).attr("height", innerH);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    xBase = d3.scaleLinear().domain([0, xMax]).range([0, innerW]);
    yBase = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    const gGrid = g.append("g").attr("class", "grid");
    const gx = g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`);
    const gy = g.append("g").attr("class", "axis");

    function drawAxes(xs, ys) {
      gGrid.call(d3.axisLeft(ys).ticks(6).tickSize(-innerW).tickFormat(""));
      gx.call(d3.axisBottom(xs).ticks(8));
      gy.call(d3.axisLeft(ys).ticks(6));
    }
    drawAxes(xBase, yBase);

    svg.append("text")
      .attr("class", "axis")
      .attr("text-anchor", "middle")
      .attr("x", margin.left + innerW / 2)
      .attr("y", height - 6)
      .style("font-size", "0.82rem")
      .text("Screen size (inches)");

    svg.append("text")
      .attr("class", "axis")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -(margin.top + innerH / 2))
      .attr("y", 14)
      .style("font-size", "0.82rem")
      .text("Yearly energy consumption (kWh)");

    const dotsContainer = g.append("g").attr("clip-path", `url(#${clipId})`);
    gDots = dotsContainer.append("g");

    gDots.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("class", "scatter-dot") // radius comes from CSS (insights.css), not set here
      .attr("cx", d => xBase(d.s))
      .attr("cy", d => yBase(d.c))
      .attr("fill", d => TECH_COLOR[d.t] || "#999")
      .on("mousemove", (event, d) => {
        showTooltip(event, `<strong>${d.m}</strong><br>${d.b}<br>${d.s}" &middot; ${d.c} kWh/yr<br>${d.t}`);
        moveTooltip(event);
      })
      .on("mouseleave", hideTooltip);

    const zoom = d3.zoom()
      .scaleExtent([1, 12])
      .translateExtent([[0, 0], [innerW, innerH]])
      .extent([[0, 0], [innerW, innerH]])
      .on("zoom", (event) => {
        zoomTransform = event.transform;
        const xz = zoomTransform.rescaleX(xBase);
        const yz = zoomTransform.rescaleY(yBase);
        drawAxes(xz, yz);
        gDots.attr("transform", zoomTransform);
        // One CSS variable update instead of 9,000+ per-circle attr() calls —
        // the --zoom-k var (used by .scatter-dot's r: calc(...) in insights.css)
        // keeps every dot's visual size constant while zoomed.
        svgEl.style.setProperty("--zoom-k", zoomTransform.k);
      });

    g.append("rect")
      .attr("class", "zoom-rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .call(zoom);

    document.getElementById("scatter-reset").onclick = () => {
      d3.select(svgEl).select(".zoom-rect").transition().duration(400)
        .call(zoom.transform, d3.zoomIdentity);
    };
  }

  select.addEventListener("change", render); // fewer points per category = less lag
  render();
  onResize(render);
})();

/* =========================================================
   3. LOLLIPOP CHART — top 8 brands by average star rating
   ========================================================= */
(function brandChart() {
  const svgEl = document.getElementById("chart-brand");
  const data = TV_DATA.brandStats; // sorted desc by avgStar already
  const detailEl = document.getElementById("brand-detail");
  let descending = true;
  let selectedBrand = null;

  function currentOrder() {
    const arr = [...data];
    arr.sort((a, b) => descending ? b.avgStar - a.avgStar : a.avgStar - b.avgStar);
    return arr;
  }

  function render() {
    const svg = d3.select(svgEl);
    const ordered = currentOrder();

    const width = svgEl.parentElement.clientWidth;
    const rowH = 42;
    const margin = { top: 10, right: 60, bottom: 30, left: 160 };
    const innerH = ordered.length * rowH;
    const height = innerH + margin.top + margin.bottom;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const innerW = width - margin.left - margin.right;

    const x = d3.scaleLinear().domain([0, 5]).range([0, innerW]);
    const y = d3.scaleBand().domain(ordered.map(d => d.brand)).range([0, innerH]).padding(0.3);

    let g = svg.select("g.brand-g");
    if (g.empty()) {
      svg.selectAll("*").remove();
      g = svg.append("g").attr("class", "brand-g").attr("transform", `translate(${margin.left},${margin.top})`);
      g.append("g").attr("class", "axis x-axis").attr("transform", `translate(0,${innerH})`);
    } else {
      g.select(".x-axis").attr("transform", `translate(0,${innerH})`);
    }
    g.select(".x-axis").transition().duration(400).call(d3.axisBottom(x).ticks(5));

    const rows = g.selectAll(".lollipop-row")
      .data(ordered, d => d.brand);

    const rowsEnter = rows.enter().append("g")
      .attr("class", "lollipop-row")
      .attr("transform", d => `translate(0,${y(d.brand)})`);

    rowsEnter.append("text")
      .attr("class", "lollipop-label")
      .attr("x", -12)
      .attr("y", y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .text(d => d.brand.length > 18 ? d.brand.slice(0, 17) + "\u2026" : titleCase(d.brand));

    rowsEnter.append("line")
      .attr("class", "lollipop-line")
      .attr("x1", x(0)).attr("x2", x(0))
      .attr("y1", y.bandwidth() / 2).attr("y2", y.bandwidth() / 2);

    rowsEnter.append("circle")
      .attr("class", "lollipop-dot")
      .attr("cx", x(0))
      .attr("cy", y.bandwidth() / 2)
      .attr("r", 7);

    rowsEnter.append("text")
      .attr("class", "lollipop-value")
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "-0.9em")
      .attr("text-anchor", "middle");

    const merged = rowsEnter.merge(rows);

    merged.transition().duration(500)
      .attr("transform", d => `translate(0,${y(d.brand)})`);

    merged.select("line")
      .transition().duration(500)
      .attr("x2", d => x(d.avgStar));

    merged.select("circle")
      .transition().duration(500)
      .attr("cx", d => x(d.avgStar));

    merged.select(".lollipop-value")
      .transition().duration(500)
      .attr("x", d => x(d.avgStar))
      .tween("text", function (d) {
        const node = this;
        const current = parseFloat(node.textContent) || 0;
        const i = d3.interpolateNumber(current, d.avgStar);
        return t => node.textContent = i(t).toFixed(2);
      });

    merged.select("circle")
      .classed("selected", d => d.brand === selectedBrand)
      .on("mousemove", (event, d) => {
        showTooltip(event, `<strong>${titleCase(d.brand)}</strong><br>Avg star: ${d.avgStar.toFixed(2)}<br>Avg CEC: ${d.avgCEC.toFixed(0)} kWh/yr<br>${d.count} models`);
        moveTooltip(event);
      })
      .on("mouseleave", hideTooltip)
      .on("click", (event, d) => {
        selectedBrand = selectedBrand === d.brand ? null : d.brand;
        merged.select("circle").classed("selected", dd => dd.brand === selectedBrand);
        showBrandDetail(selectedBrand ? d : null);
      });

    rows.exit().remove();
  }

  function titleCase(s) {
    return s.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  function showBrandDetail(d) {
    if (!d) { detailEl.hidden = true; return; }
    const items = d.topModels.map(m => `<li>${m.model} &mdash; ${m.star.toFixed(2)} stars${m.cec ? `, ${m.cec} kWh/yr` : ""}</li>`).join("");
    detailEl.innerHTML = `<h3>${titleCase(d.brand)} &mdash; top rated models</h3><ul>${items}</ul>`;
    detailEl.hidden = false;
  }

  document.getElementById("brand-sort-toggle").addEventListener("click", (e) => {
    descending = !descending;
    e.target.textContent = descending ? "Sort: High \u2192 Low" : "Sort: Low \u2192 High";
    render();
  });

  render();
  onResize(render);
})();

/* =========================================================
   4. LINE CHART — average active-mode power by release year
   ========================================================= */
(function lineChart() {
  const svgEl = document.getElementById("chart-line");
  const select = document.getElementById("line-select");

  function render() {
    const key = select.value;
    const data = TV_DATA.yearSeries[key] || [];

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    if (!data.length) return;

    const width = svgEl.parentElement.clientWidth;
    const height = 360;
    const margin = { top: 20, right: 24, bottom: 42, left: 54 };
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([0, innerW]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avgPower) * 1.15])
      .range([innerH, 0]);

    g.append("g").attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

    g.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(Math.min(data.length, 10)).tickFormat(d3.format("d")));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.avgPower))
      .curve(d3.curveMonotoneX);

    const path = g.append("path")
      .datum(data)
      .attr("class", "trend-line")
      .attr("d", line);

    // Draw-on transition (left to right)
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition().duration(900).ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    g.selectAll(".trend-dot")
      .data(data)
      .join("circle")
      .attr("class", "trend-dot")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.avgPower))
      .attr("r", 0)
      .on("mousemove", (event, d) => {
        showTooltip(event, `<strong>${d.year}</strong><br>${d.avgPower.toFixed(1)} W (active mode)`);
        moveTooltip(event);
      })
      .on("mouseleave", hideTooltip)
      .transition().delay(500).duration(400)
      .attr("r", 4);

    svg.append("text")
      .attr("class", "axis")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + innerH / 2))
      .attr("y", 14)
      .style("font-size", "0.82rem")
      .text("Avg active-mode power (W)");
  }

  select.addEventListener("change", render);
  render();
  onResize(render);
})();
