// Confirm D3 is loaded
console.log("D3 Version:", d3.version);

// Specify margin
const margin = { top: 40, right: 40, bottom: 40, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Dropdown options
const publicOrder = [
  "WEAPONS VIOLATION",
  "LIQUOR LAW VIOLATION",
  "PUBLIC PEACE VIOLATION",
  "INTERFERENCE WITH PUBLIC OFFICER",
  "CONCEALED CARRY LICENSE VIOLATION",
  "PROSTITUTION",
  "OBSCENITY",
  "PUBLIC INDECENCY",
  "GAMBLING",
  "RITUALISM",
];

const property = [
  "MOTOR VEHICLE THEFT",
  "CRIMINAL DAMAGE",
  "CRIMINAL TRESPASS",
  "THEFT",
  "BURGLARY",
  "DECEPTIVE PRACTICE",
  "ARSON",
];

const violent = [
  "BATTERY",
  "ASSAULT",
  "CRIMINAL SEXUAL ASSAULT",
  "SEX OFFENSE",
  "HOMICIDE",
  "ROBBERY",
  "OFFENSE INVOLVING CHILDREN",
  "STALKING",
  "INTIMIDATION",
  "KIDNAPPING",
  "HUMAN TRAFFICKING",
  "CRIM SEXUAL ASSAULT",
];

const drug = ["NARCOTICS", "OTHER NARCOTIC VIOLATION"];

const other = ["OTHER OFFENSE", "NON-CRIMINAL"];

const all = [...publicOrder, ...property, ...violent, ...drug, ...other];

const categories = {
  "Public Order": publicOrder,
  Property: property,
  Violent: violent,
  Other: other,
  Drug: drug,
};

const chosenCategories = [];
const availableCrimes = [];
const chosenCrimes = [];

// plotData will be a list objects. each object hold key:value pairs
// each object has the form {date: month, count: int}
let plotData;
let timeRange;
let plotAll;

let allData = [];
let currentRange = [];
let sliderRange;
let xVar = "day", yVar = "number of crimes";
let xScale, yScale;

window.addEventListener("load", init);

// date format UNUSED
var format = d3.timeParse("%m/%d/%Y %I:%M:%S %p");

// Create SVG and g
const svg = d3
  .select("#vis")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load csv data
function init() {
  d3.csv("./data/Chicago_Crimes_All_March_2020.csv", function (d) {
    return {
      date: format(d["Date"]),
      category: d["Crime Category"],
      type: d["Primary Type"],
      description: d["Description"],
      month: d["Month"],
      year: +d["Year"],
    };
  })
    .then((data) => {
      console.log(data);
      allData = data;
      currentRange = d3.extent(allData, (d) => d.date);
      plotAll = updateData(all);
      plotData = plotAll;
      setupSelector();
      updateAxes();
      updateVis();
      //addLegend()
    })
    .catch((error) => console.error("Error loading data:", error));

  plotAll = updateData(all);
}

function setupSelector() {
  // Get the absolute min and max dates from your data
  const dateExtent = d3.extent(allData, d => d.date);

  const sliderRange = d3
      .sliderBottom() // sliderBottom looks better below headers
      .min(dateExtent[0])
      .max(dateExtent[1])
      .width(width - 40) 
      .tickFormat(d3.timeFormat('%b %d'))
      .ticks(d3.timeDay.every(3))
      .default([dateExtent[0], dateExtent[1]]) // Start with full range selected
      .fill('#2196f3')
      .on('onchange', val => {
          let start = d3.timeDay.floor(val[0]);
          let end = d3.timeDay.floor(val[1]);

          if (d3.timeDay.count(start, end) < 1) {
              const absoluteMax = d3.timeDay.floor(d3.extent(allData, d => d.date)[1]);
              
              if (end < absoluteMax) {
                  end = d3.timeDay.offset(start, 1);
              } else {
                  start = d3.timeDay.offset(end, -1);
              }
              // Sync the slider handles visually
              sliderRange.value([start, end]);
          }

          updateFilteredVis(start, end);
      });

  d3.select('#slider')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 100)
    .append('g')
    .attr('transform', `translate(${margin.left},30)`)
    .call(sliderRange);

  d3.select("#category")
    .attr("multiple", "") // TODO: do we need the multiple? Otherwise, we lead users to believe selecting multiple files will work
    .selectAll("myOptions")
    .data(Object.keys(categories))
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  d3.select("#crime").attr("multiple", ""); // TODO: do we need the multiple? Otherwise, we lead users to believe selecting multiple files will work

  d3.selectAll(".variable")
    .each(function () { })
    .on("change", function (event) {
      chosenCategories.length = 0;
      availableCrimes.length = 0;
      chosenCrimes.length = 0;
      if (d3.select(this).property("id") == "category") {
        d3.select(this)
          .selectAll("option:checked")
          .each(function () {
            chosenCategories.push(this.value);
          });
        for (const chosen of chosenCategories) {
          for (const crime of categories[chosen]) availableCrimes.push(crime);
        }
        d3.select("#crime").selectAll("option").remove();

        d3.select("#crime")
          .selectAll("myOptions")
          .data(availableCrimes)
          .enter()
          .append("option")
          .text((d) => d)
          .attr("value", (d) => d);
      } else if (d3.select(this).property("id") == "crime") {
        d3.select(this)
          .selectAll("option:checked")
          .each(function () {
            chosenCrimes.push(this.value);
          });

        plotData = updateData(chosenCrimes);
        updateAxes();
        updateVis();
      }
    });
}

