render();

async function render() {
  const layout = createLayout();
  const scale = createScale({ layout });

  const dataset = await loadCarHorsepower();
  const stacked = computeStackedDensities({ dataset, scale });

  configureScales(scale, stacked);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const axes = appendAxes(plot, layout, scale);
  const labels = appendAxisLabels(chart, layout);
  const areas = appendStackedAreas(plot, stacked.series, scale);
  const legend = appendLegend({ chart, layout, scale });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { areas },
      legend,
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 575, height: 260 },
    margin: { top: 20, right: 120, bottom: 40, left: 55 },
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
    .domain(["USA", "Europe", "Japan"])
    .range(["#e45756", "#f58518", "#4c78a8"]);
  return {
    x: d3.scaleLinear().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
    color: colorScale,
    series: colorScale,
  };
}

async function loadCarHorsepower() {
  const rows = await d3.json("../../data/cars.json");
  return rows
    .filter(
      (row) =>
        typeof row.Horsepower === "number" && Number.isFinite(row.Horsepower),
    )
    .map((row) => ({
      horsepower: row.Horsepower,
      origin: row.Origin,
    }));
}

function computeStackedDensities({ dataset, scale }) {
  const origins = scale.series.domain();
  const valuesByOrigin = d3.group(dataset, (d) => d.origin);

  const xmin = 40;
  const xmax = 200;
  const bandwidth = 15;

  const sampleCount = 200;
  const step = (xmax - xmin) / Math.max(sampleCount - 1, 1);
  const grid = d3.range(sampleCount).map((index) => xmin + index * step);
  const gaussian = (u) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);

  const densities = origins.map((origin) => {
    const rawValues =
      valuesByOrigin.get(origin)?.map((d) => d.horsepower) ?? [];
    const originValues = rawValues.filter(
      (value) => Number.isFinite(value) && value >= xmin && value <= xmax,
    );

    return {
      origin,
      values: grid.map((x) => {
        if (originValues.length === 0) {
          return { x, density: 0 };
        }
        const total = originValues.reduce(
          (acc, value) => acc + gaussian((x - value) / bandwidth),
          0,
        );
        return { x, density: total / (originValues.length * bandwidth) };
      }),
    };
  });

  const cumulative = grid.map(() => 0);
  const series = densities.map(({ origin, values }) => {
    const stackedValues = values.map(({ x, density }, index) => {
      const y0 = cumulative[index];
      const y1 = y0 + density;
      cumulative[index] = y1;
      return { x, y0, y1 };
    });
    return { origin, values: stackedValues };
  });

  return {
    series,
    xDomain: [grid[0], grid[grid.length - 1]],
    yMax: d3.max(cumulative) ?? 0,
  };
}

function configureScales(scale, stacked) {
  scale.x.domain(stacked.xDomain);
  const maxDensity = stacked.yMax > 0 ? stacked.yMax : 1;
  scale.y.domain([0, maxDensity]);
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
    .attr("y", layout.margin.left * 0.25)
    .text("Density");
}

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).ticks(8));

  const gridY = plot
    .append("g")
    .attr("class", "grid grid-y")
    .call(
      d3
        .axisLeft(scale.y)
        .ticks(5)
        .tickSize(-layout.chart.width)
        .tickFormat(""),
    );
  gridY.selectAll("line").attr("stroke", "#bbb").attr("stroke-opacity", 0.6);

  axes.y = plot
    .append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(scale.y).ticks(5));

  return axes;
}

function appendStackedAreas(plot, series, scale) {
  const area = d3
    .area()
    .x((d) => scale.x(d.x))
    .y0((d) => scale.y(d.y0))
    .y1((d) => scale.y(d.y1));

  return plot
    .append("g")
    .attr("class", "densities")
    .selectAll("path")
    .data(series, (d) => d.origin)
    .enter()
    .append("path")
    .attr("class", "density")
    .attr("fill", (d) => scale.color(d.origin))
    .attr("stroke", "none")
    .attr("fill-opacity", 0.85)
    .attr("d", (d) => area(d.values));
}

function appendLegend({ chart, layout, scale }) {
  const legend = chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width + 20}, ${layout.margin.top})`,
    );

  const rowHeight = 18;

  legend
    .selectAll("legend-swatch")
    .data(scale.color.domain())
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (_, index) => index * rowHeight)
    .attr("width", 12)
    .attr("height", 12)
    .attr("rx", 2)
    .attr("fill", (origin) => scale.color(origin));

  legend
    .selectAll("legend-label")
    .data(scale.color.domain())
    .enter()
    .append("text")
    .attr("x", 18)
    .attr("y", (_, index) => index * rowHeight + 6)
    .attr("font-size", 10)
    .attr("dominant-baseline", "middle")
    .text((origin) => origin);

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -6)
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .text("origin");

  return legend;
}
