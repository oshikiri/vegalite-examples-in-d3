render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const aggregated = await loadUnemploymentCounts();
  configureScales(scale, aggregated);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const area = appendArea(plot, aggregated, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { area },
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 372, height: 242 },
    margin: { top: 10, right: 10, bottom: 40, left: 60 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  return {
    x: d3.scaleTime().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
  };
}

async function loadUnemploymentCounts() {
  const parseYearMonth = d3.timeParse("%Y-%m");
  const data = await d3.json("../../data/unemployment-across-industries.json");
  return d3
    .rollups(
      data,
      (group) => d3.sum(group, (d) => d.count),
      (d) => parseYearMonth(`${d.year}-${d.month}`),
    )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date - b.date);
}

function configureScales(scale, data) {
  scale.x.domain(d3.extent(data, (d) => d.date));
  scale.y.domain([0, d3.max(data, (d) => d.count) ?? 0]);
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
      layout.margin.top + layout.chart.height + 0.8 * layout.margin.bottom,
    )
    .text("date (year-month)");
}

function appendYAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", layout.margin.left * 0.3)
    .text("count");
}

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).ticks(10));

  plot
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(scale.y)
        .ticks(5)
        .tickSize(-layout.chart.width)
        .tickFormat(""),
    );

  axes.y = plot.append("g").call(d3.axisLeft(scale.y).ticks(5));

  return axes;
}

function appendArea(plot, data, scale) {
  const generator = d3
    .area()
    .x((d) => scale.x(d.date))
    .y0(scale.y(0))
    .y1((d) => scale.y(d.count));

  return plot
    .append("path")
    .datum(data)
    .attr("class", "area")
    .attr("d", generator);
}
