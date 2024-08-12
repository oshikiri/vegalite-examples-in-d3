async function main() {
  const keys = ["sun", "snow", "rain", "fog", "drizzle"];
  const colors = ["#e7ba52", "#9467bd", "#1f77b4", "#c7c7c7", "#aec7e8"];

  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

  const plotter = new Plotter({
    root: { width: 380, height: 242 },
    margin: { top: 10, right: 90, bottom: 40, left: 45 },
  });
  const root = plotter.initializeRoot();
  plotter.keys = keys;

  plotter.appendLabels(root);

  const data = await d3.csv("../../data/seattle-weather.csv");
  const flatten = plotter.createDataset(data);
  const series = d3.stack().keys(keys)(flatten);

  plotter.scale.x.domain(months).range([0, plotter.chartWidth]).padding(0.1);
  plotter.scale.y.domain([0, 120]).range([plotter.chartHeight, 0]);
  plotter.scale.color.range(colors);

  const bars = plotter.appendBars(root, series);
  plotter.appendGrids(bars);

  plotter.appendLegends(root);
}

class Plotter {
  constructor(size) {
    const margin = size.margin;
    const rootSize = size.root;

    this.margin = margin;
    this.rootSize = rootSize;
    this.chartWidth = rootSize.width - margin.left - margin.right;
    this.chartHeight = rootSize.height - margin.top - margin.bottom;

    this.scale = {
      x: d3.scaleBand(),
      y: d3.scaleLinear(),
      color: d3.scaleOrdinal(),
    };
  }

  initializeRoot() {
    const root = d3
      .select("#graph-d3js")
      .append("svg")
      .attr("width", this.rootSize.width)
      .attr("height", this.rootSize.height);
    return root;
  }

  appendLabels(root) {
    const margin = this.margin;
    const chartWidth = this.chartWidth;
    const chartHeight = this.chartHeight;

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

  appendBars(root, series) {
    const margin = this.margin;
    const xScale = this.scale.x;
    const yScale = this.scale.y;
    const colorScale = this.scale.color;

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
      .attr("x", (_d, i) => xScale(xScale.domain()[i]))
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth());

    return bars;
  }

  appendGrids(bars) {
    const chartHeight = this.chartHeight;
    const xScale = this.scale.x;
    const yScale = this.scale.y;

    bars
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale));
    bars.append("g").attr("class", "grid").call(d3.axisLeft(yScale).ticks(6));
  }

  appendLegends(root) {
    const margin = this.margin;
    const chartWidth = this.chartWidth;

    const squareSize = 10;
    const paddingSquares = 3;
    const legendPaddingLeft = 15;
    const legend = root
      .append("g")
      .attr("transform", `translate(${margin.left + chartWidth}, 0)`);
    legend
      .selectAll("legend-square")
      .data(this.keys)
      .enter()
      .append("rect")
      .attr("x", margin.right / 5)
      .attr(
        "y",
        (d, i) => legendPaddingLeft + i * (squareSize + paddingSquares)
      )
      .attr("width", squareSize)
      .attr("height", squareSize)
      .style("fill", (d, i) => this.scale.color.range()[i]);
    legend
      .selectAll("legend-labels")
      .data(this.keys)
      .enter()
      .append("text")
      .attr("x", 20 + squareSize * 1.2)
      .attr(
        "y",
        (d, i) => legendPaddingLeft + i * (squareSize + paddingSquares) + 3
      )
      .text((d, i) => this.keys[i])
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

  createDataset(data) {
    const parseMonth = d3.timeParse("%Y-%m-%d");

    const counts = d3.rollups(
      data,
      (g) => g.length,
      (d) => parseMonth(d.date).getMonth(),
      (d) => d.weather
    );
    const flatten = counts.map(([m, weathers], i) => {
      const r = { month: this.scale.x.domain()[m] };
      for (const k of this.keys) {
        r[k] = 0;
      }
      for (const [w, count] of weathers) {
        r[w] = count;
      }
      return r;
    });
    return flatten;
  }
}

main();
