const svgWidth = 460;
const svgHeight = 247;

const svg = d3
  .select("#graph-d3js")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const margin = { top: 10, right: 120, bottom: 30, left: 50 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const xScale = d3.scaleLinear().range([0, width]).domain([1.6, 9]);
const yScale = d3.scaleLinear().range([height, 0]).domain([0, 100]);
const colorScale = d3.scaleSequential(d3.interpolateYlGnBu);

const chart = svg
  .append("g")
  .attr("class", "chart")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.json("../../data/movies.json").then((data) => {
  const dataRolluped = preprocess(data);
  colorScale.domain(getCountExtent(dataRolluped));
  appendRectangles(chart, dataRolluped);
  appendLegend(svg);
  appendAxisX(chart);
  appendAxisY(chart);
});

function preprocess(data) {
  data = data.filter(
    (d) => !!d["IMDB Rating"] && !!d["Rotten Tomatoes Rating"]
  );
  data.forEach((d) => {
    d.imdbBin = roundFifth(+d["IMDB Rating"]);
    d.rottenBin = +d["Rotten Tomatoes Rating"];
    d.rottenBin -= (d.rottenBin - 1) % 5;
  });
  console.log(data);

  const dataRolluped = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.imdbBin,
    (d) => d.rottenBin
  );
  console.log(dataRolluped);
  return dataRolluped;
}

function roundFifth(x) {
  let y = Math.floor(5 * x);
  return y / 5;
}

function getCountExtent(dataRolluped) {
  let counts = [];
  dataRolluped.forEach((d) => {
    if (!d) return;
    counts = counts.concat(...d.values());
  });
  return d3.extent(counts);
}

function appendRectangles(chart, dataRolluped) {
  const rectangles = chart.append("g").attr("class", "rectangles");
  const xBandWidth = xScale(0.2) - xScale(0);
  const yBandWidth = yScale(0) - yScale(5);
  for (const imdbBin of dataRolluped.keys()) {
    const dataCol = dataRolluped.get(imdbBin);
    for (const rottenBin of dataCol.keys()) {
      const count = dataCol.get(rottenBin);
      rectangles
        .append("rect")
        .attr("x", xScale(imdbBin))
        .attr("y", yScale(rottenBin) - yBandWidth)
        .attr("fill", colorScale(count))
        .attr("width", xBandWidth)
        .attr("height", yBandWidth);
    }
  }
  return rectangles;
}

function appendLegend(svg) {
  const countMax = 25;
  const legendHeight = 7;
  const legendMarginLeft = 10;

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${margin.left + width + 20}, ${margin.top})`);

  const legendRectangles = legend.append("g").attr("class", "legend-bar");
  legendRectangles
    .selectAll(".legend")
    .data(d3.range(0, countMax + 1))
    .enter()
    .append("rect")
    .attr("width", 15)
    .attr("height", legendHeight)
    .attr("fill", (d) => colorScale(d))
    .attr(
      "transform",
      (d) =>
        `translate(${legendMarginLeft}, ${10 + legendHeight * (countMax - d)})`
    );

  const legendText = legend.append("g").attr("class", "legend-text");
  for (const y of d3.range(0, countMax + 1, 5)) {
    legendText
      .append("text")
      .attr("font-size", 10)
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "middle")
      .attr("x", 30)
      .attr("y", legendMarginLeft + legendHeight * (countMax - y))
      .text(y);
  }

  legend
    .append("text")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "left")
    .attr("x", legendMarginLeft)
    .attr("y", 0)
    .text("Count of Records");
}

function appendAxisX(chart) {
  chart
    .append("g")
    .attr("class", "axis-x")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  chart
    .append("text")
    .attr("class", "axis-label-x")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 0.9 * margin.bottom)
    .text("IMDB Rating (binned)");
}

function appendAxisY(chart) {
  chart.append("g").attr("class", "axis-y").call(d3.axisLeft(yScale));

  chart
    .append("text")
    .attr("class", "axis-label-y")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -0.7 * margin.left)
    .text("Rotten Tomatoes Rating (binned)");
}
