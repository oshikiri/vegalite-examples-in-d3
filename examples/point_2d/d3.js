const margin = { top: 10, right: 10, bottom: 40, left: 40 };
const width = 244 - margin.left - margin.right;
const height = 252 - margin.top - margin.bottom;

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const xScale = d3.scaleLinear().domain([0, 250]).range([0, width]);
svg
  .append("g")
  .attr("class", "grid")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(xScale).ticks(5).tickSize(-height));
svg
  .append("text")
  .attr("class", "axis-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("x", margin.left + width / 2)
  .attr("y", margin.top + height + margin.bottom / 2)
  .text("Horsepower");

const yScale = d3.scaleLinear().domain([0, 50]).range([height, 0]);
svg
  .append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(yScale).ticks(5).tickSize(-width));
svg
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2 + margin.left)
  .attr("y", -margin.left / 2)
  .text("Miles_per_Gallon");

d3.json("/data/cars.json").then((data) => {
  svg
    .append("g")
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.Horsepower))
    .attr("cy", (d) => yScale(d.Miles_per_Gallon))
    .attr("r", 3);
});
