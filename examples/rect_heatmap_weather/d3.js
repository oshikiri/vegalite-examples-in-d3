const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

const margin = { top: 20, right: 50, bottom: 40, left: 45 };
const width = 502 - margin.left - margin.right;
const height = 215 - margin.top - margin.bottom;

const parseMonth = d3.timeParse("%Y-%m-%d");

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

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

const xScale = d3.scaleBand().range([0, width]).domain(d3.range(1, 32));
const yScale = d3.scaleBand().range([0, height]).domain(months);
const colorScale = d3.scaleSequential(d3.interpolateYlGnBu);

const parseDate = d3.timeParse("%Y-%m-%d");

d3.csv("../../data/seattle-weather.csv").then((data) => {
  data.forEach((d) => {
    d.date = parseDate(d.date);
    d.temp_max = +d.temp_max;
  });

  const table = createDataset(data);
  console.log(table);

  colorScale.domain(d3.extent(table, (d) => d.tempMax));

  const plot = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  plot
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0))
    .attr("stroke-width", 0);

  plot.append("g").call(d3.axisLeft(yScale).tickSizeOuter(0));

  const svgGroups = plot
    .selectAll("rect")
    .data(table)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.day))
    .attr("y", (d) => yScale(months[d.month]))
    .attr("height", yScale.bandwidth())
    .attr("width", xScale.bandwidth())
    .attr("stroke", (d) => colorScale(d.tempMax))
    .attr("fill", (d) => colorScale(d.tempMax));

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + width + 10}, ${margin.top})`);
  legend
    .selectAll(".legend")
    .data(d3.range(5, 37))
    .enter()
    .append("rect")
    .attr("width", 15)
    .attr("height", 5)
    .attr("fill", (d) => colorScale(d))
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
});

function createDataset(data) {
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
