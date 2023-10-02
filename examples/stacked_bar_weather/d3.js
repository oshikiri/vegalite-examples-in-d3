const keys = ["sun", "snow", "rain", "fog", "drizzle"];
const colors = ["#e7ba52", "#9467bd", "#1f77b4", "#c7c7c7", "#aec7e8"];

const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

const margin = { top: 10, right: 90, bottom: 40, left: 45 };
const width = 380 - margin.left - margin.right;
const height = 242 - margin.top - margin.bottom;

const parseMonth = d3.timeParse("%Y-%m-%d");

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", chartWidth + margin.left + margin.right)
  .attr("height", chartHeight + margin.top + margin.bottom);

root
  .append("text")
  .attr("class", "axis-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("x", margin.left + chartWidth / 2)
  .attr("y", margin.top + chartHeight + 0.75 * margin.bottom)
  .text("Month of the year");

root
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -chartHeight / 2)
  .attr("y", margin.left / 3)
  .text("Count of Records");

const xScale = d3.scaleBand().range([0, chartWidth]).padding(0.1);
const yScale = d3.scaleLinear().range([chartHeight, 0]);
const colorScale = d3.scaleOrdinal().range(colors);

const stack = d3.stack().keys(keys);

d3.csv("../../data/seattle-weather.csv").then((data) => {
  xScale.domain(months);
  yScale.domain([0, 120]);

  const flatten = createDataset(data);
  const series = stack(flatten);

  const bars = root
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const svgGroups = bars
    .selectAll("g")
    .data(series)
    .enter()
    .append("g")
    .style("fill", (d, i) => colorScale(i));

  svgGroups
    .selectAll("rect")
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (_d, i) => xScale(months[i]))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
    .attr("width", xScale.bandwidth());

  bars
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(xScale));
  bars.append("g").attr("class", "grid").call(d3.axisLeft(yScale).ticks(6));

  const squareSize = 10;
  const paddingSquares = 3;
  const legendPaddingLeft = 15;
  const legend = root
    .append("g")
    .attr("transform", `translate(${margin.left + chartWidth}, 0)`);
  legend
    .selectAll("legend-square")
    .data(keys)
    .enter()
    .append("rect")
    .attr("x", margin.right / 5)
    .attr("y", (d, i) => legendPaddingLeft + i * (squareSize + paddingSquares))
    .attr("width", squareSize)
    .attr("height", squareSize)
    .style("fill", (d, i) => colors[i]);
  legend
    .selectAll("legend-labels")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", 20 + squareSize * 1.2)
    .attr(
      "y",
      (d, i) => legendPaddingLeft + i * (squareSize + paddingSquares) + 3
    )
    .text((d, i) => keys[i])
    .attr("text-anchor", "left")
    .attr("font-size", squareSize)
    .style("alignment-baseline", "central");

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "left")
    .attr("x", legendPaddingLeft)
    .attr("y", 10)
    .text("Weather type");
});

function createDataset(data) {
  const counts = d3.rollups(
    data,
    (g) => g.length,
    (d) => parseMonth(d.date).getMonth(),
    (d) => d.weather
  );
  const flatten = counts.map(([m, weathers], i) => {
    const r = { month: months[m] };
    for (const k of keys) {
      r[k] = 0;
    }
    for (const [w, count] of weathers) {
      r[w] = count;
    }
    return r;
  });
  return flatten;
}
