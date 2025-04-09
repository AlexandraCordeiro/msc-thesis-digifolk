import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// set the dimensions and margins of the graph
const svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
margin = svgWidth * 0.1,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 2

const hzToNoteId = (freq) => {
    // formula hz to note (midi note)
    let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    let note = Math.round(12 * Math.log2((freq / 440)) + 69)
    let octave = Math.floor((note / 12) - 1)
    let noteIndex = (note % 12)
    let name = noteNames[noteIndex] + octave
    return getNoteId(name)

}
const getNoteId = (n) => {
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

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const audioVsScore = svg.append("g")
.attr("id", "audio-vs-score")
.attr("width", graphWidth)
.attr("height", graphHeight)
.attr("transform", `translate(${svgWidth * 0.5 - graphWidth * 0.5})`)

const audioContour = audioVsScore.append("g")
.attr("id", "audio-contour")
// .attr("transform", `translate(0, ${svgHeight/2})`)

const scoreContour = audioVsScore.append("g")
.attr("id", "score-contour")
//.attr("transform", `translate(0, ${svgHeight/2})`)

// load data
d3.json("data.json").then(function(data) {
    const audioContourTime = data.melodic_contour[0].time
    const audioContourFrequency = data.melodic_contour[0].f0
    const audioContourDb = data.melodic_contour[0].f0_db
    const scoreContourTime = data.score_contour.map(d => d.end)


    const x = (domain) => {
        return d3.scaleLinear()
        .range([0, graphWidth])
        .domain(domain)
    }
    
    const y = (domain) => {
        return d3.scaleLinear()
        .range([graphHeight, 0])
        .domain(domain)
    }
    
    const xAudio = x([d3.min(audioContourTime), d3.max(audioContourTime)])
    const yAudio = y([getNoteId("C2"), getNoteId("C7")])
    
    const xScore = x([0, d3.max(scoreContourTime)])
    const yScore = y([getNoteId("C2"), getNoteId("C7")])

    const variableThickness = d3.scaleLinear()
    .range([2, 6])
    .domain([d3.min(audioContourDb), d3.max(audioContourDb)])

    const processAudioData = data.melodic_contour[0].time.map((d, i) => ({"time": +audioContourTime[i], "f0": +audioContourFrequency[i], "db": +audioContourDb[i]}))

    const areaGenerator = d3.area()
    .defined(d => d.f0 && d.f0 > 0)
    .x(d => xAudio(d.time))
    .y0(d => yAudio(hzToNoteId(d.f0)) - 4)
    .y1(d => yAudio(hzToNoteId(d.f0)) + 4)
    .curve(d3.curveBasis)

    const lineGenerator = d3.line()
    .defined(d => d.note)
    .x(d => xScore(+d.start))
    .y(d => yScore(getNoteId(d.note)))

    audioContour.append("path")
    .datum(processAudioData)
    .attr("fill", "lightblue")
    .attr("fill-opacity", 0.7)
    .attr("d", d => areaGenerator(d))

    scoreContour.append("path")
    .datum(data.score_contour)
    .attr("stroke", "black")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("d", d => lineGenerator(d))

    audioVsScore.append("g")
    .call(d3.axisLeft(yScore));

    const audioContourWidth = d3.select('#audio-contour').node().getBoundingClientRect().width
    const scoreContourWidth = d3.select('#score-contour').node().getBoundingClientRect().width

    audioContour.attr("transform", `translate(${graphWidth * 0.5 - audioContourWidth * 0.5})`)
    scoreContour.attr("transform", `translate(${graphWidth * 0.5 - scoreContourWidth * 0.5})`)

})
