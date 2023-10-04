const colors = "steelblue orange red lightblue green".split(" ");
const symbols = "AAPL AMZN GOOG IBM MSFT".split(" ");

const margin = { top: 20, right: 70, bottom: 40, left: 45 };
const width = 514 - margin.left - margin.right;
const height = 347 - margin.top - margin.bottom;

const parseMonth = d3.timeParse("%Y-%m-%d");

const tooltip = d3.select(".tooltip");

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

svg
  .append("text")
  .attr("class", "axis-label")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("x", margin.left + width / 2)
  .attr("y", margin.top + height + 0.75 * margin.bottom)
  .text("date");

svg
  .append("text")
  .attr("font-size", 10)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -margin.top - height / 2)
  .attr("y", margin.left / 3)
  .text("price");

const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const symbolScale = d3.scaleOrdinal().range(colors).domain(symbols);

const parseDate = d3.timeParse("%b %d %Y");

d3.csv("../../data/stocks.csv").then((data) => {
  const dataByDate = {};
  data.forEach((d) => {
    d.date = parseDate(d.date);
    d.price = +d.price;

    if (!dataByDate[d.date]) {
      dataByDate[d.date] = [];
    }
    dataByDate[d.date].push(d);
  });
  const dateKeys = Object.keys(dataByDate);
  for (const key of dateKeys) {
    const prev = dataByDate[key];
    dataByDate[key] = { AAPL: 0, AMZN: 0, GOOG: 0, IBM: 0, MSFT: 0 };
    for (const d of prev) {
      dataByDate[key][d.symbol] = d.price;
    }
  }
  console.log(data);
  console.log(dataByDate);

  const table = d3.rollups(
    data,
    (g) => d3.mean(g, (d) => d.price),
    (d) => d.symbol,
    (d) => d.date
  );
  console.log(table);

  xScale.domain(d3.extent(data, (d) => d.date));
  yScale.domain([0, 800]);

  svg
    .on("mouseover", (el, d) => {
      tooltip.style("visibility", "visible");
    })
    .on("mouseout", (el) => {
      const xPoint = xScale.invert(el.offsetX - margin.left);
      const [xmin, xmax] = xScale.domain();

      const yPoint = xScale.invert(el.offsetY - margin.top);
      const [ymin, ymax] = yScale.domain();

      if (xmin <= xPoint <= xmax && ymin <= yPoint <= ymax) return;

      tooltip.style("visibility", "hidden");
    })
    .on("mousemove", (el) => {
      console.log("mousemove", el.pageX, el.pageY);

      tooltip.style("top", `${el.pageY + 20}px`);
      tooltip.style("left", `${el.pageX + 20}px`);

      const xPoint = xScale.invert(el.offsetX - margin.left);
      xPoint.setDate(1);
      xPoint.setHours(0);
      xPoint.setMinutes(0);
      xPoint.setSeconds(0);

      const xData = dataByDate[xPoint];
      updateTooltip(xData);
    });

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat("%Y")));

  chart
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .attr("opacity", "0.7")
    .attr("stroke-width", 0.2)
    .call(d3.axisBottom(xScale).ticks(10).tickSize(-height).tickFormat(""));

  chart.append("g").call(d3.axisLeft(yScale).ticks(10));

  chart
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${width}, 0)`)
    .attr("opacity", "0.7")
    .attr("stroke-width", 0.2)
    .call(d3.axisLeft(yScale).ticks(10).tickSize(width).tickFormat(""));

  const line = d3
    .line()
    .x(([y, p]) => xScale(y))
    .y(([y, p]) => yScale(p));

  table.forEach(([symbol, data]) => {
    console.log(data);
    const perSymbol = chart.append("g");

    perSymbol
      .append("path")
      .attr("class", "line")
      .attr("d", line(data))
      .style("fill", "none")
      .style("stroke", symbolScale(symbol))
      .style("stroke-width", 2);
  });

  const squareSize = 10;
  const paddingSquares = 3;
  const legendPaddingLeft = 15;
  const radius = 5;
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
    .style("fill", "none")
    .style("stroke", (d, i) => colors[i]);
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
});

function updateTooltip(data) {
  if (!data) return;

  console.log(data);
  for (const k in data) {
    const selector = `#price-${k.toLowerCase()}`;
    d3.select(selector).text(data[k]);
  }
}
