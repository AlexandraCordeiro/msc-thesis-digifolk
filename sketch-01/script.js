import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// set the dimensions and margins of the graph
const margin = 50,
svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 2

let textureCircles = textures.circles()
.size(10)
.radius(2)
.fill("firebrick")

const noteToMidi = (n) => {
    if (!n) {return 0}
    let octave = parseInt(n.match(new RegExp("[0-9]+"))[0])
    let acc = n.match(new RegExp("[#b]"))
    acc ? acc = acc[0] : acc = ""

    let note = n.match(new RegExp("[a-zA-Z]+"))[0]

    const noteValues = {
        'C': 0, 'C#': 1, 'Db': 1,
        'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 
        'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8,
        'A': 9, 'A#': 10, 'Bb': 10,
        'B': 11
    }

    return noteValues[note + acc] + (parseInt(octave) + 1) * 12
}

// append the svg object to the body of the page
const svg = d3.select("#viz")
.append("svg")
.attr("width", svgWidth)
.attr("height", svgHeight)


svg.call(textureCircles)

const group = svg.append("g")
.attr("id", "center")
.attr("transform", `translate(${margin / 2},${graphHeight})`)

// load data
d3.json("harmonic_intervals_data.json").then(function(data) {

    // List of node names
    const allIds = data.nodes.map(d => d.id)
    let extent = d3.extent(allIds)

    // A linear scale to position the nodes on the X axis
    const x = d3.scaleLinear()
    .domain(extent)
    .range([0, graphWidth])
        

    // Add links between nodes
    const idToNode = {};
    data.nodes.forEach(function (n) {
        idToNode[n.id] = n;
    });


    const colorGradient = d3.scaleLinear()
    .domain([0, data.links.length - 1])
    .range(["#009FFF", "#ec2F4B"])

    // Add the links
    const links = group
    .append('g')
    .attr('id', 'links')
    .selectAll('links')
    .data(data.links)
    .join('path')
    .attr('d', (d, i) => {
        console.log('index', i, 'color:', colorGradient(i));
        let y = 0
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

    // add frequency rings
    const rings = group
    .append('g')
    .attr('id', 'rings')
    .selectAll('g')
    .data(data.nodes.filter(d => d.frequency > 0))
    .enter()
        .append('g')
        .attr('id', d => 'ring-'+ d.name)
        .selectAll('circle')
        .data(d => {
            let map = new Map()
            for (let i = 0; i < d.frequency; i++) {
                map.set(i, d.id)
            }
            // console.log(map)
            return map;
        })
        .enter()
            .append('circle')
            .attr('cx', d => x(d[1]))
            .attr('cy', -(graphHeight * 0.4))
            .attr('r', d => 5 * (d[0] + 1))
            .style('stroke', (d, i) => colorGradient(i))
            .attr("stroke-width", "0.15rem")
            .style('fill', 'none')
  

    const measures = data.note_frequency_by_measure.flatMap(d => d.measures.map(m => m.measure))
    
    const sparklineSize = graphWidth * 0.025

    const xHistogram = d3.scaleLinear()
    .range([0, sparklineSize])
    .domain([d3.min(measures), d3.max(measures)])

    const yHistogram = d3.scaleLinear()
    .range([0, -sparklineSize])
    .domain([0, d3.max(data.note_frequency_by_measure.flatMap(d => d.measures.map(m => m.counter)))])

    const sparklines = group.append('g')
        .attr('id', 'sparklines')
    
    const areaGenerator = d3.area()
    .x(d => xHistogram(d.measure))
    .y0(yHistogram(0))
    .y1(d => yHistogram(d.counter))
    .curve(d3.curveBasis)

    // display x axis
    const noteNamesAxis = group.append("g")
    .attr('class', 'jost-regular')
    .attr("id", "note-names-x-axis")
 
    noteNamesAxis
    .call(
        d3.axisBottom(x)
        .tickValues(data.nodes.map(d => d.id)) 
        .tickFormat(d => {
            const match = data.nodes.find(n => n.id === d);
            return match ? match.name : "";
        })
        .tickPadding(graphHeight * 0.15)
    );

    // Iterate through each note
    data.note_frequency_by_measure.forEach(note => {

        const histogram = sparklines.append('g')
        .attr('transform', `translate(${x(note.id) - sparklineSize / 2}, ${graphHeight * 0.5})`)

        histogram.append("path")
        .datum(note.measures)
        .attr("fill", "#009FFF")
        .attr("d", d => areaGenerator(d))

        histogram.append("g")
        .call(d3.axisBottom(xHistogram).ticks(d3.range(d3.min(measures), d3.max(measures) + 1).length))
        .attr('class', 'jost-regular')

        histogram.append("g")
        .call(d3.axisLeft(yHistogram).ticks(d3.range(d3.min(measures), d3.max(measures) + 1).length))
        .attr('class', 'jost-regular')
        
    });  
})

