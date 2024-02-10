const colors = "steelblue orange red lightblue green".split(" ");
const symbols = "AAPL AMZN GOOG IBM MSFT".split(" ");

const margin = { top: 20, right: 70, bottom: 40, left: 45 };
const width = 314 - margin.left - margin.right;
const height = 245 - margin.top - margin.bottom;

const parseMonth = d3.timeParse("%Y-%m-%d");

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

appendLabelX(svg, width, height, margin);
appendLabelY(svg, height, margin);

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const symbolScale = d3.scaleOrdinal().range(colors).domain(symbols);

const parseDate = d3.timeParse("%b %d %Y");

const chart = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

xScale.domain([2000, 2010]);
yScale.domain([0, 550]);

appendAxisX(chart, xScale, height);
appendAxisY(chart, yScale, width);

const line = d3
  .line()
  .x(([y, _p]) => xScale(y))
  .y(([_y, p]) => yScale(p));

d3.csv("../../data/stocks.csv").then((data) => {
  const table = preprocess(data);
  console.log(table);

  table.forEach(([symbol, data]) => {
    console.log(data);
    appendLine(chart, data, xScale, yScale, symbolScale(symbol), line);
  });

  appendLegend(svg, margin, width, height);
});

function preprocess(data) {
  data.forEach((d) => {
    d.date = parseDate(d.date);
    d.year = d.date.getFullYear();
    d.price = +d.price;
  });
  console.log(data);

  const table = d3.rollups(
    data,
    (g) => d3.mean(g, (d) => d.price),
    (d) => d.symbol,
    (d) => d.year
  );

  return table;
}

function appendLabelX(parent, width, height, margin) {
  return parent
    .append("text")
    .attr("class", "axis-label")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + width / 2)
    .attr("y", margin.top + height + 0.75 * margin.bottom)
    .text("date (year)");
}

function appendLabelY(parent, height, margin) {
  return parent
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -margin.top - height / 2)
    .attr("y", margin.left / 3)
    .text("Mean of price");
}

function appendAxisX(parent, xScale, height) {
  const axisRoot = parent.append("g");
  axisRoot
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d")));
  axisRoot
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .attr("opacity", "0.7")
    .attr("stroke-width", 0.2)
    .call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat(""));
  return axisRoot;
}

function appendAxisY(parent, yScale, width) {
  const axisRoot = parent.append("g");
  axisRoot.append("g").call(d3.axisLeft(yScale).ticks(5));
  axisRoot
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${width}, 0)`)
    .attr("opacity", "0.7")
    .attr("stroke-width", 0.2)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(width).tickFormat(""));
  return axisRoot;
}

function appendLine(parent, data, xScale, yScale, color, line) {
  const lineElement = parent.append("g");

  lineElement
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("fill", color)
    .attr("cx", ([year, _price]) => xScale(year))
    .attr("cy", ([_year, price]) => yScale(price))
    .attr("r", (_d) => 3);
  lineElement
    .append("path")
    .attr("class", "line")
    .attr("d", line(data))
    .style("fill", "none")
    .style("stroke", color)
    .style("stroke-width", 2);

  return lineElement;
}

function appendLegend(svg, margin, width, height) {
  const squareSize = 10;
  const paddingSquares = 3;
  const legendPaddingLeft = 15;
  const radius = 6;
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + width}, ${margin.top})`);
  legend
    .selectAll("legend-square")
    .data(symbols)
    .enter()
    .append("circle")
    .attr("cx", legendPaddingLeft + radius * 0.75)
    .attr("cy", (d, i) => 20 + i * (squareSize + paddingSquares))
    .attr("r", radius)
    .style("fill", (d, i) => colors[i]);
  legend
    .selectAll("legend-labels")
    .data(symbols)
    .enter()
    .append("text")
    .attr("x", 20 + squareSize * 1.2)
    .attr("y", (d, i) => 20 + i * (squareSize + paddingSquares))
    .text((d, i) => symbols[i])
    .attr("text-anchor", "left")
    .attr("font-size", 9)
    .style("alignment-baseline", "central");

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "left")
    .attr("x", legendPaddingLeft)
    .attr("y", 10)
    .text("symbol");

  return legend;
}
