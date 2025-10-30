render();

async function render() {
  const layout = createLayout();
  const scale = createScale({ layout });

  const data = await loadPunchcardData(scale.categories);
  configureScales(scale, data);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const marks = appendCircles(plot, data, scale);
  const legend = appendLegend({ chart, layout, scale });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { circles: marks },
      legend,
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 623, height: 182 },
    margin: { top: 20, right: 90, bottom: 30, left: 50 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale({ layout }) {
  const categories = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rotatedCategories = categories.slice(1).concat([categories[0]]);
  return {
    x: d3.scaleBand().range([0, layout.chart.width]).domain(d3.range(0, 24)),
    y: d3.scaleBand().range([0, layout.chart.height]).domain(rotatedCategories),
    radius: d3.scaleSqrt().range([3, 10]),
    categories,
  };
}

async function loadPunchcardData(categories) {
  const parseTime = d3.timeParse("%Y/%m/%d %H:%M:%S");
  const rows = await d3.csv("../../data/github.csv", (row) => {
    const time = parseTime(row.time);
    return {
      hour: time.getHours(),
      dayOfWeek: categories[time.getDay()],
      count: +row.count,
    };
  });
  return rows;
}

function configureScales(scale, data) {
  const extent = d3.extent(data, (d) => d.count);
  const [min, max] = extent;
  scale.radius.domain(min === max ? [min ?? 0, (max ?? 0) + 1] : extent);
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
    .attr("y", layout.margin.top + layout.chart.height + layout.margin.bottom)
    .text("time (hours)");
}

function appendYAxisLabel(chart, layout) {
  return chart
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -layout.margin.top - layout.chart.height / 2)
    .attr("y", layout.margin.left / 3)
    .text("time (day)");
}

function appendAxes(plot, layout, scale) {
  return {
    x: plot
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(
        d3
          .axisBottom(scale.x)
          .tickValues(scale.x.domain().filter((_, i) => i % 2 === 0))
          .tickFormat((d) => `${d}:00`),
      ),
    y: plot.append("g").attr("class", "y-axis").call(d3.axisLeft(scale.y)),
  };
}

function appendCircles(plot, data, scale) {
  const group = plot.append("g").attr("class", "circles");

  group
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => scale.x(d.hour) + scale.x.bandwidth() / 2)
    .attr("cy", (d) => scale.y(d.dayOfWeek) + scale.y.bandwidth() / 2)
    .attr("r", (d) => scale.radius(d.count))
    .attr("fill", "steelblue");

  return group;
}

function appendLegend({ chart, layout, scale }) {
  const legendData = [10, 20, 30, 40, 50];
  const legend = chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width + 15}, ${
        layout.margin.top
      })`,
    );

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .attr("x", 0)
    .attr("y", 10)
    .text("Sum of count");

  legend
    .selectAll("legend-circle")
    .data(legendData)
    .enter()
    .append("circle")
    .attr("cx", 10)
    .attr("cy", (_, i) => 20 + 20 * i)
    .attr("r", (value) => scale.radius(value))
    .attr("fill", "steelblue");

  legend
    .selectAll("legend-label")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 25)
    .attr("y", (_, i) => 20 + 20 * i)
    .attr("font-size", 10)
    .attr("text-anchor", "start")
    .style("alignment-baseline", "middle")
    .text((value) => value);

  return legend;
}
