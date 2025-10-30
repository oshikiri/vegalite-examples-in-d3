render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const data = await loadGanttData();
  configureScales(scale, data);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const grid = appendGridlines(plot, layout, scale);
  const axes = appendAxes(plot, layout, scale);
  const marks = appendBars(plot, data, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      grid,
      axes,
      marks: { bars: marks },
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 240, height: 102 },
    margin: { top: 0, right: 10, bottom: 35, left: 40 },
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
    y: d3.scaleBand().range([0, layout.chart.height]).padding(0.1),
  };
}

async function loadGanttData() {
  return d3.json("./data.json");
}

function configureScales(scale, data) {
  const max = d3.max(data, (d) => Math.max(d.start, d.end)) ?? 0;
  scale.x.domain([0, max]);
  scale.y.domain(data.map((d) => d.task));
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
    .text("start, end");
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
    .text("task");
}

function appendGridlines(plot, layout, scale) {
  return plot
    .append("g")
    .attr("class", "grid")
    .call(
      d3
        .axisTop(scale.x)
        .ticks(5)
        .tickSize(-layout.chart.height)
        .tickFormat(""),
    )
    .call((g) =>
      g
        .selectAll(".tick line")
        .attr("stroke", "grey")
        .attr("stroke-opacity", 0.5),
    );
}

function appendAxes(plot, layout, scale) {
  return {
    x: plot
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(d3.axisBottom(scale.x).ticks(5)),
    y: plot.append("g").attr("class", "y-axis").call(d3.axisLeft(scale.y)),
  };
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
    .attr("x", (d) => scale.x(d.start))
    .attr("y", (d) => scale.y(d.task))
    .attr("width", (d) => scale.x(d.end) - scale.x(d.start))
    .attr("height", scale.y.bandwidth());
}
