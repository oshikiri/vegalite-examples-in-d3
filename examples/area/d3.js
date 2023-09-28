const margin = { top: 10, right: 10, bottom: 40, left: 60 };
const width = 372 - margin.left - margin.right;
const height = 242 - margin.top - margin.bottom;

const parseYearMonth = d3.timeParse("%Y-%m");

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
  .text("count");

d3.json("/data/unemployment-across-industries.json").then((data) => {
  const aggregated = d3
    .rollups(
      data,
      (group) => d3.sum(group, (d) => d.count),
      (d) => parseYearMonth(`${d.year}-${d.month}`)
    )
    .map(([k, v]) => ({ date: k, count: v }));

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(aggregated.map((d) => d.date)))
    .range([0, width]);
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-height));

  const yScale = d3.scaleLinear().domain([0, 16000]).range([height, 0]);
  svg
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width));

  const valueline = d3
    .area()
    .x((d) => xScale(d.date))
    .y0(height)
    .y1((d) => yScale(d.count));
  svg
    .append("path")
    .datum(aggregated)
    .attr("class", "line")
    .attr("d", valueline);
});
