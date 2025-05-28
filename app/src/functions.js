import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export const noteToMidi = (n) => {
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

export const hzToMidi = (freq) => {
    // formula hz to note (midi note)
    let midi = Math.round(12 * Math.log2((freq / 440)) + 69)
    let name = midiToNote(midi)
    return noteToMidi(name)
}


export const midiToNote = (midi) => {
    let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    let octave = Math.floor((midi / 12) - 1)
    let noteIndex = (midi % 12)
    return noteNames[noteIndex] + octave
}

export const radsToDegrees = (rads) => {
    return (rads * 180) / Math.PI
}

// Get point in global SVG space
export function cursorPoint(evt, svg){
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

export function drawLinks(data, group, graphHeight, graphWidth, x) {

    let opacityScale = d3.scaleLinear()
    .range([0, 1])
    .domain([d3.min(data.links.map(d => d.count)), d3.max(data.links.map(d => d.count))])

    let colorScale = d3.scaleLinear()
    .range(["#833AB4", "#ce3e2b"])
    .domain([noteToMidi("C2"), noteToMidi("C7")])

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
    .attr("stroke", d => colorScale((x(idToNode[d.source].id) + x(idToNode[d.target].id)) / 2))
    .attr("stroke-width", "0.05rem"/* d => d.count */)
    .attr("stroke-opacity", d => opacityScale(d.count))

    return links
}

export function drawNoteFrequencyRings(data, group, graphWidth, x, colorGradient) {
    group
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
            return map;
        })
        .enter()
            .append('circle')
            .attr('cx', d => x(d[1]))
            .attr('cy', -graphWidth * 0.1)
            .attr('r', d => 4 * (d[0] + 1)) 
            .style('stroke', (d, i) => colorGradient(i))
            .attr("stroke-width", "0.08rem")
            .style('fill', 'none')
}

export function drawSparklines(data, group, graphHeight, graphWidth, x, id) {

    let note = data.note_frequency_by_measure.find(d => d.id === id)

    if (note) {
        const sparklineSize = graphWidth * 0.1
        const measures = data.note_frequency_by_measure.flatMap(d => d.measures.map(m => m.measure))
    
    
        const xHistogram = d3.scaleLinear()
        .range([0, sparklineSize])
        .domain([d3.min(measures), d3.max(measures)])
    
        const yHistogram = d3.scaleLinear()
        .range([0, -sparklineSize])
        .domain([0, d3.max(data.note_frequency_by_measure.flatMap(d => d.measures.map(m => m.counter)))])
    
        const sparklines = group.append('g')
        .attr('id', 'sparklines')
        .attr("color", "black")
    
        const areaGenerator = d3.area()
        .x(d => xHistogram(d.measure))
        .y0(yHistogram(0))
        .y1(d => yHistogram(d.counter))
        .curve(d3.curveBasis)
    
        
        const histogram = sparklines.append('g')
        const range = d3.range(d3.min(measures), d3.max(measures) + 1)
        let numTicks = range.length


        if (numTicks >= 6) numTicks = 5;

        histogram.append("path")
        .datum(note.measures)
        .attr("fill", "#009FFF")
        .attr("d", d => areaGenerator(d))
    
        histogram.append("g")
        .attr("id", "histogram-x-axis")
        .call(d3.axisBottom(xHistogram).ticks(numTicks).tickFormat(d3.format("d")))
        .attr('style', 'font-family: montserrat')

        
        histogram.append("g")
        .attr("id", "histogram-y-axis")
        .call(d3.axisLeft(yHistogram).ticks(numTicks).tickFormat(d3.format("d")))
        .attr('style', 'font-family: montserrat')


        // x label
        histogram.append("g")
        .attr("id", "x-label")
        .append("text")
        .attr('class', 'sparkline-labels')
        .text("Measure")
        .attr("x", sparklineSize / 2)
        .attr("y", 30)


        // y label
        histogram.append("g")
        .attr("id", "y-label")
        .append("text")
        .attr('class', 'sparkline-labels')
        .text("Count")
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform", `translate(${-20}, ${-sparklineSize / 2}) rotate(-90) `)


        histogram.attr("transform", `translate(${graphWidth / 2}, ${sparklineSize / 3.5})`)

    }

}

export function drawXAxis(data, group, graphHeight, x) {
    // display x axis
    const noteNamesAxis = group.append("g")
    .attr('style', 'font-family: montserrat')
    .attr("id", "note-names-x-axis")

    noteNamesAxis
    .call(
        d3.axisBottom(x)
        .tickValues([])
        .tickFormat(0)
    );

    return noteNamesAxis
}