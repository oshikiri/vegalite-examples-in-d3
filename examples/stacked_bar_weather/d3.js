async function main() {
  const size = {
    root: { width: 380, height: 242 },
    margin: { top: 10, right: 90, bottom: 40, left: 45 },
    chart: {},
  };
  size.chart.width = size.root.width - size.margin.left - size.margin.right;
  size.chart.height = size.root.height - size.margin.top - size.margin.bottom;

  const scale = {
    x: d3.scaleBand(),
    y: d3.scaleLinear(),
    color: d3.scaleOrdinal(),
  };

  const data = await fetchData("../../data/seattle-weather.csv");

  scale.x.domain(d3.range(12)).range([0, size.chart.width]).padding(0.1);
  scale.y.domain([0, 120]).range([size.chart.height, 0]);
  scale.color.range(["#e7ba52", "#9467bd", "#1f77b4", "#c7c7c7", "#aec7e8"]);

  const root = initializeRoot(size);
  appendLabels(root, size);
  appendLegends(root, size, scale);
  const bars = appendBars(root, data, size, scale);
  appendGrids(bars, size, scale);
}

async function fetchData(url) {
  const data = await d3.csv(url);
  const parseMonth = d3.timeParse("%Y-%m-%d");
  const counts = d3.rollups(
    data,
    (g) => g.length,
    (d) => parseMonth(d.date).getMonth(),
    (d) => d.weather
  );
  return counts;
}

function initializeRoot(size) {
  const root = d3
    .select("#graph-d3js")
    .append("svg")
    .attr("width", size.root.width)
    .attr("height", size.root.height);
  return root;
}

function appendLabels(root, size) {
  const margin = size.margin;
  const chartWidth = size.chart.width;
  const chartHeight = size.chart.height;

  const xlabel = root
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + chartWidth / 2)
    .attr("y", margin.top + chartHeight + 0.75 * margin.bottom)
    .text("Month of the year");

  const ylabel = root
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", margin.left / 3)
    .text("Count of Records");

  return { x: xlabel, y: ylabel };
}

function appendBars(root, counts, size, scale) {
  const margin = size.margin;
  const bars = root
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  counts.forEach(([month, d]) => {
    appendBarGroup(bars, month, d, size, scale);
  });

  return bars;
}

function appendBarGroup(bars, month, d, size, scale) {
  d = this.appendCumsum(d.sort().reverse());

  const barGroup = bars.append("g").attr("class", "bar-column");
  barGroup
    .selectAll("rect")
    .data(d)
    .enter()
    .append("rect")
    .attr("fill", (d) => scale.color(d.weather))
    .attr("x", scale.x(month))
    .attr("y", (d) => scale.y(d.cumsum))
    .attr("height", (d) => size.chart.height - scale.y(d.count))
    .attr("width", scale.x.bandwidth());
  return barGroup;
}

function appendCumsum(d) {
  let cumsum = 0;
  return d.map(([weather, count]) => {
    cumsum += count;
    return { weather, count, cumsum };
  });
}

function appendGrids(bars, size, scale) {
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  bars
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${size.chart.height})`)
    .call(d3.axisBottom(scale.x).tickFormat((i) => months[i]));
  bars.append("g").attr("class", "grid").call(d3.axisLeft(scale.y).ticks(6));
}

function appendLegends(root, size, scale) {
  const margin = size.margin;
  const chartWidth = size.chart.width;

  const keys = ["sun", "snow", "rain", "fog", "drizzle"];
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
    .attr("y", (_d, i) => legendPaddingLeft + i * (squareSize + paddingSquares))
    .attr("width", squareSize)
    .attr("height", squareSize)
    .style("fill", (d) => scale.color(d));
  legend
    .selectAll("legend-labels")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", 20 + squareSize * 1.2)
    .attr(
      "y",
      (_d, i) => legendPaddingLeft + i * (squareSize + paddingSquares) + 3
    )
    .text((d) => d)
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

  return legend;
}

main();
