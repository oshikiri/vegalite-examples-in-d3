render();

async function render() {
  const layout = createLayout();
  const scale = createScale({ layout });

  const dataset = await loadMoviesDataset();
  const bins = computeBinnedCounts({ dataset, scale });

  configureScales({ scale, bins });

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const axes = appendAxes(plot, layout, scale);
  const labels = appendAxisLabels(chart, layout);
  const circles = appendCircles(plot, bins.cells, scale);
  const legend = appendLegend({ chart, layout, scale });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      marks: { circles },
      legend,
    },
  };
}

function createLayout() {
  const margin = { top: 20, right: 120, bottom: 50, left: 60 };
  const chart = { width: 400, height: 400 };
  return {
    root: {
      width: chart.width + margin.left + margin.right,
      height: chart.height + margin.top + margin.bottom,
    },
    margin,
    chart,
  };
}

function createScale({ layout }) {
  return {
    x: d3.scaleLinear().range([0, layout.chart.width]),
    y: d3.scaleLinear().range([layout.chart.height, 0]),
    radius: d3.scaleSqrt(),
    color: () => "#4c78a8",
    bin: {
      x: { maxbins: 10 },
      y: { maxbins: 10 },
    },
  };
}

async function loadMoviesDataset() {
  const rows = await d3.json("../../data/movies.json");
  return rows
    .map((row) => ({
      imdb: row["IMDB Rating"],
      rotten: row["Rotten Tomatoes Rating"],
    }))
    .filter((row) => Number.isFinite(row.imdb) && Number.isFinite(row.rotten));
}

function computeBinnedCounts({ dataset, scale }) {
  const { bin } = scale;
  const imdbExtent = d3.extent(dataset, (d) => d.imdb);
  const rottenExtent = d3.extent(dataset, (d) => d.rotten);
  const xmin = imdbExtent[0] ?? 0;
  const xmax = imdbExtent[1] ?? 10;
  const ymin = rottenExtent[0] ?? 0;
  const ymax = rottenExtent[1] ?? 100;

  const xStep = (xmax - xmin) / bin.x.maxbins;
  const yStep = (ymax - ymin) / bin.y.maxbins;

  bin.x.domain = [xmin, xmax];
  bin.y.domain = [ymin, ymax];

  const cellByIndex = new Map();
  let maxCount = 0;

  for (const { imdb, rotten } of dataset) {
    if (imdb < xmin || imdb > xmax || rotten < ymin || rotten > ymax) {
      continue;
    }
    const ix = Math.min(
      bin.x.maxbins - 1,
      Math.max(0, Math.floor((imdb - xmin) / xStep)),
    );
    const iy = Math.min(
      bin.y.maxbins - 1,
      Math.max(0, Math.floor((rotten - ymin) / yStep)),
    );
    const key = ix + iy * bin.x.maxbins;
    let cell = cellByIndex.get(key);
    if (!cell) {
      const x0 = xmin + ix * xStep;
      const x1 = x0 + xStep;
      const y0 = ymin + iy * yStep;
      const y1 = y0 + yStep;
      cell = {
        x0,
        x1,
        y0,
        y1,
        count: 0,
      };
      cellByIndex.set(key, cell);
    }
    cell.count += 1;
    if (cell.count > maxCount) {
      maxCount = cell.count;
    }
  }

  return {
    cells: Array.from(cellByIndex.values()),
    meta: {
      xDomain: [xmin, xmax],
      yDomain: [ymin, ymax],
      xStep,
      yStep,
      maxCount,
    },
  };
}

function configureScales({ scale, bins }) {
  const { xDomain, yDomain, xStep, yStep, maxCount } = bins.meta;

  scale.x.domain(xDomain);
  scale.y.domain(yDomain);

  const minBand = Math.min(
    scale.x(xDomain[0] + xStep) - scale.x(xDomain[0]),
    scale.y(yDomain[0]) - scale.y(yDomain[0] + yStep),
  );
  const maxRadius = Math.max(minBand / 2.2, 1.5);

  scale.radius.domain([0, maxCount || 1]).range([0, maxRadius]);
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

function appendAxes(plot, layout, scale) {
  const axes = {};

  axes.x = plot
    .append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x).ticks(10));

  const gridY = plot
    .append("g")
    .attr("class", "grid grid-y")
    .call(
      d3
        .axisLeft(scale.y)
        .ticks(10)
        .tickSize(-layout.chart.width)
        .tickFormat(""),
    );
  gridY.selectAll("line").attr("stroke", "#bbb").attr("stroke-opacity", 0.4);

  axes.y = plot
    .append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(scale.y).ticks(10));

  return axes;
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
    .text("IMDB Rating");
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
    .attr("y", layout.margin.left * 0.25)
    .text("Rotten Tomatoes Rating");
}

function appendCircles(plot, cells, scale) {
  return plot
    .append("g")
    .attr("class", "bin-circles")
    .selectAll("circle")
    .data(cells, (d) => `${d.x0}-${d.y0}`)
    .join("circle")
    .attr("class", "bin-circle")
    .attr("cx", (d) => scale.x((d.x0 + d.x1) / 2))
    .attr("cy", (d) => scale.y((d.y0 + d.y1) / 2))
    .attr("r", (d) => scale.radius(d.count))
    .attr("fill", scale.color)
    .attr("stroke", "none")
    .attr("fill-opacity", 0.85);
}

function appendLegend({ chart, layout, scale }) {
  const legend = chart
    .append("g")
    .attr(
      "transform",
      `translate(${layout.margin.left + layout.chart.width + 35}, ${layout.margin.top})`,
    );
  const sampleCounts = [1, 3, 6, 10].filter(
    (count) => count <= scale.radius.domain()[1],
  );

  const rowHeight = 22;

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .text("Count");

  const rows = legend
    .append("g")
    .attr("transform", "translate(0, 10)")
    .selectAll("g")
    .data(sampleCounts)
    .enter()
    .append("g")
    .attr("transform", (_, i) => `translate(0, ${i * rowHeight})`);

  rows
    .append("circle")
    .attr("cx", 10)
    .attr("cy", 0)
    .attr("r", (count) => scale.radius(count))
    .attr("fill", scale.color);

  rows
    .append("text")
    .attr("x", 30)
    .attr("y", 3)
    .attr("font-size", 10)
    .text((count) => count);

  return legend;
}
