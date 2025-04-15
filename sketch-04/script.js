import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// set the dimensions and margins of the graph
const svgWidth = window.innerWidth,
svgHeight = window.innerHeight,
margin = svgWidth * 0.2,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 3

const getStartTime = (f0, time) => {
    for (let i = 0; i < f0.length - 1; i++) {
        console.log(i)
        if (f0[i] == 0 && f0[i + 1] > 0) {
            return time[i]
        }
    }
    return time[0]

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

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const audioVsScore = svg.append("g")
.attr("id", "audio-vs-score")
.attr("width", graphWidth)
.attr("height", graphHeight)
.attr("transform", `translate(${svgWidth * 0.5 - graphWidth * 0.5}, ${svgHeight * 0.5 - graphHeight * 0.5})`)

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

    const startOffset = getStartTime(audioContourFrequency, audioContourTime)

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
    
    const findMinMax = [d3.max(audioContourFrequency.filter(d => d > 0).map(d => hzToMidi(d))),
                        d3.min(audioContourFrequency.filter(d => d > 0).map(d => hzToMidi(d))),
                        d3.max(data.score_contour.map(d => noteToMidi(d.note))),
                        d3.min(data.score_contour.map(d => noteToMidi(d.note)))]

    const xAudio = x([d3.min(audioContourTime), d3.max(audioContourTime)])
    const yAudio = y([d3.min(findMinMax), d3.max(findMinMax)])
    
    const xScore = x([0, d3.max(scoreContourTime)])
    const yScore = y([d3.min(findMinMax), d3.max(findMinMax)])

    const variableThickness = d3.scaleLinear()
    .range([2, 6])
    .domain([d3.min(audioContourDb), d3.max(audioContourDb)])


    const processAudioData = data.melodic_contour[0].time.map((d, i) => ({"time": +audioContourTime[i] - startOffset, "f0": +audioContourFrequency[i], "db": +audioContourDb[i]}))

    const areaGenerator = d3.area()
    .defined(d => +d.f0)
    .x(d => xAudio(d.time))
    .y0(d => yAudio(hzToMidi(d.f0)) - 3)
    .y1(d => yAudio(hzToMidi(d.f0)) + 3)
    .curve(d3.curveBasis)

    const lineGenerator = d3.line()
    .defined(d => noteToMidi(d.note))
    .x(d => xScore(+d.time))
    .y(d => yScore(noteToMidi(d.note)))

    audioContour.append("path")
    .datum(processAudioData)
    .attr("fill", "black")
    .attr("fill-opacity", 0.7)
    .attr("d", d => areaGenerator(d))

    console.log(data.score_contour.flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])))
    scoreContour.append("path")
    .datum(data.score_contour.flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])))
    .attr("stroke", "black")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("d", d => lineGenerator(d))

    scoreContour.selectAll("circle")
    .data(data.score_contour.flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])))
    .enter()
    .append("circle")
    .attr("fill", "black")
    .attr("cx", d => xScore(+d.time))
    .attr("cy", d => yScore(noteToMidi(d.note)))
    .attr("r", graphWidth * 0.003)

    audioVsScore.append("g")
    .attr("transform", `translate(${-graphWidth * 0.02},0)`)
    .attr("class", "jost-regular")
    .call(d3.axisLeft(yScore).ticks(6).tickFormat(d => midiToNote(d)))

    audioVsScore.append("g")
    .attr("class", "jost-regular")
    .call(d3.axisBottom(xScore).tickFormat(d => d + "s"))
    .attr("transform", `translate(0, ${graphHeight + 10})`)


    const audioContourWidth = d3.select('#audio-contour').node().getBoundingClientRect().width
    const scoreContourWidth = d3.select('#score-contour').node().getBoundingClientRect().width

    audioContour.attr("transform", `translate(${graphWidth * 0.5 - audioContourWidth * 0.5})`)
    scoreContour.attr("transform", `translate(${graphWidth * 0.5 - scoreContourWidth * 0.5})`)

})
