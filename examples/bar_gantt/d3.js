const svgWidth = 240;
const svgHeight = 102;

const margin = { top: 0, bottom: 35, left: 40, right: 10 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleBand().range([0, height]).padding(0.1);

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);
const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

appendXAxisLabel(chart);
appendYAxisLabel(chart);
appendXGridlines(chart);

d3.json("./data.json").then((data) => {
  xScale.domain([0, d3.max(data, (d) => Math.max(d.start, d.end))]);
  yScale.domain(data.map((d) => d.task));

  appendAxis(chart);
  appendBars(chart, data);
});

function appendXAxisLabel(chart) {
  return chart
    .append("text")
    .attr("class", "x-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", margin.top + height + 0.9 * margin.bottom)
    .text("start, end");
}

function appendYAxisLabel(chart) {
  return chart
    .append("text")
    .attr("class", "y-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -0.7 * margin.left)
    .text("task");
}

function appendXGridlines(chart) {
  return chart
    .append("g")
    .attr("class", "grid")
    .call(d3.axisTop(xScale).ticks(5).tickSize(-height).tickFormat(""))
    .call((g) =>
      g
        .selectAll(".tick line")
        .attr("stroke", "grey")
        .attr("stroke-opacity", "0.5")
    );
}

function appendAxis(chart) {
  const xAxis = chart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5));
  const yAxis = chart
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale));

  return { xAxis, yAxis };
}

function appendBars(chart, data) {
  return chart
    .append("g")
    .attr("class", "bars")
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("fill", "steelblue")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.start))
    .attr("y", (d) => yScale(d.task))
    .attr("width", (d) => xScale(d.end) - xScale(d.start))
    .attr("height", yScale.bandwidth());
}