// function to calculate y value of each time interval
function updateData(crimes) {
  // filter by the crimes we selected
  let selectedData = allData.filter((d) => crimes.includes(d.type));

  const [startBound, endBound] = currentRange;
  
  // these are the x values (days) that will be plotted
  let timeRange = d3.timeDays(
      d3.timeDay.floor(startBound), 
      d3.timeDay.offset(d3.timeDay.floor(endBound), 1) 
  );
  // each day represents a bin and we count how many entries in each bin
  let bins = [];
  // for each day, count how many crimes occurred
  for (let i = 0; i < timeRange.length; i++) {
    let currentDay = timeRange[i];
    let nextDay = d3.timeDay.offset(currentDay, 1);
    
    let dayData = selectedData.filter(
      (d) => d.date >= currentDay && d.date < nextDay,
    );

    let counts = d3.rollup(dayData, v => v.length, d => d.description);

    let topDesc = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // store the total number of occurrences in the month
    bins.push({ 
      date: timeRange[i], 
      count: dayData.length,
      topDescription: topDesc
    });
  }
  return bins; // this will be the y value plotted
}

function updateAxes() {
  svg.selectAll(".axis").remove();
  svg.selectAll(".labels").remove();
  svg.selectAll(".y-axis").remove();

  const dateExtent = d3.extent(plotData, (d) => d.date);

  xScale = d3.scaleTime()
    .domain(dateExtent)
    .range([0, width]);
  
  const numDays = plotData.length; // The number of data points we have
  let xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d"));

  // 2. Dynamic Scaling Logic
  if (numDays <= 12) {
    // For small ranges (up to ~1.5 weeks), show every single day
    xAxis.ticks(d3.timeDay.every(1));
  } else {
    // For "weird" or long ranges, manually pick the points to ensure
    // the start and end dates are included.
    const desiredTicks = 7; // Adjust this for how crowded you want it
    const tickValues = [];
    
    // Calculate the step size to pick indices evenly
    const step = (numDays - 1) / (desiredTicks - 1);
    
    for (let i = 0; i < desiredTicks; i++) {
      // Round to nearest index to get the actual data point
      const index = Math.round(i * step);
      tickValues.push(plotData[index].date);
    }
    
    // 3. Force these specific dates
    xAxis.tickValues(tickValues);
  }

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`) // Position at the bottom
    .call(xAxis);

  const actualMax = d3.max(plotData, (d) => d.count);
  const yMax = actualMax > 0 ? actualMax : 10;

  yScale = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);

  const yAxis = d3.axisLeft(yScale)
    .ticks(Math.min(yMax, 10))
    .tickFormat(d3.format("d"));

  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);
  
  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text(xVar) // Displays the current x-axis variable
    .attr('class', 'labels');

  // Add y-axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text(yVar) // Displays the current y-axis variable
    .attr('class', 'labels');
}

function updateVis() {
  svg.selectAll("path").remove();
  svg.selectAll(".hover-point").remove();
  svg.selectAll(".no-data-text").remove();

  svg.append("path")
    .datum(plotData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count)))
  
  svg.selectAll(".hover-point")
    .data(plotData, d => d.date)
    .enter()
    .append("circle")
    .attr("class", "hover-point")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.count))
    .attr("r", 10)
    .attr("fill", "transparent")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .style("stroke", "black")
        .attr("fill", "orange").attr("r", 10);
      d3.select("#tooltip").style("display", "block")
        .html(
          `<strong>${d.date.toDateString()}</strong><br/>
          Count: ${d.count}<br/>
          Top Description: ${d.topDescription}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).style("stroke", "none").attr("fill", "transparent").attr("r", 10);
      d3.select("#tooltip").style("display", "none");
    });

    const totalCrimes = d3.sum(plotData, d => d.count);
    if (totalCrimes === 0) {
    svg.append("text")
      .attr("class", "no-data-text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-style", "italic")
      .style("fill", "#888")
      .text("No incidents reported for this selection");
  }
}

function updateFilteredVis(startDate, endDate) {
    currentRange = [startDate, endDate];
    
    // Determine which crimes to show (if none selected, show 'all')
    const crimesToFilter = chosenCrimes.length > 0 ? chosenCrimes : all;
    
    plotData = updateData(crimesToFilter);
    updateAxes();
    updateVis();
}