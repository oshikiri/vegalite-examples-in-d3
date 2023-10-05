const rootWidth = 296;
const rootHeight = 103;
const margin = { top: 10, right: 130, bottom: 30, left: 60 };
const width = rootWidth - margin.left - margin.right;
const height = rootHeight - margin.top - margin.bottom;

const parseYearMonth = d3.timeParse("%Y-%m");

const xDomain = [3, 4, 5, 6, 8];
const yDomain = ["USA", "Japan", "Europe"];

const xScale = d3.scaleBand().domain(xDomain).range([0, width]);
const yScale = d3.scaleBand().domain(yDomain).range([height, 0]);
const colorScale = d3.scaleSequential(d3.interpolateYlGnBu);

const chart = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", rootWidth)
  .attr("height", rootHeight);

const svg = chart
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xTitle = chart
  .append("text")
  .attr("class", "axis-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("x", margin.left + width / 2)
  .attr("y", margin.top + height + 0.9 * margin.bottom)
  .text("Cylinders");

const yTitle = chart
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -margin.top - height / 2)
  .attr("y", margin.left / 4)
  .text("Origin");

const xTicks = svg
  .append("g")
  .attr("class", "grid")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(xScale).ticks(5));

const yTicks = svg
  .append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(yScale).ticks(5));

d3.json("../../data/cars.json").then((data) => {
  const table = d3.rollups(
    data,
    (g) => d3.mean(g, (d) => d.Horsepower),
    (d) => d.Origin,
    (d) => d.Cylinders
  );

  const horsepowers = [].concat(
    ...table.map((row) => row[1].map((col) => col[1]))
  );

  colorScale.domain(d3.extent(horsepowers));

  svg
    .selectAll(".row")
    .data(table)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", ([origin]) => `translate(0, ${yScale(origin)})`)
    .selectAll(".cell")
    .data(([, d]) => d)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", ([cylinder]) => xScale(cylinder))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("opacity", 0.9)
    .attr("fill", ([, horsepower]) => colorScale(horsepower));

  const legendWidth = 15;
  const colorY = (hp) => 0.75 * (hp - 76);
  const toLegendY = (hp) => margin.top + height - colorY(hp);
  const legend = chart
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + width + 10}, ${margin.top})`);

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "left")
    .attr("x", 0)
    .attr("y", 5)
    .text("Mean of Hoursepower");

  legend
    .selectAll(".legend")
    .data(d3.range(76, 158, 5))
    .enter()
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", 5)
    .attr("fill", (hp) => colorScale(hp))
    .attr("transform", (hp) => `translate(0, ${toLegendY(hp)})`);

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "left")
    .attr("dominant-baseline", "text-top")
    .attr("x", legendWidth + 5)
    .attr("y", toLegendY(76))
    .text("76");

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("text-anchor", "top")
    .attr("dominant-baseline", "hanging")
    .attr("x", legendWidth + 5)
    .attr("y", toLegendY(158))
    .text("158");
});
