const svgWidth = 372;
const svgHeight = 242;

const margin = { top: 10, right: 10, bottom: 40, left: 60 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const parseYearMonth = d3.timeParse("%Y-%m");

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

appendAxisLabel(svg)
  .attr("x", margin.left + width / 2)
  .attr("y", margin.top + height + margin.bottom / 2)
  .text("date");

appendAxisLabel(svg)
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", margin.left / 2)
  .text("count");

const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

d3.json("../../data/unemployment-across-industries.json").then((data) => {
  const aggregated = d3
    .rollups(
      data,
      (group) => d3.sum(group, (d) => d.count),
      (d) => parseYearMonth(`${d.year}-${d.month}`)
    )
    .map(([k, v]) => ({ date: k, count: v }));

  xScale.domain(d3.extent(aggregated.map((d) => d.date)));
  yScale.domain([0, 16000]);

  appendYAxis(chart);
  appendXAxis(chart);
  appendArea(chart, aggregated);
});

function appendAxisLabel(svg) {
  return svg
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end");
}

function appendYAxis(chart) {
  return chart
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-height));
}

function appendXAxis(chart) {
  return chart
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width));
}

function appendArea(chart, aggregated) {
  const valueline = d3
    .area()
    .x((d) => xScale(d.date))
    .y0(height)
    .y1((d) => yScale(d.count));
  return chart
    .append("path")
    .datum(aggregated)
    .attr("class", "line")
    .attr("d", valueline);
}
