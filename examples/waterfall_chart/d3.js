render();

async function render() {
  const layout = createLayout();
  const { scale, data, connectors } = createScaleAndData({ layout });

  const chart = appendChartRoot(layout);
  const plot = appendPlotGroup(chart, layout);

  configureAxes(plot, layout, scale);
  appendBars(plot, data, scale);
  appendConnectors(plot, connectors, scale);
  appendSumLabels(plot, data, scale);
  appendAmountLabels(plot, data, scale);

  appendAxisLabels(chart, layout);

  return {
    layout,
    scale,
    references: {
      containers: { chart, plot },
      labels: {
        axis: {
          x: chart.select(".x-axis-label"),
          y: chart.select(".y-axis-label"),
        },
        totals: plot.selectAll(".sum-label"),
        deltas: plot.selectAll(".amount-label"),
      },
      marks: {
        bars: plot.selectAll(".bar"),
        connectors: plot.selectAll(".connector"),
      },
    },
  };
}

function createLayout() {
  const margin = { top: 30, right: 40, bottom: 50, left: 80 };
  const chart = { width: 800, height: 450 };
  return {
    root: {
      width: chart.width + margin.left + margin.right,
      height: chart.height + margin.top + margin.bottom,
    },
    margin,
    chart,
  };
}

function createScaleAndData({ layout }) {
  const rawData = [
    { label: "Begin", amount: 4000 },
    { label: "Jan", amount: 1707 },
    { label: "Feb", amount: -1425 },
    { label: "Mar", amount: -1030 },
    { label: "Apr", amount: 1812 },
    { label: "May", amount: -1067 },
    { label: "Jun", amount: -1481 },
    { label: "Jul", amount: 1228 },
    { label: "Aug", amount: 1176 },
    { label: "Sep", amount: 1146 },
    { label: "Oct", amount: 1205 },
    { label: "Nov", amount: -1388 },
    { label: "Dec", amount: 1492 },
    { label: "End", amount: 0 },
  ];

  let cumulative = 0;
  const data = rawData.map((entry) => {
    cumulative += entry.amount;
    const sum = cumulative;
    const previousSum = entry.label === "End" ? 0 : sum - entry.amount;
    const displayAmount = entry.label === "End" ? sum : entry.amount;
    const textAmount =
      entry.label !== "Begin" && entry.label !== "End"
        ? `${displayAmount > 0 ? "+" : ""}${displayAmount}`
        : `${displayAmount}`;
    const center = (sum + previousSum) / 2;
    return {
      ...entry,
      sum,
      previousSum,
      displayAmount,
      textAmount,
      center,
    };
  });

  const connectors = data.slice(0, -1).map((entry, index) => ({
    from: entry.label,
    to: data[index + 1].label,
    sum: entry.sum,
  }));

  const labels = data.map((entry) => entry.label);
  const x = d3
    .scalePoint()
    .domain(labels)
    .range([0, layout.chart.width])
    .padding(0.35);

  const yMin =
    d3.min(data, (entry) => Math.min(entry.sum, entry.previousSum)) ?? 0;
  const yMax =
    d3.max(data, (entry) => Math.max(entry.sum, entry.previousSum)) ?? 0;
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([layout.chart.height, 0]);

  const barWidth = 45;
  const colorScale = (entry) => {
    if (entry.label === "Begin" || entry.label === "End") {
      return "#f7e0b6";
    }
    return entry.sum < entry.previousSum ? "#f78a64" : "#93c4aa";
  };

  return {
    scale: { x, y, barWidth, color: colorScale },
    data,
    connectors,
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

function configureAxes(plot, layout, scale) {
  const axisX = plot
    .append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${layout.chart.height})`)
    .call(d3.axisBottom(scale.x));
  axisX.selectAll("text").attr("font-size", 10).style("text-anchor", "middle");

  const axisY = plot
    .append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(scale.y));
  axisY.selectAll("text").attr("font-size", 10);
}

function appendBars(plot, data, scale) {
  plot
    .append("g")
    .attr("class", "bars")
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => (scale.x(d.label) ?? 0) - scale.barWidth / 2)
    .attr("width", scale.barWidth)
    .attr("y", (d) => scale.y(Math.max(d.sum, d.previousSum)))
    .attr("height", (d) => Math.abs(scale.y(d.sum) - scale.y(d.previousSum)))
    .attr("fill", (d) => scale.color(d))
    .attr("stroke", "none");
}

function appendConnectors(plot, connectors, scale) {
  plot
    .append("g")
    .attr("class", "connectors")
    .selectAll("line")
    .data(connectors)
    .enter()
    .append("line")
    .attr("class", "connector")
    .attr("x1", (d) => (scale.x(d.from) ?? 0) - scale.barWidth / 2)
    .attr("x2", (d) => (scale.x(d.to) ?? 0) + scale.barWidth / 2)
    .attr("y1", (d) => scale.y(d.sum))
    .attr("y2", (d) => scale.y(d.sum))
    .attr("stroke", "#404040")
    .attr("stroke-width", 2);
}

function appendSumLabels(plot, data, scale) {
  plot
    .append("g")
    .attr("class", "sum-labels")
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "sum-label")
    .attr("x", (d) => scale.x(d.label) ?? 0)
    .attr("y", (d) => (scale.y(d.sum) ?? 0) + (d.displayAmount >= 0 ? -6 : 14))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", (d) =>
      d.displayAmount >= 0 ? "baseline" : "hanging",
    )
    .attr("font-size", 10)
    .text((d) => `${d.sum}`);
}

function appendAmountLabels(plot, data, scale) {
  plot
    .append("g")
    .attr("class", "amount-labels")
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "amount-label")
    .attr("x", (d) => scale.x(d.label) ?? 0)
    .attr("y", (d) => scale.y(d.center))
    .attr("text-anchor", "middle")
    .attr("fill", (d) =>
      d.label === "Begin" || d.label === "End" ? "#725a30" : "white",
    )
    .attr("font-size", 10)
    .text((d) => d.textAmount);
}

function appendAxisLabels(chart, layout) {
  chart
    .append("text")
    .attr("class", "x-axis-label")
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", layout.margin.left + layout.chart.width / 2)
    .attr(
      "y",
      layout.margin.top + layout.chart.height + layout.margin.bottom - 5,
    )
    .text("Months");

  chart
    .append("text")
    .attr("class", "y-axis-label")
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr(
      "transform",
      `translate(${layout.margin.left - 50}, ${layout.margin.top + layout.chart.height / 2}) rotate(-90)`,
    )
    .text("Amount");
}
