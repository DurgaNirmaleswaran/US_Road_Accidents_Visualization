d3.json("data/accidents_cleaned.json").then(data => {
    // Group by severity
    const severityCounts = d3.rollups(
      data,
      v => v.length,
      d => d.Severity
    );
  
    const formatted = severityCounts.map(([severity, count]) => ({
      severity: String(severity),
      count: count
    }));
  
    // SVG setup
    const svg = d3.select("#severityChart"),
          margin = { top: 20, right: 30, bottom: 40, left: 50 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleBand()
                .domain(formatted.map(d => d.severity))
                .range([0, width])
                .padding(0.2);
  
    const y = d3.scaleLinear()
                .domain([0, d3.max(formatted, d => d.count)])
                .nice()
                .range([height, 0]);
  
    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y));
  
    // Bars
    g.selectAll(".bar")
      .data(formatted)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.severity))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count))
      .attr("fill", "steelblue");
 
 
    // --- Accidents by Weather Condition ---
 const weatherCounts = d3.rollups(
    data,
    v => v.length,
    d => d.Weather_Condition
  );
  
  // Sort and take top 10 weather conditions
  const topWeather = weatherCounts
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([weather, count]) => ({ weather, count }));
  
  const svgWeather = d3.select("#weatherChart"),
        marginW = { top: 20, right: 30, bottom: 100, left: 50 },
        widthW = +svgWeather.attr("width") - marginW.left - marginW.right,
        heightW = +svgWeather.attr("height") - marginW.top - marginW.bottom;
  
  const gW = svgWeather.append("g").attr("transform", `translate(${marginW.left},${marginW.top})`);
  
  const xW = d3.scaleBand()
               .domain(topWeather.map(d => d.weather))
               .range([0, widthW])
               .padding(0.3);
  
  const yW = d3.scaleLinear()
               .domain([0, d3.max(topWeather, d => d.count)]).nice()
               .range([heightW, 0]);
  
  // X Axis
  gW.append("g")
    .attr("transform", `translate(0,${heightW})`)
    .call(d3.axisBottom(xW))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");
  
  // Y Axis
  gW.append("g").call(d3.axisLeft(yW));
  
  // Bars
  gW.selectAll(".bar")
    .data(topWeather)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xW(d.weather))
    .attr("y", d => yW(d.count))
    .attr("width", xW.bandwidth())
    .attr("height", d => heightW - yW(d.count))
    .attr("fill", "#4a90e2");
  
  });
  