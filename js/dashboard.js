/// dashboard.js — Updated for full filter support across all visualizations

let originalData; // Store the full dataset globally

// Load the data initially
d3.json("data/accidents_cleaned.json").then(data => {
  originalData = data;
  initializeFilters(data); 
  updateVisualizations(data);
});

function initializeFilters(data) {
  const dates = data.map(d => new Date(d.Start_Time));
  const months = [...new Set(dates.map(d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')))].sort();

  const formatMonth = d => {
    const [year, month] = d.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  // Populate Start Date
  const startSelect = d3.select("#startDate");
  months.forEach(m => {
    startSelect.append("option")
      .attr("value", m)
      .text(formatMonth(m));
  });

  // Populate End Date
  const endSelect = d3.select("#endDate");
  months.forEach(m => {
    endSelect.append("option")
      .attr("value", m)
      .text(formatMonth(m));
  });

  // Set default selection
  startSelect.property("value", months[0]);
  endSelect.property("value", months[months.length - 1]);
}


// Set up event listeners for filters
d3.selectAll("#startDate, #endDate, #severity").on("change", applyFilters);

// Reset Filters Functionality
d3.select("#resetFilters").on("click", () => {
  // Reset dropdowns to default values
  d3.select("#startDate").property("selectedIndex", 0);
  d3.select("#endDate").property("selectedIndex", d3.select("#endDate").selectAll("option").size() - 1);
  d3.select("#severity").property("value", "");

  // Reapply filters (which now are reset)
  applyFilters();
});


// Function to update all visualizations with filtered data
function updateVisualizations(filteredData) {
  drawTopStatesBarChart(filteredData);
  drawTopStatesPieChart(filteredData);
  drawAccidentTrendsLineChart(filteredData);
  drawRoadTypeStackedBarChart(filteredData);
  drawRoadFeatureScatterChart(filteredData);
}

// Function to apply filters based on user input
function applyFilters() {
  let start = d3.select("#startDate").property("value"); // format "2016-02"
  let end = d3.select("#endDate").property("value");
  let severity = d3.select("#severity").property("value");

  let filtered = originalData.filter(d => {
    let date = new Date(d.Start_Time);
    let yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    return (start ? yearMonth >= start : true) &&
           (end ? yearMonth <= end : true) &&
           (severity ? d.Severity == severity : true);
  });

  updateVisualizations(filtered);
}
  
  // -------------------------------------------------
  // 1. Horizontal Bar Chart — Top States by Accidents
  // -------------------------------------------------
  function drawTopStatesBarChart(data) {
    const svg = d3.select("#topStatesChart"),
          margin = { top: 20, right: 30, bottom: 40, left: 100 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    svg.selectAll("*").remove(); // Clear previous chart
  
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    const stateCounts = d3.rollups(data, v => v.length, d => d.State)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([state, count]) => ({ state, count }));
  
    const y = d3.scaleBand()
                .domain(stateCounts.map(d => d.state))
                .range([0, height])
                .padding(0.2);
  
    const x = d3.scaleLinear()
                .domain([0, d3.max(stateCounts, d => d.count)])
                .nice()
                .range([0, width]);
  
    // Axes
    g.append("g").call(d3.axisLeft(y));
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(",")));
  
    const tooltip = d3.select("#tooltip");
  
    // Animated bars
    g.selectAll(".bar")
      .data(stateCounts)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.state))
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", 0) // Start with width 0
      .attr("fill", "#4a90e2")
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("width", d => x(d.count));
  
    // Interactivity
    g.selectAll(".bar")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#888888");
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>${d.state}</strong><br/>${d3.format(",")(d.count)} accidents`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#4a90e2");
        tooltip.transition().duration(200).style("opacity", 0);
      });
  
    // Animate labels
    g.selectAll(".label")
      .data(stateCounts)
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", d => y(d.state) + y.bandwidth() / 2 + 4)
      .style("fill", "#333")
      .style("font-size", "12px")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("x", d => x(d.count) + 5)
      .style("opacity", 1)
      .text(d => d3.format(",")(d.count));
  }
  
  // ----------------------------------------
  // 1. Pie chart — Top States by Accidents
  // ----------------------------------------
  function drawTopStatesPieChart(data) {
    const svg = d3.select("#topStatesPieChart"),
          margin = { top: 20, right: 30, bottom: 40, left: 30 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom,
          radius = Math.min(width, height) / 2;

    svg.selectAll("*").remove(); // Clear previous pie chart if any

    const g = svg.append("g")
                 .attr("transform", `translate(${(width / 2) + margin.left}, ${(height / 2) + margin.top})`);

    const stateCounts = d3.rollups(data, v => v.length, d => d.State)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([state, count]) => ({ state, count }));

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie()
                 .value(d => d.count);

    const arc = d3.arc()
                 .innerRadius(0)
                 .outerRadius(radius - 10);

    const tooltip = d3.select("#pie-tooltip"); // Select tooltip div

    const arcs = g.selectAll(".arc")
                  .data(pie(stateCounts))
                  .enter()
                  .append("g")
                  .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.state))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.7);
            tooltip.transition()
                   .duration(150)
                   .style("opacity", 1);
            tooltip.html(`<strong>${d.data.state}</strong><br/>${d.data.count.toLocaleString()} accidents`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            tooltip.transition()
                   .duration(200)
                   .style("opacity", 0);
        });

      // Add group for labels
      const labels = arcs.append("g")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("pointer-events", "none");

      // Add state abbreviation
      labels.append("text")
        .attr("y", -5) 
        .text(d => d.data.state)
        .style("fill", "#000");

      // Add accident count
      labels.append("text")
        .attr("y", 10) 
        .text(d => d.data.count.toLocaleString())
        .style("fill", "#000")
        .style("font-size", "7.5px"); 
}
  
  
  // -----------------------------
  // 2. Multi-Line Chart — Trends by Year
  // -----------------------------
  function drawAccidentTrendsLineChart(data) {
    const svg = d3.select("#trendChart"),
          margin = { top: 30, right: 30, bottom: 40, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    svg.selectAll("*").remove(); // Clear previous render
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    data.forEach(d => {
      d.Year = new Date(d.Start_Time).getFullYear();
    });
  
    const severityLevels = [1, 2, 3, 4];
    const years = [...new Set(data.map(d => d.Year))].sort((a, b) => a - b);
  
    const series = severityLevels.map(sev => ({
      severity: sev,
      values: years.map(year => {
        const count = data.filter(d => d.Year === year && d.Severity === sev).length;
        return { year, count };
      })
    }));
  
    const x = d3.scaleLinear()
                .domain(d3.extent(years))
                .range([0, width]);
  
    const y = d3.scaleLinear()
                .domain([0, d3.max(series.flatMap(s => s.values), d => d.count)])
                .nice()
                .range([height, 0]);
  
    const color = d3.scaleOrdinal()
                    .domain(severityLevels)
                    .range(d3.schemeTableau10);
  
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  
    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));
  
    const line = d3.line()
                   .x(d => x(d.year))
                   .y(d => y(d.count))
                   .curve(d3.curveMonotoneX);
  
    // Animate lines
    const path = g.selectAll(".line")
      .data(series)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", d => color(d.severity))
      .attr("stroke-width", 2.5)
      .attr("d", d => line(d.values));
  
    path.each(function() {
      const totalLength = this.getTotalLength();
      d3.select(this)
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);
    });
  
    // Tooltip div
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px 12px")
      .style("background", "#333")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  
    // Add circles
    series.forEach(s => {
      g.selectAll(".dot" + s.severity)
        .data(s.values)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", color(s.severity))
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(150).style("opacity", 0.95);
          tooltip.html(
            `<strong>Year:</strong> ${d.year}<br/>
             <strong>Severity:</strong> ${s.severity}<br/>
             <strong>Count:</strong> ${d.count.toLocaleString()}`
          ).style("left", (event.pageX + 10) + "px")
           .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));
    });
  
    // Update HTML legend outside
    const legendHTML = severityLevels.map(sev => {
      return `<span style="display:inline-block;width:12px;height:12px;
               background:${color(sev)};margin-right:5px"></span>Severity ${sev}`;
    }).join("<br>");
    d3.select("#severity-legend").html(legendHTML);
  }  
  
  
  // -------------------------------------------------
  // 3. Stacked Bar Chart — Severity by Road Feature
  // -------------------------------------------------
  function drawRoadTypeStackedBarChart(data) {
    const svg = d3.select("#roadTypeChart"),
          margin = { top: 30, right: 30, bottom: 40, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    const roadTypes = ["Traffic_Signal", "Stop", "Junction", "Roundabout", "Railway"];
    const severityLevels = [1, 2, 3, 4];
    const severityLabels = {
      1: "Minor",
      2: "Moderate",
      3: "Serious",
      4: "Severe"
    };
    const color = d3.scaleOrdinal()
      .domain(severityLevels)
      .range(["#c7e9c0", "#fdae6b", "#de2d26", "#756bb1"]);
  
    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px 12px")
      .style("background", "#333")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  
    // Prepare data
    const featureData = roadTypes.map(type => {
      const filtered = data.filter(d => d[type] === true);
      const counts = {};
      severityLevels.forEach(s => {
        counts[s] = filtered.filter(d => d.Severity === s).length;
      });
      counts.total = severityLevels.reduce((sum, s) => sum + counts[s], 0);
      return { type, ...counts };
    });
  
    const stack = d3.stack().keys(severityLevels);
    const stackedSeries = stack(featureData);
  
    const x = d3.scaleBand()
      .domain(roadTypes)
      .range([0, width])
      .padding(0.2);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(featureData, d => d.total)])
      .nice()
      .range([height, 0]);
  
    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));
  
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d.replace("_", " ")));
  
    // Bars with transition and tooltips
    g.selectAll("g.layer")
      .data(stackedSeries)
      .enter()
      .append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => x(d.data.type))
      .attr("y", height)
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .on("mouseover", function (event, d) {
        const severity = d3.select(this.parentNode).datum().key;
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip.html(
          `<strong>${d.data.type.replace("_", " ")}</strong><br/>
           <strong>Severity:</strong> ${severityLabels[severity]}<br/>
           <strong>Count:</strong> ${d[1] - d[0]}`
        )
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
      .transition()
      .duration(800)
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]));
  
    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left - 30}, ${margin.top})`);
  
    severityLevels.forEach((s, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 18)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(s));
  
      legend.append("text")
        .attr("x", 18)
        .attr("y", i * 18 + 10)
        .text(severityLabels[s])
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  }
  
  // ------------------------------------------------
  // 3. Scatter Plot — Severity by Road Feature
  // ------------------------------------------------
  function drawRoadFeatureScatterChart(data) {
    const svg = d3.select("#roadFeatureScatterChart"),
          margin = { top: 30, right: 40, bottom: 50, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;
  
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  
    const roadTypes = ["Junction", "Stop", "Roundabout", "Traffic_Signal"];
    const color = d3.scaleOrdinal()
      .domain(roadTypes)
      .range(["#1f77b4", "#d62728", "#2ca02c", "#ff7f0e"]);
  
    data.forEach(d => {
      d.Year = new Date(d.Start_Time).getFullYear();
    });
  
    const years = [...new Set(data.map(d => d.Year))].sort();
  
    const featureData = roadTypes.map(type => {
      return {
        type,
        values: years.map(year => {
          const count = data.filter(d => d.Year === year && d[type] === true).length;
          return { year, count };
        })
      };
    });
  
    const x = d3.scaleLinear()
                .domain(d3.extent(years))
                .range([0, width]);
  
    const y = d3.scaleLinear()
                .domain([0, d3.max(featureData.flatMap(d => d.values), v => v.count)])
                .nice()
                .range([height, 0]);
  
    g.append("g").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  
    g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));
  
    // Add scatter dots
    featureData.forEach(feature => {
      g.selectAll(`.dot-${feature.type}`)
        .data(feature.values)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", color(feature.type))
        .attr("opacity", 0.8);
    });
  
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 70}, ${margin.top})`);
  
    roadTypes.forEach((type, i) => {
      legend.append("circle")
        .attr("cx", 0)
        .attr("cy", i * 20)
        .attr("r", 6)
        .attr("fill", color(type));
  
      legend.append("text")
        .attr("x", 10)
        .attr("y", i * 20 + 5)
        .text(type.replace("_", " "))
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
  }
  