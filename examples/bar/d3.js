render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const data = await loadBarData();
  configureScale(scale, data);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const grid = appendGridlines(plot, layout, scale);
  const marks = appendBars(plot, data, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      grid,
      marks: { bars: marks },
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 229, height: 252 },
    margin: { top: 15, right: 20, bottom: 35, left: 40 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  return {
    x: d3.scaleBand().range([0, layout.chart.width]).padding(0.1),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
  };
}

async function loadBarData() {
  return d3.json("data.json");
}

function configureScale(scale, data) {
  scale.x.domain(data.map((d) => d.a));
  scale.y.domain([0, 100]);
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
      layout.margin.top + layout.chart.height + 0.75 * layout.margin.bottom,
    )
    .text("a");
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
    .attr("y", layout.margin.left * 0.3)
    .text("b");
}

function appendAxes(plot, layout, scale) {
  return {
    x: plot
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(d3.axisBottom(scale.x)),
    y: plot
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(scale.y).ticks(5)),
  };
}

function appendGridlines(plot, layout, scale) {
  return plot
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisLeft(scale.y)
        .ticks(5)
        .tickSize(-layout.chart.width)
        .tickFormat(""),
    )
    .call((g) =>
      g
        .selectAll(".tick line")
        .attr("stroke", "grey")
        .attr("stroke-opacity", 0.5),
    );
}

function appendBars(plot, data, scale) {
  return plot
    .append("g")
    .attr("class", "bars")
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("fill", "steelblue")
    .attr("x", (d) => scale.x(d.a))
    .attr("y", (d) => scale.y(d.b))
    .attr("width", scale.x.bandwidth())
    .attr("height", (d) => scale.y(0) - scale.y(d.b));
}
