const margin = { top: 10, right: 10, bottom: 40, left: 40 };
const width = 244 - margin.left - margin.right;
const height = 252 - margin.top - margin.bottom;

const parseTime = d3.timeParse("%b %d %Y");

const chart = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const svg = chart
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

chart
  .append("text")
  .attr("class", "axis-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("x", margin.left + width / 2)
  .attr("y", margin.top + height + margin.bottom / 2)
  .text("date");

chart
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", margin.left / 2)
  .text("price");

d3.csv("../../data/stocks.csv").then((data) => {
  data = data
    .filter((d) => d.symbol == "GOOG")
    .map(function (d) {
      d.date = parseTime(d.date);
      return d;
    });

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data.map((d) => d.date)))
    .range([0, width]);
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-height));

  const yScale = d3.scaleLinear().domain([0, 800]).range([height, 0]);
  svg
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width));

  const valueline = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.price));
  svg.append("path").datum(data).attr("class", "line").attr("d", valueline);
});
