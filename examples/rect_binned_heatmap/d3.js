render();

async function render() {
  const layout = createLayout();
  const dataset = await loadBinnedHeatmap();
  const scale = createScale(layout, dataset);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const cells = appendCells(plot, dataset, scale);
  const legend = appendLegend({ chart, layout, scale, dataset });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      cells,
      legend,
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 460, height: 247 },
    margin: { top: 10, right: 120, bottom: 30, left: 50 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

async function loadBinnedHeatmap() {
  const data = await d3.json("../../data/movies.json");
  const filtered = data.filter(
    (d) => !!d["IMDB Rating"] && !!d["Rotten Tomatoes Rating"],
  );

  const withBins = filtered.map((d) => {
    const imdb = +d["IMDB Rating"];
    const rotten = +d["Rotten Tomatoes Rating"];
    return {
      imdbBin: roundToStep(imdb, 0.2),
      rottenBin: roundDownToStep(rotten, 5),
    };
  });

  const table = d3.rollups(
    withBins,
    (group) => group.length,
    (d) => d.imdbBin,
    (d) => d.rottenBin,
  );

  const records = [];
  for (const [imdbBin, rows] of table) {
    for (const [rottenBin, count] of rows) {
      records.push({ imdbBin, rottenBin, count });
    }
  }

  const imdbBins = Array.from(new Set(records.map((d) => d.imdbBin))).sort(
    (a, b) => a - b,
  );
  const rottenBins = Array.from(new Set(records.map((d) => d.rottenBin))).sort(
    (a, b) => a - b,
  );

  return {
    records,
    x: {
      domain: [d3.min(imdbBins) ?? 0, (d3.max(imdbBins) ?? 0) + 0.2],
      step: estimateStep(imdbBins, 0.2),
    },
    y: {
      domain: [d3.min(rottenBins) ?? 0, (d3.max(rottenBins) ?? 0) + 5],
      step: estimateStep(rottenBins, 5),
    },
    countExtent: d3.extent(records, (d) => d.count),
  };
}

function roundToStep(value, step) {
  return Math.floor(value / step) * step;
}

function roundDownToStep(value, step) {
  return value - ((value - 1) % step);
}

function estimateStep(values, fallback) {
  if (values.length < 2) {
    return fallback;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[1] - sorted[0];
}

function createScale(layout, dataset) {
  const [minCount, maxCount] = dataset.countExtent;
  const colorDomain =
    minCount === maxCount
      ? [minCount ?? 0, (maxCount ?? 0) + 1]
      : dataset.countExtent;

  return {
    x: d3.scaleLinear().domain(dataset.x.domain).range([0, layout.chart.width]),
    y: d3
      .scaleLinear()
      .domain(dataset.y.domain)
      .range([layout.chart.height, 0]),
    color: d3.scaleSequential(d3.interpolateYlGnBu).domain(colorDomain),
  };
}

function appendChartRoot(layout) {
  return d3
    .select("#graph-d3js")
    .append("svg")
    .attr("width", layout.root.width)
    .attr("height", layout.root.height);
}

function appendPlotGroup(chart, layout) {
  return chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left}, ${layout.margin.top})`,
    );
}

function appendAxisLabels(chart, layout) {
  return {
    x: appendXAxisLabel(chart, layout),
    y: appendYAxisLabel(chart, layout),
  };
}

function appendXAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", layout.margin.left + layout.chart.width / 2)
    .attr(
      "y",
      layout.margin.top + layout.chart.height + 0.9 * layout.margin.bottom,
    )
    .text("IMDB Rating (binned)");
}

function appendYAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", -layout.margin.left * 0.7)
    .text("Rotten Tomatoes Rating (binned)");
}

function appendAxes(plot, layout, scale) {
  return {
    x: plot
      .append("g")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(d3.axisBottom(scale.x)),
    y: plot.append("g").call(d3.axisLeft(scale.y)),
  };
}

function appendCells(plot, dataset, scale) {
  const { records, x, y } = dataset;
  const xWidth = (value) => scale.x(value + x.step) - scale.x(value);
  const yHeight = (value) => scale.y(value) - scale.y(value + y.step);

  const cells = plot.append("g").attr("class", "cells");

  cells
    .selectAll("rect")
    .data(records)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", (d) => scale.x(d.imdbBin))
    .attr("y", (d) => scale.y(d.rottenBin + y.step))
    .attr("width", (d) => xWidth(d.imdbBin))
    .attr("height", (d) => yHeight(d.rottenBin))
    .attr("fill", (d) => scale.color(d.count));

  return cells;
}

function appendLegend({ chart, layout, scale, dataset }) {
  const [min, max] = dataset.countExtent;
  const step = Math.max(1, Math.round((max - min) / 20));
  const ticks = d3.range(Math.floor(min), Math.ceil(max) + step, step);
  const legend = chart
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width + 20}, ${
        layout.margin.top
      })`,
    );

  legend
    .selectAll("rect")
    .data(ticks)
    .enter()
    .append("rect")
    .attr("width", 15)
    .attr("height", 7)
    .attr("x", 10)
    .attr("y", (_, index) => 10 + (ticks.length - 1 - index) * 7)
    .attr("fill", (value) => scale.color(value));

  legend
    .selectAll("text")
    .data([ticks[0], ticks[ticks.length - 1]])
    .enter()
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "start")
    .attr("x", 30)
    .attr("y", (value, index) =>
      index === 0 ? 10 + (ticks.length - 1) * 7 : 10,
    )
    .style("alignment-baseline", "middle")
    .text((value) => value);

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .attr("x", 10)
    .attr("y", 0)
    .text("Count of Records");

  return legend;
}
