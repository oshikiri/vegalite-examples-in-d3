const dayOfWeeks = "Sun Mon Tue Wed Thu Fri Sat".split(" ");

const svgWidth = 623;
const svgHeight = 182;
const margin = {
  top: 20,
  right: 90,
  bottom: 30,
  left: 50,
};
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);
const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xLabel = svg
  .append("text")
  .attr("class", "axis-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("x", margin.left + 0.5 * width)
  .attr("y", margin.top + height + margin.bottom)
  .text("time (hours)");
const yLabel = svg
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -margin.top - height / 2)
  .attr("y", margin.left / 3)
  .text("time (day)");

const xScale = d3.scaleBand().range([0, width]).domain(d3.range(0, 24));
const yScale = d3
  .scaleBand()
  .range([0, height])
  .domain(dayOfWeeks.slice(1).concat([dayOfWeeks[0]]));
const radiusScale = d3.scaleSqrt().range([3, 10]);

const parseTime = d3.timeParse("%Y/%m/%d %H:%M:%S");

d3.csv("../../data/github.csv").then((data) => {
  data = data.map(preprocessData);
  console.log(data[0]);

  radiusScale.domain(d3.extent(data, (d) => d.count));

  appendLegend(svg);
  appendCircles(chart, data);
  appendXAxis(chart);
  appendYAxis(chart);
});

function preprocessData(d) {
  d.time = parseTime(d.time);
  d.hour = d.time.getHours();
  d.dayOfWeek = dayOfWeeks[d.time.getDay()];
  d.count = +d.count;
  return d;
}

function appendCircles(chart, data) {
  return chart
    .append("g")
    .attr("class", "circles")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(d.hour) + xScale.bandwidth() / 2)
    .attr("cy", (d) => yScale(d.dayOfWeek) + yScale.bandwidth() / 2)
    .attr("r", (d) => radiusScale(d.count))
    .attr("fill", "steelblue");
}

function appendXAxis(chart) {
  return chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickValues(xScale.domain().filter((_d, i) => i % 2 == 0))
        .tickFormat((d) => d + ":00")
    );
}

function appendYAxis(chart) {
  return chart.append("g").call(d3.axisLeft(yScale));
}
function appendLegend(svg) {
  const legendData = [10, 20, 30, 40, 50];

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + width + 15}, ${margin.top})`);

  const legendTitle = legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 10)
    .text("Sum of count");

  const legendCircles = legend
    .append("g")
    .attr("class", "legend-circles")
    .selectAll("circles")
    .data(legendData)
    .enter()
    .append("circle")
    .attr("cx", 10)
    .attr("cy", (_d, i) => 20 + 20 * i)
    .attr("r", (d) => radiusScale(d))
    .attr("fill", "steelblue");

  const legendLabels = legend
    .append("g")
    .attr("class", "legend-labels")
    .selectAll("legend-labels")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 25)
    .attr("y", (_d, i) => 20 + 20 * i)
    .text((d) => d)
    .attr("alignment-baseline", "middle")
    .attr("font-size", 10);

  return {
    legend,
    legendTitle,
    legendLabels,
    legendCircles,
  };
}
