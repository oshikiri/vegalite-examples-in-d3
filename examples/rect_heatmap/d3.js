const margin = { top: 10, right: 130, bottom: 40, left: 60 };
const width = 296 - margin.left - margin.right;
const height = 103 - margin.top - margin.bottom;

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
  .text("Cylinders");

chart
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", margin.left / 4)
  .text("Origin");

d3.json("/data/cars.json").then((data) => {
  const table = d3.rollups(
    data,
    (g) => d3.mean(g, (d) => d.Horsepower),
    (d) => d.Origin,
    (d) => d.Cylinders
  );
  const xScale = d3.scaleLinear().domain([3, 9]).range([0, width]);
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-height));

  const yScale = d3
    .scaleBand()
    .domain(
      data
        .map((d) => d.Origin)
        .sort()
        .reverse()
    )
    .range([height, 0]);
  svg
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-width));

  const horsepowers = [].concat(
    ...table.map((row) => row[1].map((col) => col[1]))
  );

  const colorScale = d3
    .scaleSequential((t) => d3.interpolate("lightgreen", "midnightblue")(t))
    .domain(d3.extent(horsepowers));

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
    .attr("width", xScale(1) - xScale(0))
    .attr("height", yScale.bandwidth())
    .attr("opacity", 0.9)
    .attr("fill", ([, horsepower]) => colorScale(horsepower));

  const colorY = (hp) => height - (hp - 70) / 2;
  const legend = chart
    .append("g")
    .attr("class", "legend")
    .selectAll(".legend")
    .data(d3.ticks(70, 160, 10))
    .enter()
    .append("rect")
    .attr("width", 15)
    .attr("height", 5)
    .attr("fill", (hp) => colorScale(hp))
    .attr(
      "transform",
      (hp) => `translate(${margin.left + width + 10}, ${colorY(hp)})`
    );

  console.log(legend);
});
