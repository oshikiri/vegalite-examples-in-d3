render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const data = await loadHistogramData();
  const bins = createBins(data);
  configureScales(scale, bins);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const labels = appendAxisLabels(chart, layout);
  const axes = appendAxes(plot, layout, scale);
  const grid = appendGridlines(plot, layout, scale);

  const tooltip = d3.select(".tooltip");
  const marks = appendBars({ plot, bins, scale, tooltip });

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels,
      axes,
      grid,
      marks: { bars: marks },
      tooltip,
    },
  };
}

function createLayout() {
  const layout = {
    root: { width: 258, height: 247 },
    margin: { top: 20, right: 0, bottom: 30, left: 50 },
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
    y: d3.scaleLinear().range([layout.chart.height, 0]),
  };
}

async function loadHistogramData() {
  return d3.json("../../data/movies.json");
}

function createBins(data) {
  return d3
    .bin()
    .thresholds(10)
    .value((d) => d["IMDB Rating"])(data);
}

function configureScales(scale, bins) {
  scale.x.domain([bins[0].x0, bins[bins.length - 1].x1]);
  scale.y.domain([0, d3.max(bins, (d) => d.length) ?? 0]);
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
    .text("IMDB Rating (binned)");
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
    .text("Count of Records");
}

function appendAxes(plot, layout, scale) {
  return {
    x: plot
      .append("g")
      .attr("transform", `translate(0, ${layout.chart.height})`)
      .call(d3.axisBottom(scale.x).ticks(5)),
    y: plot
      .append("g")
      .call(d3.axisLeft(scale.y).ticks(layout.chart.height / 40)),
  };
}

function appendGridlines(plot, layout, scale) {
  return plot
    .append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(scale.y.ticks(5))
    .join("line")
    .attr("x1", 0)
    .attr("x2", layout.chart.width)
    .attr("y1", (value) => scale.y(value))
    .attr("y2", (value) => scale.y(value))
    .attr("stroke", "grey")
    .attr("stroke-opacity", 0.3);
}

function appendBars({ plot, bins, scale, tooltip }) {
  return plot
    .append("g")
    .attr("class", "bars")
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("fill", "steelblue")
    .attr("x", (d) => scale.x(d.x0) + 1)
    .attr("y", (d) => scale.y(d.length))
    .attr("width", (d) => scale.x(d.x1) - scale.x(d.x0))
    .attr("height", (d) => scale.y(0) - scale.y(d.length))
    .on("mouseover", (event, d) => {
      tooltip.select(".data-rating").text(`${d.x0} - ${d.x1}`);
      tooltip.select(".data-count").text(d.length);
      tooltip.style("visibility", "visible");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", `${event.pageY}px`)
        .style("left", `${event.pageX}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });
}
