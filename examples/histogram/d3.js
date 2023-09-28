// https://observablehq.com/@d3/histogram/2?intent=fork
d3.json("/data/movies.json").then((data) => {
  const width = 258;
  const height = 247;
  const marginTop = 20;
  const marginRight = 0;
  const marginBottom = 30;
  const marginLeft = 50;

  const bins = d3
    .bin()
    .thresholds(10)
    .value((d) => d["IMDB Rating"])(data);

  const x = d3
    .scaleLinear()
    .domain([bins[0].x0, bins[bins.length - 1].x1])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([0, 1000])
    .range([height - marginBottom, marginTop]);

  const svg = d3
    .select("#graph-d3js")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  svg
    .append("g")
    .selectAll("line")
    .data(y.ticks(5))
    .join("line")
    .attr("x1", marginLeft)
    .attr("x2", width - marginRight)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", "grey")
    .attr("stroke-opacity", "0.3");

  svg
    .append("g")
    .attr("fill", "steelblue")
    .selectAll()
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("y", (d) => y(d.length))
    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
    .attr("height", (d) => y(0) - y(d.length));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", marginLeft + (width - marginLeft) / 2)
        .attr("y", marginBottom - 4)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .text("IMDB Rating (binned)")
    );
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft}, 0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) =>
      g
        .append("text")
        .attr("x", -(height - marginTop - marginBottom) / 2)
        .attr("y", (-2 * marginLeft) / 3)
        .attr("font-size", 10)
        .attr("fill", "currentColor")
        .attr("font-weight", "bold")
        .attr("transform", `rotate(-90)`)
        .text("Count of Records")
    );
});

// TODO: Refactor x,y,transform
