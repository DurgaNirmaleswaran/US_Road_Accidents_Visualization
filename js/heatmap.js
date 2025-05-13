Promise.all([
    d3.json("data/us-states.geojson"),
    d3.json("https://github.com/Vishnu-vj/US_Road_Accidents_Visualization/releases/download/v2.0.0/accidents_cleaned.json")
  ]).then(([us, data]) => {
    const width = 960, height = 600;
    const svg = d3.select("#heatmap");
  
    // State name to abbreviation mapping
    const stateNameToAbbrev = {
      "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
      "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
      "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
      "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA",
      "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
      "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
      "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
      "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
      "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
      "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
    };
  
    const stateCounts = d3.rollup(data, v => v.length, d => d.State);
  
    // Define thresholds and color scale
    const thresholds = [0, 1000, 5000, 10000, 25000, 50000, 100000, 200000, 300000];
    const color = d3.scaleThreshold()
      .domain(thresholds)
      .range([
        "#f7fbff",
        "#deebf7",
        "#c6dbef",
        "#9ecae1",
        "#6baed6",
        "#4292c6",
        "#2171b5",
        "#084594"
      ]);
      
  
    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(1000);
  
    const path = d3.geoPath().projection(projection);
  
    svg.selectAll("path")
      .data(us.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const abbrev = stateNameToAbbrev[d.properties.NAME];
        const count = stateCounts.get(abbrev) || 0;
        return color(count);
      })
      .attr("stroke", "#333")
      .append("title")
      .text(d => {
        const abbrev = stateNameToAbbrev[d.properties.NAME];
        const count = stateCounts.get(abbrev) || 0;
        return `${abbrev}: ${count.toLocaleString()} accidents`;
      });
  
    const legendData = color.range()
  .map(d => {
    const [from, to] = color.invertExtent(d);
    return { color: d, from, to };
  })
  .filter(d => d.from !== undefined && d.to !== undefined);

  
    const legendWidth = 360;
    const legendHeight = 12;
    const legendX = width / 2 - legendWidth / 2;
    const legendY = height - 50;
    const boxWidth = legendWidth / legendData.length;
  
    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", legendY - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Number of Accidents");
  
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);
  
    legend.selectAll("rect")
      .data(legendData)
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * boxWidth)
      .attr("y", 0)
      .attr("width", boxWidth)
      .attr("height", legendHeight)
      .style("fill", d => d.color)
      .style("stroke", "#ccc");
  
    legend.selectAll("text")
      .data(legendData)
      .enter()
      .append("text")
      .attr("x", (d, i) => i * boxWidth + boxWidth / 2)
      .attr("y", legendHeight + 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(d => {
        const from = d3.format(".2s")(d.from).replace("G", "B");
        const to = d.to ? d3.format(".2s")(d.to).replace("G", "B") : "+";
        return `${from}–${to}`;
      });
  
    console.log("Loaded states with counts:", Array.from(stateCounts.entries()));
  });
  