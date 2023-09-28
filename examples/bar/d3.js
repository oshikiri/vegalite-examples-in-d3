const margin = { top: 15, right: 20, bottom: 35, left: 40 };
const width = 229 - margin.left - margin.right;
const height = 252 - margin.top - margin.bottom;

const x = d3.scaleBand().range([0, width]).padding(0.1);
const y = d3.scaleLinear().range([height, 0]);

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.json("data.json").then((data) => {
  x.domain(data.map((d) => d.a));
  y.domain([0, 100]);

  svg
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""))
    .call((g) =>
      g
        .selectAll(".tick line")
        .attr("stroke", "grey")
        .attr("stroke-opacity", "0.7")
    );

  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("fill", "steelblue")
    .attr("class", "bar")
    .attr("x", (d) => x(d.a))
    .attr("y", (d) => y(d.b))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.b));

  // axis ticks
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));
  svg.append("g").call(d3.axisLeft(y).ticks(5));

  // axis label
  svg
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .attr("x", width / 2)
    .attr("y", height + margin.top + 15)
    .text("a");
  svg
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2 - 10)
    .attr("y", -margin.left / 2 - 10)
    .text("b");
});
