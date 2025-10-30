render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const data = await loadHistogramData();
  const bins = createBins(data);
  configureScales(scale, bins);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const marks = appendBars(plot, bins, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { bars: marks },
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 258, height: 247 },
    margin: { top: 20, right: 0, bottom: 30, left: 50 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  return {
    x: d3.scaleLinear().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
  };
}

async function loadHistogramData() {
  return d3.json("../../data/movies.json");
}

function createBins(data) {
  return d3
    .bin()
    .thresholds(10)
    .value((d) => d["IMDB Rating"])(data);
}

function configureScales(scale, bins) {
  scale.x.domain([0, 10]);
  scale.y.domain([0, d3.max(bins, (bin) => bin.length) ?? 0]);
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
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", layout.margin.left * 0.3)
    .text("Count of Records");
}

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(
      d3
        .axisBottom(scale.x)
        .tickFormat(d3.format(".1f"))
        .tickValues(d3.range(1, 10, 2)),
    );

  plot
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(scale.y)
        .ticks(5)
        .tickSize(-layout.chart.width)
        .tickFormat(""),
    )
    .style("stroke-opacity", 0.3);

  axes.y = plot.append("g").call(d3.axisLeft(scale.y).ticks(5));

  return axes;
}

function appendBars(plot, bins, scale) {
  return plot
    .append("g")
    .attr("class", "bars")
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("class", "bar")
    .attr("fill", "steelblue")
    .attr("x", (d) => scale.x(d.x0))
    .attr("y", (d) => scale.y(d.length))
    .attr("width", (d) => scale.x(d.x1) - scale.x(d.x0))
    .attr("height", (d) => scale.y(0) - scale.y(d.length));
}
