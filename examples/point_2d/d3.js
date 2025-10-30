render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const data = await loadPointData();
  configureScale(scale, data);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const marks = appendPoints(plot, data, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { points: marks },
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
    x: d3.scaleLinear().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
  };
}

async function loadPointData() {
  return d3.json("../../data/cars.json");
}

function configureScale(scale, data) {
  scale.x.domain(d3.extent(data, (d) => d.Horsepower));
  scale.y.domain(d3.extent(data, (d) => d.Miles_per_Gallon));
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
    .text("Horsepower");
}

function appendYAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", layout.margin.left * 0.4)
    .text("Miles_per_Gallon");
}

function appendAxes(plot, layout, scale) {
  const axes = {
    x: plot
      .append("g")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(d3.axisBottom(scale.x).ticks(5).tickSize(-layout.chart.height)),
    y: plot
      .append("g")
      .call(d3.axisLeft(scale.y).ticks(5).tickSize(-layout.chart.width)),
  };

  axes.x.selectAll(".tick line").attr("stroke-opacity", 0.2);
  axes.y.selectAll(".tick line").attr("stroke-opacity", 0.2);

  return axes;
}

function appendPoints(plot, data, scale) {
  return plot
    .append("g")
    .attr("class", "points")
    .selectAll(".point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", (d) => scale.x(d.Horsepower))
    .attr("cy", (d) => scale.y(d.Miles_per_Gallon))
    .attr("r", 3);
}
