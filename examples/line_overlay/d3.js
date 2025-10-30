render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const series = await loadStockSeries();
  configureScales(scale, series);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const marks = appendSeries(plot, series, scale);
  const legend = appendLegend({ chart, layout, scale });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks,
      legend,
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 314, height: 245 },
    margin: { top: 20, right: 70, bottom: 40, left: 45 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  const colorSequence = ["steelblue", "orange", "red", "lightblue", "green"];
  return {
    x: d3.scaleLinear().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
    color: d3.scaleOrdinal().range(colorSequence),
  };
}

async function loadStockSeries() {
  const parseDate = d3.timeParse("%b %d %Y");
  const rows = await d3.csv("../../data/stocks.csv", (row) => {
    const date = parseDate(row.date);
    return {
      symbol: row.symbol,
      year: date.getFullYear(),
      price: +row.price,
    };
  });

  const table = d3.rollups(
    rows,
    (group) => d3.mean(group, (d) => d.price),
    (d) => d.symbol,
    (d) => d.year,
  );

  return table.map(([symbol, entries]) => ({
    symbol,
    values: entries
      .map(([year, price]) => ({ year, price }))
      .sort((a, b) => a.year - b.year),
  }));
}

function configureScales(scale, series) {
  const years = series.flatMap(({ values }) => values.map((d) => d.year));
  const prices = series.flatMap(({ values }) => values.map((d) => d.price));

  scale.x.domain(d3.extent(years));
  scale.y.domain([0, d3.max(prices) ?? 0]);
  scale.color.domain(series.map((d) => d.symbol));
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
    .text("date (year)");
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
    .text("Mean of price");
}

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(
      d3
        .axisBottom(scale.x)
        .ticks(5)
        .tickFormat(d3.format("d"))
        .tickSizeOuter(0),
    );

  plot
    .append("g")
    .attr("class", "grid")
    .attr("opacity", 0.7)
    .attr("stroke-width", 0.2)
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(
      d3
        .axisBottom(scale.x)
        .ticks(5)
        .tickSize(-layout.chart.height)
        .tickFormat(""),
    );

  axes.y = plot
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(scale.y).ticks(5));

  plot
    .append("g")
    .attr("class", "grid")
    .attr("opacity", 0.7)
    .attr("stroke-width", 0.2)
    .attr("transform", `translate(${layout.chart.width}, 0)`)
    .call(
      d3.axisLeft(scale.y).ticks(5).tickSize(layout.chart.width).tickFormat(""),
    );

  return axes;
}

function appendSeries(plot, series, scale) {
  const generator = d3
    .line()
    .x((d) => scale.x(d.year))
    .y((d) => scale.y(d.price));

  const groups = plot
    .append("g")
    .attr("class", "series")
    .selectAll(".series-group")
    .data(series, (d) => d.symbol)
    .enter()
    .append("g")
    .attr("class", "series-group");

  groups
    .append("path")
    .attr("class", "line")
    .attr("d", (d) => generator(d.values))
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", (d) => scale.color(d.symbol));

  groups
    .selectAll("circle")
    .data((d) => d.values.map((value) => ({ ...value, symbol: d.symbol })))
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("r", 3)
    .attr("fill", (d) => scale.color(d.symbol))
    .attr("cx", (d) => scale.x(d.year))
    .attr("cy", (d) => scale.y(d.price));

  return groups;
}

function appendLegend({ chart, layout, scale }) {
  const symbols = scale.color.domain();
  const legend = chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width}, ${layout.margin.top})`,
    );

  const radius = 6;
  const squareSize = 10;
  const padding = 3;
  const offsetX = 15;

  legend
    .selectAll("legend-dot")
    .data(symbols)
    .enter()
    .append("circle")
    .attr("cx", offsetX + radius * 0.75)
    .attr("cy", (_, i) => 20 + i * (squareSize + padding))
    .attr("r", radius)
    .attr("fill", (symbol) => scale.color(symbol));

  legend
    .selectAll("legend-label")
    .data(symbols)
    .enter()
    .append("text")
    .attr("x", 20 + squareSize * 1.2)
    .attr("y", (_, i) => 20 + i * (squareSize + padding))
    .attr("font-size", 9)
    .attr("text-anchor", "start")
    .style("alignment-baseline", "central")
    .text((symbol) => symbol);

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .attr("x", offsetX)
    .attr("y", 10)
    .text("symbol");

  return legend;
}
