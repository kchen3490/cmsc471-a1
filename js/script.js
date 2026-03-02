// Confirm D3 is loaded
console.log("D3 Version:", d3.version);

// Specify margin
const margin = { top: 40, right: 40, bottom: 40, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Dropdown options
const categories = ['Public Order', 'Property', 'Violent', 'Other', 'Drug']

const publicOrder = ['WEAPONS VIOLATION', 'LIQUOR LAW VIOLATION', 'PUBLIC PEACE VIOLATION',
                     'INTERFERENCE WITH PUBLIC OFFICER', 'CONCEALED CARRY LICENSE VIOLATION',
                     'PROSTITUTION', 'OBSCENITY', 'PUBLIC INDECENCY', 'GAMBLING', 'RITUALISM']

const property = ['MOTOR VEHICLE THEFT', 'CRIMINAL DAMAGE', 'CRIMINAL TRESPASS', 'THEFT',
                  'BURGLARY', 'DECEPTIVE PRACTICE', 'ARSON']

const violent = ['BATTERY', 'ASSAULT', 'CRIMINAL SEXUAL ASSAULT', 'SEX OFFENSE',
                 'HOMICIDE', 'ROBBERY', 'OFFENSE INVOLVING CHILDREN', 'STALKING',
                 'INTIMIDATION', 'KIDNAPPING', 'HUMAN TRAFFICKING', 'CRIM SEXUAL ASSAULT']

const drug = ['NARCOTICS', 'OTHER NARCOTIC VIOLATION']

const other = ['OTHER OFFENSE', 'NON-CRIMINAL']

let allData = []
let xVar, yVar, sizeVar, targetYear = 2000
let xScale, yScale, sizeScale

window.addEventListener('load', init);

// date format
var format = d3.timeParse("%m/%d/%Y %I:%M:%S %p")

// Create SVG and g
const svg = d3
  .select("#vis")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load csv data
function init(){
    d3.csv("./data/Chicago_Crimes_2019_to_2022.csv", 
    function(d){
        return {  
        date: format(d['Date']),
        category: d['Crime Category'],
        type: d['Primary Type'],
        description: d['Description']
     }
    })
    .then(data => {
            console.log(data)
            allData = data
        })
    .catch(error => console.error('Error loading data:', error));
}
