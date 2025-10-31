render();

async function render() {
  const layout = createLayout();
  const scale = createScale(layout);

  const dataset = createDataset();
  configureScales(scale, dataset);
  const series = computeRadialSeries(dataset);

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  const arcGenerator = createArcGenerator(layout, scale);
  const segments = appendRadialSegments(plot, series, arcGenerator, scale);
  const labels = appendValueLabels(plot, series, scale, layout);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      marks: { segments, labels },
    },
  };
}

function createLayout() {
  const root = { width: 360, height: 360 };
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const chart = {
    width: root.width - margin.left - margin.right,
    height: root.height - margin.top - margin.bottom,
  };
  const radius = Math.min(chart.width, chart.height) / 2;
  const innerRadius = 20;
  const labelOffset = 10;

  return {
    root,
    margin,
    chart,
    radius,
    innerRadius,
    labelOffset,
  };
}

function createScale(layout) {
  return {
    radius: d3.scaleSqrt().range([layout.innerRadius, layout.radius]),
    color: d3.scaleOrdinal(d3.schemeCategory10),
  };
}

function createDataset() {
  const values = [12, 23, 47, 6, 52, 19];
  return values
    .map((value, index) => ({
      key: `segment-${index}`,
      value,
    }))
    .sort((a, b) => d3.ascending(a.value, b.value));
}

function configureScales(scale, dataset) {
  const maxValue = d3.max(dataset, (d) => d.value) ?? 1;
  scale.radius.domain([0, maxValue]);

  const domain = dataset.map((d) => d.value);
  scale.color.domain(domain).range(d3.schemeCategory10.slice(0, domain.length));
}

function computeRadialSeries(dataset) {
  return d3
    .pie()
    .sort(null)
    .value((d) => d.value)(dataset);
}

function appendChartRoot(layout) {
  return d3
    .select("#graph-d3js")
    .append("svg")
    .attr("width", layout.root.width)
    .attr("height", layout.root.height);
}

function appendPlotGroup(chart, layout) {
  const translateX = layout.margin.left + layout.chart.width / 2;
  const translateY = layout.margin.top + layout.chart.height / 2;
  return chart
    .append("g")
    .attr("transform", `translate(${translateX}, ${translateY})`);
}

function createArcGenerator(layout, scale) {
  return d3
    .arc()
    .innerRadius(layout.innerRadius)
    .outerRadius((arc) => scale.radius(arc.data.value));
}

function appendRadialSegments(plot, series, arcGenerator, scale) {
  return plot
    .append("g")
    .attr("class", "radial-segments")
    .selectAll("path")
    .data(series, (d) => d.data.key)
    .join("path")
    .attr("class", "radial-segment")
    .attr("fill", (d) => scale.color(d.data.value))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .attr("d", arcGenerator);
}

function appendValueLabels(plot, series, scale, layout) {
  return plot
    .append("g")
    .attr("class", "radial-labels")
    .selectAll("text")
    .data(series, (d) => d.data.key)
    .join("text")
    .attr("class", "radial-label")
    .attr("x", (arc) => computeLabelPosition(arc, scale, layout.labelOffset).x)
    .attr("y", (arc) => computeLabelPosition(arc, scale, layout.labelOffset).y)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 10)
    .attr("fill", (arc) => scale.color(arc.data.value))
    .text((arc) => arc.data.value);
}

function computeLabelPosition(arc, scale, offset) {
  const angle = (arc.startAngle + arc.endAngle) / 2;
  const radius = scale.radius(arc.data.value) + offset;
  const x = Math.sin(angle) * radius;
  const y = -Math.cos(angle) * radius;
  return { x, y };
}
