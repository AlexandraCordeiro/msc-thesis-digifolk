import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// set the dimensions and margins of the graph
const margin = 100,
svgWidth = window.innerWidth - 10,
svgHeight = window.innerHeight - 10,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 2

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform",`translate(${margin/2},0)`);

d3.json("harmonic_intervals_data.json").then(function(data) {

    // fundamental frequency contour (f0)
    let f0 = svg.append('g')
        .attr('id', 'fundamental-frequency')
})
