import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// set the dimensions and margins of the graph
const svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
margin = svgWidth * 0.2,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 3

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const group = svg.append("g")
.attr("id", "audio-vs-score")
.attr("width", graphWidth)
.attr("height", graphHeight)
.attr("transform", `translate(${svgWidth * 0.5 - graphWidth * 0.5}, ${svgHeight * 0.5 - graphHeight * 0.5})`)

const setOfTokensFromString = (text) => {
    return new Set(text.split(/\s/g))
}

const cleanString = (text) => {
    return text.replace(/[^a-zA-Z\s]/g, '')
}

// load data
d3.csv("data.csv").then(function(data) {
    // console.log(data.map(d => console.log(removeDuplicates(d.tokens))))
    // data.map(d => console.log(console.log(d.tokens.split(", "))))
    group.selectAll("g")
    .data(data)
    .enter()
    .append("g")
    .attr("d", d => console.log(setOfTokensFromString(cleanString(d.tokens))))
})
