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
    

d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("style", "position: absolute; opacity: 0;");

const setOfTokensFromString = (text) => {
    return new Set(text.split(/\s/g))
}

const arrayOfTokensFromString = (text) => {
    return text.split(/\s/g)
}

const cleanString = (text) => {
    return text.replace(/[^'’a-zA-Z\s]/g, '')
}

const wrapText = (text) => {
   return text.split("\n")
}
const randomColor = () => {
    let r, g, b
    r = d3.randomUniform(256)()
    g = d3.randomUniform(256)()
    b = d3.randomUniform(256)()
    return d3.rgb(r, g, b)
}

const getTextLength = (str, fontSize, group) => {
    let length

    const temp = group.append("text")
    .attr("x", -999)
    .attr("y", -999)
    .style("visibility", "hidden")
    .attr("font-size", fontSize)
    .text(str)

    length = temp.node().getComputedTextLength()
    temp.remove()
    return length
}


const mouseOver = (e, d) => {
    d3.select("#tooltip")
        .transition()
        .duration(200)
        .style("opacity", 1)
        .text(`${d}`);
}
  
const mouseMove = (e, d) => {
    d3.select("#tooltip")
        .style("left", e.pageX + 10 + "px")
        .style("top", e.pageY + 10 + "px");
}
  
const mouseOut = (e, d) => {
    d3.select("#tooltip").style("opacity", 0);
}

// load data
d3.csv("data.csv").then(function(data) {
    let song = data[15]
    
    let songTokens = arrayOfTokensFromString(cleanString(song.lyrics))
    
    let setOfTokens = d3.shuffle(Array.from(setOfTokensFromString(cleanString(song.lyrics.toLowerCase()))))
    console.log(setOfTokens)
    let numOfTokens = songTokens.length
    // console.log(numOfTokens)
    
    const color = d3.scaleSequential()
    .domain([0, setOfTokens.length - 1])
    .interpolator(d3.interpolateSinebow)

    let colors = {}

    for (let i = 0; i < setOfTokens.length; i++) {
        console.log(color(i))
        colors[setOfTokens[i]] = color(i)
    }

    console.log(colors)

    // console.log(colors)
    let graphWidth = svgHeight * 0.75,
    graphHeight = graphWidth
    
    const zoomContainer = svg.append("g").attr("id", "zoom-container")
    // .attr("transform", `translate(${svgWidth / 2 - graphWidth / 2}, ${svgHeight / 2 - graphHeight / 2})`)

    const similarityMatrix = zoomContainer.append("g")
    .attr("id", "similarity-matrix")

    
    let size = graphWidth / ((numOfTokens - 1) * 2.5)
    let padding = 1.5 * size

    
    let axis = d3.scaleLinear().domain([0, numOfTokens - 1]).range([0, graphWidth])

    similarityMatrix.selectAll("circles")
    .data(songTokens)
    .enter()
        .append("g")
        .attr("id", (d, i) => `row-${i}`)
        .each(function(d, i) {

            const row = d3.select(this)
            let color

            
            for (let j = 0; j < numOfTokens; j++) {
                if (songTokens[i] === songTokens[j]) {
                    color = colors[songTokens[i].toLowerCase()]
                }else {
                    color = "#f0f0f0"
                }
                row.append("circle")
                // row.append("rect")
                .attr("id", `col-${j}`)
                // .attr("x", j * (size + padding) + (size / 2))
                // .attr("y", i * (size + padding) - (size / 2))
                // .attr("width", size * 2.5)
                // .attr("height", size * 2.5)
                .attr("cx", j * (size + padding))
                .attr("cy", i * (size + padding))
                .attr("r", size)
                .attr("fill", color)
                .on("mouseover", e => mouseOver(e, songTokens[i]))
                .on("mouseout", e => mouseOut(e, songTokens[i]))
                .on("mousemove", e => mouseMove(e, songTokens[i]));
            }
        })


        const songLyrics = svg.append("g")
        .attr("id", "song-lyrics")
        .attr("transform", `translate(${graphWidth + 50}, 50)`)
        

        /* songLyrics.selectAll("text")
        .data(wrapText(song.lyrics))
        .enter()
        .each(function(d, i) {
            let line = d3.select(this)
            
            // console.log(d)
            let tokens = arrayOfTokensFromString(cleanString(d))
            let start = 0
            // console.log(tokens)
            
            for (let j = 0; j < tokens.length; j++) {
                line.append("text")
                .text(tokens[j])
                .attr("x", start)
                .attr("y", i * getTextLength("AA"))
                .style("fill", colors[tokens[j].toLowerCase()])
                start += getTextLength(tokens[j] + "a")
            }
        }) */
    
        
        
        

        const xAxis = svg.append("g").attr("id", "x-axis")
        const yAxis = svg.append("g").attr("id", "y-axis")

        const zoom = zoomBehavior(axis, numOfTokens, xAxis, yAxis, zoomContainer, graphWidth, songTokens)

        svg.call(zoom)
        zoom.transform(svg, d3.zoomIdentity.translate(
            window.innerWidth / 2 - graphWidth / 2,
            window.innerHeight / 2 - graphHeight / 2
        ));
})


function zoomBehavior(axis, numOfTokens, xAxis, yAxis, zoomContainer, graphWidth, songTokens)  {
    let lastK = -1
    
    return d3.zoom()
    .scaleExtent([1, 11])
    .on("zoom", (event) => {
        
        // update coordinates
        let axisInnerPadding = -15

        zoomContainer.attr("transform", event.transform)
        xAxis.attr("transform", `translate(${event.transform.x}, ${event.transform.y + axisInnerPadding})`)
        yAxis.attr("transform", `translate(${event.transform.x + axisInnerPadding}, ${event.transform.y})`)

        // when zoom in/out
        if (event.transform.k != lastK) {
            // update last k
            lastK = event.transform.k

            // update scale
            let updateScale = event.transform.rescaleX(axis)
            let currentDomain = updateScale.domain()
            let fontSize = 14
            let newScale = updateScale

            if (currentDomain[0] < 0) {
                newScale = d3.scaleLinear()
                .domain([0, numOfTokens - 1])
                .range([0, graphWidth * event.transform.k])
            }

            // display x axis (semantic zoom)
            xAxis
            .attr("stroke-width", "1px")
            .call(
                d3.axisTop(newScale)
                .tickValues(d3.range(0, numOfTokens, 12 - parseInt(event.transform.k)))
                .tickFormat(d => songTokens[d])
            )

            xAxis.selectAll("text")
            .attr("transform", "rotate(-45)")
            .attr("class", "lato-regular")
            .style('text-anchor', 'start')
            .style("font-size", `${fontSize}px`)

            // display y axis (semantic zoom)
            yAxis
            .attr("stroke-width", "1px")
            .call(
                d3.axisLeft(newScale)
                .tickValues(d3.range(0, numOfTokens, 12 - parseInt(event.transform.k)))
                .tickFormat(d => songTokens[d])
            )

            yAxis.selectAll("text")
            .attr("class", "lato-regular")
            .style('text-anchor', 'end')
            .style("font-size", `${fontSize}px`)
        }
    
    })


    
}