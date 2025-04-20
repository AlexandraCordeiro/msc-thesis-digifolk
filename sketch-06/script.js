import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {drawLinks, drawXAxis, radsToDegrees} from "./functions.js";
import { downloadSVG } from "./downloadSVG.js";


// set the dimensions and margins of the graph
const margin = 50,
svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
innerRadius = 25,
graphHeight = svgHeight / 2,
graphWidth = graphHeight - innerRadius - margin

// append the svg object to the body of the page
const svg = d3.select("#viz")
.append("svg")
.attr("width", svgWidth)
.attr("height", svgHeight)

const group = svg.append("g")
.attr("id", "center")
.attr("transform", `translate(${svgWidth / 2},${graphHeight})`)

d3.select("body").append("button")
        .attr("type","button")
        .attr("class", "downloadButton")
        .text("Download SVG")
        .on("click", function() {
            // download the svg
            downloadSVG();
        });

// load data
d3.json("intervals_info_about_all_tunes_7.json").then(function(data) {

    const xRadial = d3.scaleLinear()
    .range([-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI])
    .domain([0, data.length])


    console.log([0, data.length - 1])
    group.selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${innerRadius * Math.cos(xRadial(i))}, ${innerRadius * Math.sin(xRadial(i))}) rotate(${radsToDegrees(xRadial(i))})`)
    .each(function(d, i){
        // List of node names
        let allIds = d.nodes.map(d => d.id)
        let extent = d3.extent(allIds)
        let thisGroup = d3.select(this)
        // X scale
        let x = d3.scaleLinear()
        .domain(extent)
        .range([0, graphWidth])
        
        // Add X Axis
        //const xAxis = drawXAxis(d, thisGroup, graphHeight, x)
        //xAxis.attr("class", "x-axis")

        // Add links
        let p = 2 * (Math.PI * innerRadius) / data.length
        const links = drawLinks(d, thisGroup, p, graphWidth, x)
    

    })

})

