render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const dataset = await loadWeatherCounts();
  configureScales(scale, dataset);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const legend = appendLegend({ chart, layout, scale });
  const axes = appendAxes(plot, layout, scale);
  const stacks = appendStacks(plot, dataset, scale);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      legend,
      marks: { stacks },
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 380, height: 242 },
    margin: { top: 10, right: 90, bottom: 40, left: 45 },
  };
  layout.chart = {
    width: layout.root.width - layout.margin.left - layout.margin.right,
    height: layout.root.height - layout.margin.top - layout.margin.bottom,
  };
  return layout;
}

function createScale(layout) {
  return {
    x: d3.scaleBand().padding(0.1).range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
    color: d3
      .scaleOrdinal()
      .domain(["sun", "snow", "rain", "fog", "drizzle"])
      .range(["#e7ba52", "#9467bd", "#1f77b4", "#c7c7c7", "#aec7e8"]),
  };
}

async function loadWeatherCounts() {
  const parseDate = d3.timeParse("%Y-%m-%d");
  const rows = await d3.csv("../../data/seattle-weather.csv", (row) => {
    const date = parseDate(row.date);
    return {
      month: date.getMonth(),
      weather: row.weather,
    };
  });

  const weatherTypes = Array.from(new Set(rows.map((d) => d.weather))).sort();
  const monthGroups = d3.rollups(
    rows,
    (group) =>
      d3.rollup(
        group,
        (items) => items.length,
        (d) => d.weather,
      ),
    (d) => d.month,
  );

  const months = monthGroups.map(([month]) => month).sort((a, b) => a - b);

  const records = monthGroups
    .sort((a, b) => a[0] - b[0])
    .map(([month, counts]) => {
      const record = { month };
      for (const weather of weatherTypes) {
        record[weather] = counts.get(weather) ?? 0;
      }
      return record;
    });

  return { months, records };
}

function configureScales(scale, { months, records }) {
  const baseDomain = scale.color.domain();
  const dataDomain = Array.from(
    new Set(
      records.flatMap((record) =>
        Object.keys(record).filter((key) => key !== "month"),
      ),
    ),
  );
  const mergedDomain = Array.from(new Set([...baseDomain, ...dataDomain]));
  scale.color.domain(mergedDomain);

  scale.x.domain(months);
  scale.y.domain([
    0,
    d3.max(records, (record) =>
      d3.sum(mergedDomain, (weather) => record[weather] ?? 0),
    ) ?? 0,
  ]);
  records.forEach((record) => {
    mergedDomain.forEach((weather) => {
      if (!(weather in record)) {
        record[weather] = 0;
      }
    });
  });
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
    .text("Month of the year");
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
    .text("Count of Records");
}

function appendAxes(plot, layout, scale) {
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

  return {
    x: plot
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(d3.axisBottom(scale.x).tickFormat((index) => months[index])),
    y: plot
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(scale.y).ticks(6)),
  };
}

function appendStacks(plot, dataset, scale) {
  const weatherTypes = scale.color.domain();
  const stack = d3.stack().keys(weatherTypes);
  const stacked = stack(dataset.records);

  const groups = plot
    .append("g")
    .attr("class", "stacks")
    .selectAll(".stack")
    .data(stacked)
    .enter()
    .append("g")
    .attr("class", "stack")
    .attr("fill", (series) => scale.color(series.key));

  groups
    .selectAll("rect")
    .data((series) =>
      series.map((segment) => ({ ...segment, key: series.key })),
    )
    .enter()
    .append("rect")
    .attr("x", (segment) => scale.x(segment.data.month))
    .attr("y", (segment) => scale.y(segment[1]))
    .attr("width", scale.x.bandwidth())
    .attr("height", (segment) => scale.y(segment[0]) - scale.y(segment[1]));

  return groups;
}

function appendLegend({ chart, layout, scale }) {
  const keys = scale.color.domain();
  const squareSize = 10;
  const paddingSquares = 3;
  const offsetX = 15;

  const legend = chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width}, ${layout.margin.top})`,
    );

  legend
    .selectAll("legend-square")
    .data(keys)
    .enter()
    .append("rect")
    .attr("x", layout.margin.right / 5)
    .attr("y", (_, i) => offsetX + i * (squareSize + paddingSquares))
    .attr("width", squareSize)
    .attr("height", squareSize)
    .attr("fill", (d) => scale.color(d));

  legend
    .selectAll("legend-labels")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", 20 + squareSize * 1.2)
    .attr("y", (_, i) => offsetX + i * (squareSize + paddingSquares) + 3)
    .attr("font-size", squareSize)
    .attr("text-anchor", "start")
    .style("alignment-baseline", "central")
    .text((d) => d);

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .attr("x", offsetX)
    .attr("y", 10)
    .text("Weather type");

  return legend;
}
