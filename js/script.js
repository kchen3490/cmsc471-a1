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

let allData = [];
let xVar,
  yVar,
  sizeVar,
  targetYear = 2000;
let xScale, yScale, sizeScale;

window.addEventListener("load", init);

// date format
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
    };
  })
    .then((data) => {
      console.log(data);
      allData = data;
      setupSelector();
      //updateAxes()
      //updateVis()
      //addLegend()
    })
    .catch((error) => console.error("Error loading data:", error));
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
    .each(function () {})
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
      } else if (d3.select(this).property("id" == "crime")) {
        d3.select(this)
          .selectAll("option:checked")
          .each(function () {
            chosenCrimes.push(this.value);
          });
      }
    });
}
