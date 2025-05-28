import React, {useRef, useEffect, useLayoutEffect} from "react";
import * as d3 from "d3";
import {drawLinks, drawXAxis, radsToDegrees} from "./functions.js";
import {useWindowSize} from "./UseWindowSize.jsx"

const CollectionOfTunesRangeChart = () => {
    const svgRef = useRef(null);
    const [width, height] = useWindowSize();

    useLayoutEffect(() => {
        // D3 Code

        // set the dimensions and margins of the graph
        const svgWidth = width * 0.6,
        svgHeight = svgWidth,
        innerRadius = 0,
        graphHeight = svgHeight / 2,
        graphWidth = graphHeight - innerRadius
        
        // append the svg object to the body of the page
        const svg = d3.select(svgRef.current)
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("transform", `translate(${width * 0.2},0)`)
        
        // clear all previous content on refresh
        const everything = svg.selectAll("*");
        everything.remove();
        
        const group = svg.append("g")
        .attr("id", "center")
        .attr("transform", `translate(${graphWidth}, ${graphHeight})`)
        
        // load data
        d3.json("/intervals_info_about_all_tunes.json").then(function(data) {
        
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
                /* const xAxis = drawXAxis(d, thisGroup, graphHeight, x)
                xAxis.attr("class", "x-axis") */
        
                // Add links
                let p = 2 * (Math.PI * innerRadius) / data.length
                const links = drawLinks(d, thisGroup, p, graphWidth, x)
            
        
            })
        
        }) 
        
        
    }, [width, height, svgRef.current]) // redraw chart if data changes

    return <svg ref={svgRef}/>
}

export default CollectionOfTunesRangeChart;