async function main() {
  const plotter = new Plotter({
    root: { width: 380, height: 242 },
    margin: { top: 10, right: 90, bottom: 40, left: 45 },
  });
  plotter.keys = ["sun", "snow", "rain", "fog", "drizzle"];

  const data = await plotter.fetchData("../../data/seattle-weather.csv");

  const months = d3.range(12);
  plotter.scale.x.domain(months).range([0, plotter.chartWidth]).padding(0.1);
  plotter.scale.y.domain([0, 120]).range([plotter.chartHeight, 0]);
  const colors = ["#e7ba52", "#9467bd", "#1f77b4", "#c7c7c7", "#aec7e8"];
  plotter.scale.color.range(colors);

  const root = plotter.initializeRoot();
  plotter.appendLabels(root);
  plotter.appendLegends(root);
  const bars = plotter.appendBars(root, data);
  plotter.appendGrids(bars);
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

  async fetchData(url) {
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

  appendBars(root, counts) {
    const margin = this.margin;
    const bars = root
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    counts.forEach(([month, d]) => {
      this.appendBarGroup(bars, month, d);
    });

    return bars;
  }

  appendBarGroup(bars, month, d) {
    d = this.appendCumsum(d.sort().reverse());

    const scale = this.scale;
    const barGroup = bars.append("g").attr("class", "bar-column");
    barGroup
      .selectAll("rect")
      .data(d)
      .enter()
      .append("rect")
      .attr("fill", (d) => scale.color(d.weather))
      .attr("x", scale.x(month))
      .attr("y", (d) => scale.y(d.cumsum))
      .attr("height", (d) => this.chartHeight - scale.y(d.count))
      .attr("width", scale.x.bandwidth());
    return barGroup;
  }

  appendCumsum(d) {
    let cumsum = 0;
    return d.map(([weather, count]) => {
      cumsum += count;
      return { weather, count, cumsum };
    });
  }

  appendGrids(bars) {
    const chartHeight = this.chartHeight;
    const xScale = this.scale.x;
    const yScale = this.scale.y;

    const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
    bars
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((i) => months[i]));
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
}

main();
