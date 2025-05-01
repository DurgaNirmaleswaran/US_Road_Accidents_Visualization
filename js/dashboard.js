
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

// Live Date Validation
function validateDateRange() {
  const start = d3.select("#startDate").property("value");
  const end = d3.select("#endDate").property("value");

  const startSelect = document.getElementById("startDate");
  const endSelect = document.getElementById("endDate");

  if (start > end) {
    alert("⚠️ Start date cannot be after end date.");
    startSelect.style.border = "2px solid red";
    endSelect.style.border = "2px solid red";
    return false;
  } else {
    startSelect.style.border = "";
    endSelect.style.border = "";
    return true;
  }
}

// Attach live validation and filtering
d3.select("#startDate").on("change", () => {
  if (validateDateRange()) applyFilters();
});
d3.select("#endDate").on("change", () => {
  if (validateDateRange()) applyFilters();
});
d3.select("#severity").on("change", applyFilters);

// Reset Filters Functionality
d3.select("#resetFilters").on("click", () => {
  // Reset dropdowns to default values
  d3.select("#startDate").property("selectedIndex", 0);
  d3.select("#endDate").property("selectedIndex", d3.select("#endDate").selectAll("option").size() - 1);
  d3.select("#severity").property("value", "");

  // Clear error borders
  document.getElementById("startDate").style.border = "";
  document.getElementById("endDate").style.border = "";

  applyFilters();
});

// Function to apply filters based on user input
function applyFilters() {
  if (!validateDateRange()) return;

  let start = d3.select("#startDate").property("value");
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

// Function to update all visualizations with filtered data
function updateVisualizations(filteredData) {
  drawTopStatesBarChart(filteredData);
  drawTopStatesPieChart(filteredData);
  drawAccidentTrendsLineChart(filteredData);
  drawStatesYearsGroupedBarChart(filteredData);
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
  
  
  // -------------------------------------
  // 2. Multi-Line Chart — Trends by Year
  // -------------------------------------
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

 // --------------------------------------
 // 2. Grouped Bar Chart - Trends by Year
 // --------------------------------------
 function drawStatesYearsGroupedBarChart(data) {
  const svg = d3.select("#statesYearsChart"),
        margin = { top: 35, right: 30, bottom: 50, left: 60 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;
   svg.selectAll("*").remove();
  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
   // parse Year and force the full range
  data.forEach(d=> d.Year = new Date(d.Start_Time).getFullYear());
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
 
   // pick top 5 states overall
  const topStates = d3.rollups(data, v=> v.length, d=> d.State)
    .sort((a,b)=> b[1]-a[1])
    .slice(0,5).map(d=> d[0]);
   // build year‐state counts
  const yearStateCounts = years.map(year=>{
    const byYear = data.filter(d=> d.Year===year);
    const row = { year };
    topStates.forEach(st=> row[st] = byYear.filter(d=> d.State===st).length);
    return row;
  });
   // scales
  const x0 = d3.scaleBand().domain(years).range([0,width]).paddingInner(0.2).paddingOuter(0);
  const x1 = d3.scaleBand().domain(topStates).range([0, x0.bandwidth()]).padding(0.05);
  const y  = d3.scaleLinear()
               .domain([0, d3.max(yearStateCounts, row=> d3.max(topStates, st=> row[st]))])
               .nice()
               .range([height,0]);
   // draw gridlines
  g.append("g")
    .attr("class","grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    )
    .selectAll("line")
    .attr("stroke","#ddd")
    .attr("stroke-dasharray","2,2");
   // axes
  g.append("g")
    .attr("transform",`translate(0,${height})`)
    .call(d3.axisBottom(x0).tickFormat(d3.format("d")).tickSizeOuter(0))
    .selectAll("text")
      .attr("dy","1em");
 
   g.append("g")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));
   // color scale (Tableau 10 is OK, or try d3.schemeSet2, etc.)
  const color = d3.scaleOrdinal()
    .domain(topStates)
    .range(d3.schemeSet2);
   // tooltip
  const tooltip = d3.select("body").append("div")
      .attr("class","tooltip")
      .style("position","absolute")
      .style("pointer-events","none")
      .style("opacity",0)
      .style("background","#333")
      .style("color","#fff")
      .style("padding","6px")
      .style("border-radius","4px")
      .style("font-size","12px");
   // bars
  const yearGroups = g.selectAll("g.year")
  .data(yearStateCounts, d => d.year);
 // EXIT old years
yearGroups.exit()
  .selectAll("rect")
  .transition()
    .duration(300)
    .attr("y", height)
    .attr("height", 0)
  .remove();
 yearGroups.exit()
  .transition()
    .delay(350)
    .remove();
 // UPDATE + ENTER
const yearEnter = yearGroups
  .enter().append("g")
    .attr("class","year")
    .attr("transform", d=> `translate(${x0(d.year)},0)`);
 const allBars = yearEnter
  .merge(yearGroups)   // ENTER + UPDATE selection
  .selectAll("rect")
  .data(d => topStates.map(st => ({ state:st, val:d[st], year:d.year })), d => d.state);
 // EXIT individual bars
allBars.exit()
  .transition()
    .duration(800)
    .attr("y", height)
    .attr("height", 0)
  .remove();
 // ENTER new bars
const barsEnter = allBars.enter()
  .append("rect")
    .attr("x",     d => x1(d.state))
    .attr("width", x1.bandwidth())
    .attr("y",     height) // start at bottom
    .attr("height", 0)
    .attr("fill",  d => d.val>0 ? color(d.state) : "#f0f0f0")
    .on("mouseover",(e,d)=> {
      tooltip.html(`<strong>${d.state}</strong><br/>${d.year}: ${d.val}`)
        .style("left", (e.pageX+8)+"px")
        .style("top",  (e.pageY-30)+"px")
        .transition().duration(100).style("opacity",0.9);
    })
    .on("mouseout",()=> tooltip.transition().duration(100).style("opacity",0));
 // ENTER + UPDATE transition
barsEnter.merge(allBars)
  .transition()
    .duration(1400)
    .delay((d,i) => i * 80)
    .ease(d3.easeCubicOut)
    .attr("y",      d => y(d.val))
    .attr("height", d => height - y(d.val));
   // build the HTML legend
  const legendHTML = topStates.map(st=>
    `<span style="
        display:inline-block;
        width:12px; height:12px;
        background:${color(st)};
        margin-right:6px;
        vertical-align:middle;"></span>${st}`
  ).join("<br/>");
   // inject & fade in
  d3.select("#state-legend")
    .html(legendHTML)
    .style("opacity",0)
    .transition().duration(500).style("opacity",1);
   
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
  