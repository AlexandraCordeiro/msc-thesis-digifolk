import { useRef, useEffect, useLayoutEffect } from "react"
import * as d3 from "d3"
import {drawNoteFrequencyRings, drawSparklines, midiToNote, cursorPoint} from "./functions.js";
import {useWindowSize} from "./UseWindowSize.jsx"

const mouseOver = (e, d, data, graphHeight, graphWidth, x) => {   
    let tooltip = d3.select("#tooltip")
    let svg = d3.select("svg").node()
    tooltip.selectAll("*").remove()
    tooltip.attr("transform", null)

    tooltip.transition()
    .duration(200)
    .style("opacity", 1)

    const sparklineSize = graphWidth * 0.1
    const offset = sparklineSize * 2
    const groupNode = d3.select("#align-group").node();
    const [x1, y1] = d3.pointer(e, groupNode);
    tooltip.attr("transform", `translate(${x1 - (sparklineSize / 2)}, ${y1 + offset})`)

    drawSparklines(data, tooltip, graphHeight, graphWidth, x, d)

    
}
  
const mouseOut = (e, d) => {
    d3.select("#tooltip").style("opacity", 0);
}

function drawXAxis(data, group, graphHeight, graphWidth, x) {
    // display x axis
    const noteNamesAxis = group.append("g")
    .attr("id", "note-names-x-axis")
    .attr("color", "black")

    
    noteNamesAxis
    .call(
        d3.axisBottom(x)
        .tickValues(data.nodes.map(d => d.id)) 
        .tickFormat(d => {
            const match = data.nodes.find(n => n.id === d);
            return match ? match.name : "";
        })
        .tickPadding(graphHeight * 0.3)
    )
    .attr("transform", `translate(0, ${graphHeight * 0.2})`)

    noteNamesAxis.selectAll(".tick text")
    .attr("class", "axis-ticks underline--magical")
    .on("mouseover", (d, e) => mouseOver(d, e, data, graphHeight, graphWidth, x))
    .on("mouseout", (d, e) => mouseOut(d, e))
}

export function drawLinks(data, group, graphHeight, graphWidth, x) {
    // Add links between nodes
    const idToNode = {};
    data.nodes.forEach(function (n) {
        idToNode[n.id] = n;
    });

    // Add the links
    const links = group
    .append('g')
    .attr('id', 'links')
    .selectAll('links')
    .data(data.links)
    .join('path')
    .attr('d', (d, i) => {
        let y = graphHeight * 0.2
        let startid = idToNode[d.source]
        let endid = idToNode[d.target]
        let start = x(idToNode[d.source].id)      // start node on the x axis
        let end = x(idToNode[d.target].id)        // end node on the x axis
        let arcHeight = (end - start) * 2
        
        // loop
        let path;
        if (d.source == d.target) {

            let loopWidth = graphHeight * 0.09
            let loopHeight = graphHeight * 0.09

            path = 
                ['M', start, y,                                
                'C', start + loopWidth, y - loopHeight ,                       
                start - loopWidth, y - loopHeight,
                start, y]
                .join(' ');
        }
        else {
            path = 
                ['M', start, y,                     // arc starts at x, y
                'A',                                // This means we're gonna build an elliptical arc
                Math.abs(start - end), ',',                   // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
                arcHeight, 0, 0, ',',
                startid > endid ? 0 : 1, end, ',', y]
                .join(' ');
        }
        return path
    })
    .style("fill","none")
    .attr("stroke", "#009FFF")
    .attr("stroke-width", 2/* d => d.count */)
    .attr("opcaity", 0.7)

    return links
}

const ArcDiagramChart = ({tune}) => {
    const svgRef = useRef(null)
    const [width, height] = useWindowSize();
    const filename = `/music_intervals/${tune}_music_intervals.json`
    console.log(tune)
    console.log(filename)
    
    useLayoutEffect(() => {
        

        // set the dimensions and margins of the graph
        const svgWidth = width * 0.8,
        margin = width * 0.2,
        svgHeight = height,
        graphWidth = svgWidth * 0.9,
        graphHeight = svgHeight / 3
        
        // append the svg object to the body of the page
        const svg = d3.select(svgRef.current)
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("transform", `translate(${margin / 2},0)`)
        
        // clear all previous content on refresh
        const everything = svg.selectAll("*");
        everything.remove();

        const group = svg.append("g")
        .attr("id", "align-group")
        .attr("transform", `translate(${svgWidth * 0.1 / 2},${graphHeight})`)
        
        group
        .append("g")
        .attr("id", "tooltip")
        .attr("style", "opacity: 0;")

        // load data
        d3.json(filename).then(function(data) {
        
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
            // const sparklines = drawSparklines(data, group, graphHeight, graphWidth, x)
        
            // Add X Axis
            const xAxis = drawXAxis(data, group, graphHeight, graphWidth, x)
        })
        
        
    }, [width, height, svgRef.current, filename])

    return <svg ref={svgRef}/>
}

export default ArcDiagramChart