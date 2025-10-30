render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const data = await loadStockData();
  configureScales(scale, data);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const marks = appendLine(plot, data, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { line: marks },
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 244, height: 252 },
    margin: { top: 10, right: 10, bottom: 40, left: 40 },
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

async function loadStockData() {
  const parseTime = d3.timeParse("%b %d %Y");
  const rows = await d3.csv("../../data/stocks.csv");
  return rows
    .filter((d) => d.symbol === "GOOG")
    .map((d) => ({
      date: parseTime(d.date),
      price: +d.price,
    }));
}

function configureScales(scale, data) {
  scale.x.domain(d3.extent(data, (d) => d.date));
  scale.y.domain([0, d3.max(data, (d) => d.price) ?? 0]);
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
      layout.margin.top + layout.chart.height + layout.margin.bottom / 2,
    )
    .text("date");
}

function appendYAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", layout.margin.left / 2)
    .text("price");
}

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).ticks(5).tickSize(-layout.chart.height));

  axes.y = plot
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(scale.y).ticks(5).tickSize(-layout.chart.width));

  axes.x.selectAll(".tick line").attr("stroke-opacity", 0.2);
  axes.y.selectAll(".tick line").attr("stroke-opacity", 0.2);

  return axes;
}

function appendLine(plot, data, scale) {
  const generator = d3
    .line()
    .x((d) => scale.x(d.date))
    .y((d) => scale.y(d.price));

  return plot
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", generator);
}
