import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// set the dimensions and margins of the graph

const svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
graphHeight = svgHeight / 2,
graphWidth = graphHeight


const radsToDegrees = (rads) => {
    return (rads * 180) / Math.PI
}

const getStartOffset = (f0) => {

    for (let i = 0; i < f0.length - 1; i++) {
        if (f0[i] == 0 && f0[i + 1] > 0) {
            // save index for later
            return i + 1;
        }
    }
    return 0;

}

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

const hzToMidi = (freq) => {
    // formula hz to note (midi note)
    let midi = Math.round(12 * Math.log2((freq / 440)) + 69)
    let name = midiToNote(midi)
    return noteToMidi(name)
}


const midiToNote = (midi) => {
    let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    let octave = Math.floor((midi / 12) - 1)
    let noteIndex = (midi % 12)
    return noteNames[noteIndex] + octave
}

// create svg
const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)


const viz = svg.append("g")
.attr("id", "audio-vs-score")
.attr("width", graphWidth)
.attr("height", graphHeight)
.attr("transform", `translate(${svgWidth * 0.5}, ${svgHeight * 0.5})`)

const spectogram = viz
    .append("g")
    .attr("id", "spectogram")

const audioContour = viz.append("g")
.attr("id", "melodic-contour")

const scoreContour = viz.append("g")
.attr("id", "score-contour")

