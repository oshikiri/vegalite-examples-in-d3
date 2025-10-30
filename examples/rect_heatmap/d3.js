render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);

  const table = await loadHeatmapTable(scale);
  const cells = appendCells(plot, table, scale);
  const legend = appendLegend({ chart, layout, scale });

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
    root: { width: 296, height: 103 },
    margin: { top: 10, right: 130, bottom: 30, left: 60 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  return {
    x: d3.scaleBand().domain([3, 4, 5, 6, 8]).range([0, layout.chart.width]),
    y: d3
      .scaleBand()
      .domain(["USA", "Japan", "Europe"])
      .range([layout.chart.height, 0]),
    color: d3.scaleSequential(d3.interpolateYlGnBu),
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
    .text("Cylinders");
}

function appendYAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", layout.margin.left / 4)
    .text("Origin");
}

function appendAxes(plot, layout, scale) {
  return {
    x: appendXAxis(plot, layout, scale),
    y: appendYAxis(plot, scale),
  };
}

function appendXAxis(plot, layout, scale) {
  return plot
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).ticks(5));
}

function appendYAxis(plot, scale) {
  return plot
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(scale.y).ticks(5));
}

async function loadHeatmapTable(scale) {
  const data = await d3.json("../../data/cars.json");
  const table = d3.rollups(
    data,
    (g) => d3.mean(g, (d) => d.Horsepower),
    (d) => d.Origin,
    (d) => d.Cylinders,
  );

  const horsepowers = [].concat(
    ...table.map((row) => row[1].map((col) => col[1])),
  );
  scale.color.domain(d3.extent(horsepowers));

  return table;
}

function appendCells(plot, table, scale) {
  const rows = plot
    .selectAll(".row")
    .data(table)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", ([origin]) => `translate(0, ${scale.y(origin)})`);

  rows
    .selectAll(".cell")
    .data(([, d]) => d)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", ([cylinder]) => scale.x(cylinder))
    .attr("width", scale.x.bandwidth())
    .attr("height", scale.y.bandwidth())
    .attr("opacity", 0.9)
    .attr("fill", ([, horsepower]) => scale.color(horsepower));

  return rows;
}

function appendLegend({ chart, layout, scale }) {
  const legendWidth = 15;
  const colorY = (hp) => 0.75 * (hp - 76);
  const toLegendY = (hp) =>
    layout.margin.top + layout.chart.height - colorY(hp);
  const legend = chart
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width + 10}, ${
        layout.margin.top
      })`,
    );

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 5)
    .text("Mean of Hoursepower");

  legend
    .selectAll(".legend")
    .data(d3.range(76, 158, 5))
    .enter()
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", 5)
    .attr("fill", (hp) => scale.color(hp))
    .attr("transform", (hp) => `translate(0, ${toLegendY(hp)})`);

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "left")
    .attr("dominant-baseline", "text-top")
    .attr("x", legendWidth + 5)
    .attr("y", toLegendY(76))
    .text("76");

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "top")
    .attr("dominant-baseline", "hanging")
    .attr("x", legendWidth + 5)
    .attr("y", toLegendY(158))
    .text("158");
}
