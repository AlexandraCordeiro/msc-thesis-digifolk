import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {drawLinks, drawNoteFrequencyRings, drawSparklines, drawXAxis} from "./functions.js";

// set the dimensions and margins of the graph
const margin = 50,
svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 2

// append the svg object to the body of the page
const svg = d3.select("#viz")
.append("svg")
.attr("width", svgWidth)
.attr("height", svgHeight)

const group = svg.append("g")
.attr("id", "center")
.attr("transform", `translate(${margin / 2},${graphHeight})`)

// load data
d3.json("harmonic_intervals_data.json").then(function(data) {

    // List of node names
    const allIds = data.nodes.map(d => d.id)
    let extent = d3.extent(allIds)

    // X scale
    const x = d3.scaleLinear()
    .domain(extent)
    .range([0, graphWidth])

    const colorGradient = d3.scaleLinear()
    .domain([0, data.links.length - 1])
    .range(["#009FFF", "#ec2F4B"])

    // Add links
    const links = drawLinks(data, group, graphHeight, graphWidth, x)

    // Add frequency rings
    const rings = drawNoteFrequencyRings(data, group, graphHeight, x, colorGradient)
  
    // Add sparklines
    const sparklines = drawSparklines(data, group, graphHeight, graphWidth, x)

    // Add X Axis
    const xAxis = drawXAxis(data, group, graphHeight, x)
})

