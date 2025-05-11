import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// set the dimensions and margins of the graph
const svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
margin = svgWidth * 0.2
/* graphWidth = svgWidth - margin,
graphHeight = svgHeight / 3 */

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const group = svg.append("g")
.attr("id", "tokens-matrix")
/* .attr("width", graphWidth)
.attr("height", graphHeight) */
//.attr("transform", `translate(${svgWidth * 0.5 - graphWidth * 0.5}, ${svgHeight * 0.5 - graphHeight * 0.5})`)

const setOfTokensFromString = (text) => {
    return new Set(text.split(/\s/g))
}

const arrayOfTokensFromString = (text) => {
    return text.split(/\s/g)
}

const cleanString = (text) => {
    return text.replace(/[^a-zA-Z\s]/g, '')
}

const randomColor = () => {
    let r, g, b
    r = d3.randomUniform(256)()
    g = d3.randomUniform(256)()
    b = d3.randomUniform(256)()
    return d3.rgb(r, g, b)
}

// load data
d3.csv("data.csv").then(function(data) {

    
    let song = data[20]
    
    let songTokens = arrayOfTokensFromString(cleanString(song.tokens))
    // console.log(songTokens)
    
    let setOfTokens = setOfTokensFromString(cleanString(song.tokens))
    
    let numOfTokens = songTokens.length
    // console.log(numOfTokens)
    
    const color = d3.scaleSequential()
    .domain([0, setOfTokens.size - 1])
    .interpolator(d3.interpolateRainbow)

    let colors = {}

    for (let i = 0; i < setOfTokens.size; i++) {
        colors[Array.from(setOfTokens)[i]] = color(i)
    }
    console.log(colors)

    // console.log(colors)
    let graphWidth = svgHeight * 0.7,
    graphHeight = graphWidth
    
    let size = graphWidth / ((numOfTokens - 1) * 2.5)
    let padding = 1.5 * size

    
    let axis = d3.scaleLinear().domain([0, numOfTokens - 1]).range([0, graphWidth])

    group.attr("transform", `translate(${svgWidth / 2 - graphWidth / 2}, ${svgHeight / 2 - graphHeight / 2})`)

    group.selectAll("circles")
    .data(songTokens)
    .enter()
        .append("g")
        .attr("id", (d, i) => `row-${i}`)
        .each(function(d, i) {

            const row = d3.select(this)
            let color

            
            for (let j = 0; j < numOfTokens; j++) {
                if (songTokens[i] === songTokens[j]) {
                    color = colors[songTokens[i]]
                }else {
                    color = "lightgray"
                }
                row.append("circle")
                .attr("id", `col-${j}`)
                .attr("cx", j * (size + padding))
                .attr("cy", i * (size + padding))
                .attr("r", size)
                .attr("fill", color)
            }
        })

        
        /*
        const axisInnerPadding = graphWidth * 0.05

        const xAxis = group.append("g").attr("id", "x-axis")
        .attr("transform", `translate(0, -${axisInnerPadding})`)
        .call(
            d3.axisTop(axis)
            .tickValues(d3.range(numOfTokens))
            .tickFormat(d => songTokens[d])
        )
        xAxis.selectAll("text")
        .attr("transform", "translate(0, -20) rotate(-45)")
        .attr("class", "jost-regular")

        
        const yAxis = group.append("g").attr("id", "y-axis")
        .attr("transform", `translate(-${axisInnerPadding}, 0)`)
        .call(
            d3.axisLeft(axis)
            .tickValues(d3.range(numOfTokens))
            .tickFormat(d => songTokens[d])
        )
        
        yAxis.selectAll("text")
        .attr("transform", "translate(-20, 0) rotate(-45)")
        .attr("class", "jost-regular")
        */





    /* for (let i = 0; i < numOfTokens; i++) {
        for (let j = 0; j < numOfTokens; j++) {
            let cell = group.append("circle")
            .attr("id", `col${i}xrow${j}`)
            .attr("cx", i * (size + padding))
            .attr("cy", j * (size + padding))
            .attr("r", size)
            .attr("fill", "red")
        }
    } */






})


