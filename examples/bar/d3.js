const svgWidth = 229;
const svgHeight = 252;

const margin = { top: 15, right: 20, bottom: 35, left: 40 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const xScale = d3.scaleBand().range([0, width]).padding(0.1);
const yScale = d3.scaleLinear().range([height, 0]);

const chart = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

chart
  .append("text")
  .attr("class", "x-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("x", width / 2)
  .attr("y", height + margin.top + 15)
  .text("a");
chart
  .append("text")
  .attr("class", "y-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -0.7 * margin.left)
  .text("b");
chart
  .append("g")
  .attr("class", "grid")
  .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
  .call((g) =>
    g
      .selectAll(".tick line")
      .attr("stroke", "grey")
      .attr("stroke-opacity", "0.5")
  );

d3.json("data.json").then((data) => {
  xScale.domain(data.map((d) => d.a));
  yScale.domain([0, 100]);

  chart
    .append("g")
    .attr("class", "bars")
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("fill", "steelblue")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.a))
    .attr("y", (d) => yScale(d.b))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - yScale(d.b));

  chart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));
  chart.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale).ticks(5));
});
