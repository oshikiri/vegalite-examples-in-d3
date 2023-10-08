const svgWidth = 258;
const svgHeight = 247;
const marginTop = 20;
const marginRight = 0;
const marginBottom = 30;
const marginLeft = 50;

const width = svgWidth - marginLeft - marginRight;
const height = svgHeight - marginTop - marginBottom;

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg
  .append("g")
  .attr("transform", `translate(${marginLeft}, ${marginTop})`);

svg
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("x", marginLeft + width / 2)
  .attr("y", marginTop + height + 0.9 * marginBottom)
  .text("IMDB Rating (binned)");

svg
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("transform", `rotate(-90)`)
  .attr("x", -marginTop - height / 2)
  .attr("y", 0.3 * marginLeft)
  .text("Count of Records");

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

d3.json("../../data/movies.json").then((data) => {
  const bins = d3
    .bin()
    .thresholds(10)
    .value((d) => d["IMDB Rating"])(data);

  xScale.domain([0, 10]);
  yScale.domain([0, 1000]);

  appendXAxis(chart);
  appendYAxis(chart);
  appendBars(chart, bins);
});

function appendXAxis(chart) {
  return chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickFormat(d3.format(".1f"))
        .tickValues(d3.range(1, 10, 2))
    );
}
function appendYAxis(chart) {
  chart
    .append("g")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
    .style("stroke-opacity", 0.3);
  return chart.append("g").call(d3.axisLeft(yScale).ticks(5));
}

function appendBars(chart, bins) {
  return chart
    .append("g")
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("fill", "steelblue")
    .attr("x", (d) => xScale(d.x0))
    .attr("y", (d) => yScale(d.length))
    .attr("width", (d) => xScale(d.x1) - xScale(d.x0))
    .attr("height", (d) => height - yScale(d.length));
}
