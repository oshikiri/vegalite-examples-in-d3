const rootWidth = 258;
const rootHeight = 247;
const margin = {
  top: 20,
  right: 0,
  bottom: 30,
  left: 50,
};
const chartWidth = rootWidth - margin.left - margin.right;
const chartHeight = rootHeight - margin.top - margin.bottom;

const root = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", rootWidth)
  .attr("height", rootHeight);
const chart = root
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);
const xScale = d3.scaleLinear().range([0, chartWidth]);
const yScale = d3.scaleLinear().range([chartHeight, 0]);

const tooltip = d3.select(".tooltip");

d3.json("../../data/movies.json").then((data) => {
  const bins = d3
    .bin()
    .thresholds(10)
    .value((d) => d["IMDB Rating"])(data);

  xScale.domain([bins[0].x0, bins[bins.length - 1].x1]);
  yScale.domain([0, 1000]);

  const yGridLines = chart
    .selectAll("line")
    .data(yScale.ticks(5))
    .join("line")
    .attr("x1", 0)
    .attr("x2", chartWidth)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "grey")
    .attr("stroke-opacity", "0.3");

  const bars = chart
    .append("g")
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("fill", "steelblue")
    .attr("x", (d) => xScale(d.x0) + 1)
    .attr("y", (d) => yScale(d.length))
    .attr("width", (d) => xScale(d.x1) - xScale(d.x0))
    .attr("height", (d) => yScale(0) - yScale(d.length))
    .on("mouseover", (el, d) => {
      d3.select(".data-rating").text(`${d.x0} - ${d.x1}`);
      d3.select(".data-count").text(d.length);
      tooltip.style("visibility", "visible");
    })
    .on("mousemove", (el, d) => {
      tooltip.style("top", `${el.pageY}px`).style("left", `${el.pageX}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  const xAxis = chart
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", margin.bottom)
    .attr("fill", "currentColor")
    .attr("font-weight", "bold")
    .text("IMDB Rating (binned)");

  const yAxis = chart
    .append("g")
    .call(d3.axisLeft(yScale).ticks(chartHeight / 40))
    .append("text")
    .attr("x", -chartHeight / 2)
    .attr("y", -0.7 * margin.left)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-weight", "bold")
    .attr("transform", `rotate(-90)`)
    .text("Count of Records");
});
