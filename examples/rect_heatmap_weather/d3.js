main();

async function main() {
  const size = {
    svg: {
      width: 502,
      height: 215,
    },
    margin: { top: 20, right: 50, bottom: 40, left: 45 },
    chart: {},
  };
  size.chart.width = size.svg.width - size.margin.left - size.margin.right;
  size.chart.height = size.svg.height - size.margin.top - size.margin.bottom;

  const scale = {
    x: d3.scaleBand().range([0, size.chart.width]).domain(d3.range(1, 32)),
    y: d3.scaleBand().range([0, size.chart.height]).domain(d3.range(0, 12)),
    color: d3.scaleSequential(d3.interpolateYlGnBu),
  };

  const data = await d3.csv("../../data/seattle-weather.csv");
  const table = createDataset(data);
  console.log(table);

  scale.color.domain(d3.extent(table, (d) => d.tempMax));

  const svg = createSvg(size.svg);
  const chart = appendChart(svg, size.margin);
  appendAxisLabels(svg, size);
  appendAxis(chart, size, scale);
  appendHeatmap(chart, table, scale);
  appendLegend(svg, size, scale);
}

function createSvg(sizeSvg) {
  return d3
    .select("#graph-d3js")
    .append("svg")
    .attr("width", sizeSvg.width)
    .attr("height", sizeSvg.height);
}

function appendChart(svg, margin) {
  return svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
}

function appendAxisLabels(svg, size) {
  const margin = size.margin;
  const width = size.chart.width;
  const height = size.chart.height;
  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 13)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + width / 2)
    .attr("y", margin.top * 0.5)
    .text("Daily Max Temperatures (C) in Seattle, WA");

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + width / 2)
    .attr("y", margin.top + height + 0.75 * margin.bottom)
    .text("Day");

  svg
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -margin.top - height / 2)
    .attr("y", margin.left / 3)
    .text("Month");
}

function appendAxis(plot, size, scale) {
  plot
    .append("g")
    .attr("transform", `translate(0, ${size.chart.height})`)
    .call(d3.axisBottom(scale.x).tickSizeOuter(0))
    .attr("stroke-width", 0);

  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

  plot.append("g").call(
    d3
      .axisLeft(scale.y)
      .tickSizeOuter(0)
      .tickFormat((d) => months[d])
  );
}

function appendHeatmap(plot, table, scale) {
  const svgGroups = plot
    .selectAll("rect")
    .data(table)
    .enter()
    .append("rect")
    .attr("x", (d) => scale.x(d.day))
    .attr("y", (d) => scale.y(d.month))
    .attr("height", scale.y.bandwidth())
    .attr("width", scale.x.bandwidth())
    .attr("stroke", (d) => scale.color(d.tempMax))
    .attr("fill", (d) => scale.color(d.tempMax));
  return svgGroups;
}

function appendLegend(svg, size, scale) {
  const margin = size.margin;
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${margin.left + size.chart.width + 10}, ${margin.top})`
    );
  legend
    .selectAll(".legend")
    .data(d3.range(5, 37))
    .enter()
    .append("rect")
    .attr("width", 15)
    .attr("height", 5)
    .attr("fill", (d) => scale.color(d))
    .attr("transform", (d) => `translate(0, ${5 * (36 - d)})`);
  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "left")
    .attr("x", 20)
    .attr("y", 10)
    .text("36");
  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "left")
    .attr("x", 20)
    .attr("y", 5 * (36 - 5))
    .text("5");
}

function createDataset(data) {
  const parseDate = d3.timeParse("%Y-%m-%d");
  data.forEach((d) => {
    d.date = parseDate(d.date);
    d.temp_max = +d.temp_max;
  });

  const table = d3.rollups(
    data,
    (g) => d3.max(g, (d) => d.temp_max),
    (d) => d.date.getDate(),
    (d) => d.date.getMonth()
  );
  const flattened = [];
  for (const row of table) {
    const day = row[0];
    const m = row[1];
    for (const col of m) {
      const month = col[0];
      const tempMax = col[1];
      flattened.push({ month, day, tempMax });
    }
  }
  return flattened;
}
