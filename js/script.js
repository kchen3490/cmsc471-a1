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
let xVar = "month", yVar = "count";
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
  d3.csv("./data/Chicago_Crimes_2019_to_2022.csv", function (d) {
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
  d3.select("#category")
    .attr("multiple", "")
    .selectAll("myOptions")
    .data(Object.keys(categories))
    .enter()
    .append("option")
    .text((d) => d)
    .attr("value", (d) => d);

  d3.select("#crime").attr("multiple", "");

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
  // variable which holds the min and max of the date range
  let extent = d3.extent(selectedData, (d) => d.date);
  // these are the y values (months) that will be plotted
  timeRange = d3.timeMonths(extent[0], extent[1]);
  // each month of the year represents a bin and we count how many entries in each bin
  let bins = [];
  // for each month, count how many crimes occurred
  for (let i = 0; i < timeRange.length; i++) {
    let monthData;
    // filter by month
    if (i < timeRange.length - 1) {
      monthData = selectedData.filter(
        (d) => d.date >= timeRange[i] && d.date <= timeRange[i + 1],
      );
    } else {
      monthData = selectedData.filter((d) => d.date >= timeRange[i]);
    }
    // store the total number of occurrences in the month
    bins.push({ date: timeRange[i], count: monthData.length });
  }
  return bins; // this will be the y value plotted
}

function updateAxes() {
  svg.selectAll(".axis").remove();
  svg.selectAll(".labels").remove();
  svg.selectAll(".y-axis").remove();

  xScale = d3.scaleTime()
    .domain(d3.extent(plotData, (d) => d.date))
    .range([0, width]);
  const xAxis = d3.axisBottom(xScale);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`) // Position at the bottom
    .call(xAxis);

  yScale = d3.scaleLinear()
    .domain([0, d3.max(plotData, (d) => d.count)])
    .range([height, 0]);
  const yAxis = d3.axisLeft(yScale);

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

  svg.append("path")
    .datum(plotData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count)))
}
