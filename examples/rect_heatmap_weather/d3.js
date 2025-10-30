render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);

  const records = await loadWeatherRecords();
  scale.color.domain(d3.extent(records, (d) => d.tempMax));

  const cells = appendCells(plot, records, scale);
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
    root: { width: 502, height: 215 },
    margin: { top: 20, right: 50, bottom: 40, left: 45 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  return {
    x: d3.scaleBand().domain(d3.range(1, 32)).range([0, layout.chart.width]),
    y: d3.scaleBand().domain(d3.range(0, 12)).range([0, layout.chart.height]),
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
    title: appendChartTitle(chart, layout),
    x: appendXAxisLabel(chart, layout),
    y: appendYAxisLabel(chart, layout),
  };
}

function appendChartTitle(chart, layout) {
  return chart
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 13)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", layout.margin.left + layout.chart.width / 2)
    .attr("y", layout.margin.top * 0.5)
    .text("Daily Max Temperatures (C) in Seattle, WA");
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
    .text("Day");
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
    .text("Month");
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
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).tickSizeOuter(0))
    .attr("stroke-width", 0);
}

function appendYAxis(plot, scale) {
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  return plot.append("g").call(
    d3
      .axisLeft(scale.y)
      .tickSizeOuter(0)
      .tickFormat((d) => months[d]),
  );
}

function appendCells(plot, records, scale) {
  return plot
    .selectAll(".cell")
    .data(records)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", (d) => scale.x(d.day))
    .attr("y", (d) => scale.y(d.month))
    .attr("width", scale.x.bandwidth())
    .attr("height", scale.y.bandwidth())
    .attr("stroke", (d) => scale.color(d.tempMax))
    .attr("fill", (d) => scale.color(d.tempMax));
}

function appendLegend({ chart, layout, scale }) {
  const legendWidth = 15;
  const swatchHeight = 5;
  const [min, max] = scale.color.domain();
  const steps = d3.range(Math.floor(min), Math.ceil(max) + 1);
  const formatTemp = d3.format(".0f");
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
    .selectAll("rect")
    .data(steps)
    .enter()
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", swatchHeight)
    .attr("fill", (value) => scale.color(value))
    .attr("transform", (_, index) => {
      const offset = swatchHeight * (steps.length - 1 - index);
      return `translate(0, ${offset})`;
    });

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "left")
    .attr("x", legendWidth + 5)
    .attr("y", 10)
    .text(formatTemp(max));

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "left")
    .attr("x", legendWidth + 5)
    .attr("y", swatchHeight * (steps.length - 1) + 5)
    .text(formatTemp(min));

  return legend;
}

async function loadWeatherRecords() {
  const parseDate = d3.timeParse("%Y-%m-%d");
  const raw = await d3.csv("../../data/seattle-weather.csv", (row) => {
    const date = parseDate(row.date);
    return {
      date,
      tempMax: +row.temp_max,
    };
  });

  const table = d3.rollups(
    raw,
    (group) => d3.max(group, (d) => d.tempMax),
    (d) => d.date.getDate(),
    (d) => d.date.getMonth(),
  );

  const records = [];
  for (const [day, monthly] of table) {
    for (const [month, tempMax] of monthly) {
      records.push({ day, month, tempMax });
    }
  }
  return records;
}
