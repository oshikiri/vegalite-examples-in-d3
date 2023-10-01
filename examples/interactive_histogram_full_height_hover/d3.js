const width = 258;
const height = 247;
const margin = {
  top: 20,
  right: 0,
  bottom: 30,
  left: 50,
};

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height]);

const tooltip = d3.select(".tooltip");

const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

d3.json("../../data/movies.json").then((data) => {
  const bins = d3
    .bin()
    .thresholds(10)
    .value((d) => d["IMDB Rating"])(data);

  xScale.domain([bins[0].x0, bins[bins.length - 1].x1]);
  yScale.domain([0, 1000]);

  svg
    .append("g")
    .selectAll("line")
    .data(yScale.ticks(5))
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "grey")
    .attr("stroke-opacity", "0.3");

  const g = svg
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

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(width / 80)
        .tickSizeOuter(0)
    )
    .append("text")
    .attr("x", margin.left + (width - margin.left) / 2)
    .attr("y", margin.bottom - 4)
    .attr("fill", "currentColor")
    .attr("font-weight", "bold")
    .text("IMDB Rating (binned)");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(height / 40))
    .append("text")
    .attr("x", -(height - margin.top - margin.bottom) / 2)
    .attr("y", (-2 * margin.left) / 3)
    .attr("font-size", 10)
    .attr("fill", "currentColor")
    .attr("font-weight", "bold")
    .attr("transform", `rotate(-90)`)
    .text("Count of Records");
});
