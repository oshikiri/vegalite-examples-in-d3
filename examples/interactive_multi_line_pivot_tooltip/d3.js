render();

async function render() {
  const layout = createLayout();
  const scale = createScale({ layout });
  const symbols = scale.series.domain();

  const dataset = await loadStockDataset(symbols);
  configureScales(scale, dataset);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const lines = appendSeries(plot, dataset.series, scale);
  const indicator = appendIndicator(plot, layout, scale);
  const legend = appendLegend({ chart, layout, scale, symbols });

  const tooltip = selectTooltip();
  attachInteractions({
    chart,
    plot,
    layout,
    scale,
    tooltip,
    indicator,
    dataset,
    symbols,
  });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { lines },
      indicator,
      legend,
      tooltip,
    },
  };
}
function createLayout() {
  const layout = {
    root: { width: 514, height: 347 },
    margin: { top: 20, right: 70, bottom: 40, left: 45 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale({ layout }) {
  const colorScale = d3
    .scaleOrdinal()
    .domain(["AAPL", "AMZN", "GOOG", "IBM", "MSFT"])
    .range(["steelblue", "orange", "red", "lightblue", "green"]);
  return {
    x: d3.scaleTime().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
    color: colorScale,
    series: colorScale,
  };
}

async function loadStockDataset(symbols) {
  const parseDate = d3.timeParse("%b %d %Y");
  const rows = await d3.csv("../../data/stocks.csv", (row) => ({
    date: parseDate(row.date),
    symbol: row.symbol,
    price: +row.price,
  }));

  const byDate = d3.rollup(
    rows,
    (group) => {
      const record = Object.fromEntries(symbols.map((symbol) => [symbol, 0]));
      group.forEach((entry) => {
        record[entry.symbol] = entry.price;
      });
      return record;
    },
    (d) => +d.date,
  );

  const dates = Array.from(byDate.keys())
    .map((key) => new Date(key))
    .sort((a, b) => a - b);

  const seriesTable = d3.rollups(
    rows,
    (group) => d3.mean(group, (d) => d.price),
    (d) => d.symbol,
    (d) => d.date,
  );

  const series = seriesTable.map(([symbol, points]) => ({
    symbol,
    values: points
      .map(([date, price]) => ({ date, price }))
      .sort((a, b) => a.date - b.date),
  }));

  return { series, byDate, dates };
}

function configureScales(scale, dataset) {
  const allDates = dataset.dates;
  const allPrices = dataset.series.flatMap(({ values }) =>
    values.map((d) => d.price),
  );

  scale.x.domain(d3.extent(allDates));
  scale.y.domain([0, d3.max(allPrices) ?? 0]);
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
    .attr("y", layout.margin.left / 3)
    .text("price");
}

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).ticks(10).tickFormat(d3.timeFormat("%Y")));

  plot
    .append("g")
    .attr("class", "grid grid-x")
    .attr("opacity", 0.7)
    .attr("stroke-width", 0.2)
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(
      d3
        .axisBottom(scale.x)
        .ticks(10)
        .tickSize(-layout.chart.height)
        .tickFormat(""),
    );

  axes.y = plot
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(scale.y).ticks(10));

  plot
    .append("g")
    .attr("class", "grid grid-y")
    .attr("opacity", 0.7)
    .attr("stroke-width", 0.2)
    .attr("transform", `translate(${layout.chart.width}, 0)`)
    .call(
      d3
        .axisLeft(scale.y)
        .ticks(10)
        .tickSize(layout.chart.width)
        .tickFormat(""),
    );

  return axes;
}

function appendSeries(plot, series, scale) {
  const generator = d3
    .line()
    .x((d) => scale.x(d.date))
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
    .attr("stroke", (d) => scale.color(d.symbol))
    .attr("stroke-width", 2);

  return groups;
}

function appendIndicator(plot, layout, scale) {
  const [ymin, ymax] = scale.y.range();
  return plot
    .append("line")
    .attr("class", "indicator")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", ymin)
    .attr("y2", ymax)
    .attr("stroke", "grey")
    .attr("stroke-opacity", 0.8)
    .style("visibility", "hidden");
}

function appendLegend({ chart, layout, scale, symbols }) {
  const legend = chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width}, ${layout.margin.top})`,
    );

  const radius = 5;
  const squareSize = 10;
  const paddingSquares = 3;
  const offsetX = 15;

  legend
    .selectAll("legend-dot")
    .data(symbols)
    .enter()
    .append("circle")
    .attr("cx", offsetX + radius * 0.75)
    .attr("cy", (_, i) => 20 + i * (squareSize + paddingSquares))
    .attr("r", radius)
    .attr("fill", "none")
    .attr("stroke", (symbol) => scale.color(symbol));

  legend
    .selectAll("legend-label")
    .data(symbols)
    .enter()
    .append("text")
    .attr("x", 20 + squareSize * 1.2)
    .attr("y", (_, i) => 20 + i * (squareSize + paddingSquares))
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

function selectTooltip() {
  return d3.select(".tooltip");
}

function attachInteractions({
  chart,
  plot,
  layout,
  scale,
  tooltip,
  indicator,
  dataset,
  symbols,
}) {
  const overlay = plot
    .append("rect")
    .attr("class", "interaction-layer")
    .attr("width", layout.chart.width)
    .attr("height", layout.chart.height)
    .attr("fill", "transparent")
    .attr("pointer-events", "all");

  overlay
    .on("mouseover", () => {
      tooltip.style("visibility", "visible");
      indicator.style("visibility", "visible");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
      indicator.style("visibility", "hidden");
    })
    .on("mousemove", (event) => {
      const [x] = d3.pointer(event, plot.node());
      const date = scale.x.invert(x);
      const closestDate = findClosestDate(date, dataset.dates);
      const record = dataset.byDate.get(+closestDate);
      if (!record) {
        return;
      }

      updateTooltip(tooltip, record, symbols);
      updateIndicator(indicator, scale, closestDate);

      tooltip
        .style("top", `${event.pageY + 20}px`)
        .style("left", `${event.pageX + 20}px`);
    });
}

function findClosestDate(target, dates) {
  return dates.reduce((closest, current) => {
    const closestDiff = Math.abs(closest - target);
    const currentDiff = Math.abs(current - target);
    return currentDiff < closestDiff ? current : closest;
  }, dates[0]);
}

function updateTooltip(tooltip, record, symbols) {
  for (const symbol of symbols) {
    tooltip.select(`#price-${symbol.toLowerCase()}`).text(record[symbol] ?? 0);
  }
}

function updateIndicator(indicator, scale, date) {
  const x = scale.x(date);
  indicator.attr("x1", x).attr("x2", x);
}