// load data
d3.json("data.json").then(function(data) {
    
    const innerRadiusSpectogram = graphWidth * 0.35
    const outerRadiusSpectogram = graphWidth * 0.9
    
    const maxDb = d3.max(data.audio_spectogram_data.map(d => +d.db))
    const minDb = d3.min(data.audio_spectogram_data.map(d => +d.db))

    // audio contour
    // ignore initial silence
    const offsetIndex = getStartOffset(data.melodic_contour[0].f0)
    const audioContourTime = data.melodic_contour[0].time.slice(offsetIndex)
    const audioContourFrequency = data.melodic_contour[0].f0.slice(offsetIndex)
    const audioContourDb = data.melodic_contour[0].f0_db
    
    // spectogram data
    const groupDataByTime = Array.from(d3.group(data.audio_spectogram_data.filter(d => +d.time >= audioContourTime[offsetIndex]), d => +d.time)).flatMap(d => d[1])
    const spectogramTimeDomain = [audioContourTime[offsetIndex], d3.max(audioContourTime)]
    const spectogramFrequencyDomain = d3.extent(data.audio_spectogram_data, d => +d.freq)

    // score
    const scoreContourTime = data.score_contour.map(d => d.end)
    const findMinMax = [d3.max(audioContourFrequency.filter(d => d > 0).map(d => hzToMidi(d))),
        d3.min(audioContourFrequency.filter(d => d > 0).map(d => hzToMidi(d))),
        d3.max(data.score_contour.map(d => noteToMidi(d.note))),
        d3.min(data.score_contour.map(d => noteToMidi(d.note)))]
        
    const audioContourTimeDomain = [d3.min(audioContourTime), d3.max(audioContourTime)]
    const audioContourFrequencyDomain = [d3.min(audioContourFrequency), d3.max(audioContourFrequency)]

    // X scale
    // starts at 12 o'clock
    var x = (domain) => {
        return d3.scaleLinear()
        .range([(-Math.PI/2), (-Math.PI/2) + (2*Math.PI)])             
        .domain(domain)
    }
    
        
    // Y scale
    var y = (innerRadius, outerRadius, domain) => {
        return d3.scaleRadial()
        .range([innerRadius, outerRadius])   
        .domain(domain)
        .nice()
    }


    var yScore = y(innerRadiusSpectogram, outerRadiusSpectogram, /* [d3.min(findMinMax), d3.max(findMinMax)] */ [noteToMidi("C2"), noteToMidi("C7")])
    var xScore = x([0, d3.max(data.score_contour.map(d => d.end))])


    const colorScale = d3.scaleLinear(["red", "black"])
        .domain([minDb, maxDb])

    const opacityScale = d3
        .scaleLog()
        .domain([1, maxDb + 1 + Math.abs(minDb)])
        .range([0, 1])

    let dbThreshold = 35

    const radiusScale = d3
        .scaleLog()
        .domain([1, maxDb + 1 + Math.abs(minDb)])
        .range([0, 2])


    const variableThickness = d3
        .scaleLinear()
        .domain([d3.min(data.melodic_contour[0].f0_db), d3.max(data.melodic_contour[0].f0_db)])
        .range([0, graphWidth * 0.005])

    
    let xAudio = x(audioContourTimeDomain)

        
    let areaGenerator = d3.areaRadial()
        // angle 0 starts at 12 o'clock
        .angle(d => xAudio(d.time) + Math.PI / 2) 
        .innerRadius(d => yScore(hzToMidi(+d.f0)) - 3)  
        .outerRadius(d => yScore(hzToMidi(+d.f0)) + 3)
        .defined(d => +d.f0) 
        .curve(d3.curveBasis); 

    audioContour.append("path")
      .datum(audioContourTime.map((d, i) => ({"time": +d, "f0": +audioContourFrequency[i], "db": +audioContourDb[i]})))
      .attr("fill", "black")
      .attr("fill-opacity", 0.8)
      .attr("d", d => areaGenerator(d))
    
/*     let scoreContourGenerator = d3.line()
        .x(d => yScore(noteToMidi(d.note)) * Math.cos(xScore(+d.time)))
        .y(d => yScore(noteToMidi(d.note)) * Math.sin(xScore(+d.time)))
        // to smooth the line
        // .curve(d3.curveBasis); */

    scoreContour.selectAll("line")
        .data(data.score_contour/* .flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])) */)
        /* .attr("d", d => scoreContourGenerator(d)) */
        .enter()
        .append("line")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", graphWidth * 0.004)
        .attr("x1", d => yScore(noteToMidi(d.note)) * Math.cos(xScore(+d.start)))
        .attr("y1", d => yScore(noteToMidi(d.note)) * Math.sin(xScore(+d.start)))
        .attr("x2", d => yScore(noteToMidi(d.note)) * Math.cos(xScore(+d.end)))
        .attr("y2", d => yScore(noteToMidi(d.note)) * Math.sin(xScore(+d.end)))

    
    scoreContour.selectAll(".scoreNotes")
        .data(data.score_contour.flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])))
        .enter()
            .append("circle")
            .attr("cx", d => yScore(noteToMidi(d.note)) * Math.cos(xScore(+d.time)))
            .attr("cy", d => yScore(noteToMidi(d.note)) * Math.sin(xScore(+d.time)))
            .attr("fill", "black")
            .attr("r", graphWidth * 0.01)
        

    
    let ySpectogram = y(innerRadiusSpectogram, outerRadiusSpectogram, spectogramFrequencyDomain)
    let xSpectogram = x(spectogramTimeDomain)
    const n = Math.floor(groupDataByTime.length / 513)

    spectogram.selectAll("circle")
        .data(groupDataByTime)
        .enter()
        .each(function (d, i) {
            // ignore 
            if (!(+d.db <= -dbThreshold || (+d.db > -5 && +d.db < 5)) && i % 5 == 0) {
                d3.select(this)
                .append("circle")
                .attr("cx", ySpectogram(+d.freq) * Math.cos(xSpectogram(+d.time)))
                .attr("cy", ySpectogram(+d.freq) * Math.sin(xSpectogram(+d.time)))
                .attr("r", (((ySpectogram(+d.freq) * 2 * Math.PI) / (n)) * 0.7) * radiusScale(+d.db + Math.abs(maxDb) + 1))
                .attr("fill", colorScale(+d.db))
                .attr("fill-opacity", opacityScale(+d.db + Math.abs(maxDb) + 1) * 0.5)
            }
        })
   
    
    let yAxis = viz.append("g")
    .attr("id", "y-axis")
    .attr("class", "montserrat-bold")
    .call(d3.axisLeft(yScore).ticks(5).tickFormat(d => midiToNote(d)))
    .attr("transform", "rotate(180)")
    .selectAll("text") 
    .attr("transform", "rotate(180)")

    let xAxisRadius = innerRadiusSpectogram - 7

    let xAxis = viz.append("g")
    .attr("id", "x-axis")
    .attr("class", "montserrat-regular")
    
    xAxis.append("g")
    .attr("id", "axisBottom")
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", (xAxisRadius))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)

    let ticks = []
    for (let i = 0; i < parseInt(d3.max(scoreContourTime)); i++) {
        ticks.push(i)
    }

    xAxis.selectAll("g")
    .attr("id", "axisBottomTicks")
    .data(ticks)
    .enter()
    .append("line")
    .attr("x1", d => (xAxisRadius) * Math.cos(xScore(d)))
    .attr("y1", d => (xAxisRadius) * Math.sin(xScore(d)))
    .attr("x2", d => ((xAxisRadius) - 5) * Math.cos(xScore(d)))
    .attr("y2", d => ((xAxisRadius) - 5) * Math.sin(xScore(d)))
    .attr("stroke", "black")
    .attr("stroke-width", 1)

    xAxis.selectAll("text")
    .attr("id", "axisLabels")
    .data(ticks)
    .enter()
    .append("text")
    .text(d => d + "s")
    .attr("x", d => ((xAxisRadius) - 20) * Math.cos(xScore(d)))
    .attr("y", d => ((xAxisRadius) - 20) * Math.sin(xScore(d)))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("class", "montserrat-regular")


    let beats = viz.append("g")
    .attr("id", "beats")

    let onsets = viz.append("g")
    .attr("id", "onsets")


    console.log(audioContourTime[offsetIndex])
    onsets.selectAll("circles")
    .data(data.onset_times.filter(d => +d >= audioContourTime[offsetIndex]))
    .enter()
    .append("path")
    .attr("d", d3.symbol(d3.symbolTriangle))
    .attr("transform", d => `translate(${(outerRadiusSpectogram + 7) * Math.cos(xAudio(+d))}, ${(outerRadiusSpectogram + 7) * Math.sin(xAudio(+d))}) rotate(${radsToDegrees(xAudio(+d)) - 90}, 0, 0)`)
    .attr("fill", "black")
    .attr("fill-opacity", 0.7)
    .size(graphWidth * 0.05)
})