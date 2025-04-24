import {drawScoreContour, getStartOffset, hzToMidi, midiToNote, noteToMidi, drawAudioContour} from "./functions.js"
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

const audioContour = group.append("g")
.attr("id", "audio-contour")

const scoreContour = group.append("g")
.attr("id", "score-contour")

// load data
d3.json("data.json").then(function(data) {
    
    const offsetIndex = getStartOffset(data.melodic_contour[0].f0)
    const sliceAudioContourTime = data.melodic_contour[0].time.slice(offsetIndex)
    const startTime = sliceAudioContourTime[0]

    const audioContourTime = sliceAudioContourTime.map((d, i) => d - startTime)
    const audioContourFrequency = data.melodic_contour[0].f0.slice(offsetIndex)
    const audioContourDb = data.melodic_contour[0].f0_db

    const scoreContourTime = data.score_contour.map(d => d.end)
    const scoreContourNotes = data.score_contour.map(d => d.note)
    const audioTimeDomain = [0, d3.max(audioContourTime)]


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
    
    const minMaxValues = [d3.max(audioContourFrequency.filter(d => d > 0).map(d => hzToMidi(d))),
                        d3.min(audioContourFrequency.filter(d => d > 0).map(d => hzToMidi(d))),
                        d3.max(data.score_contour.map(d => noteToMidi(d.note))),
                        d3.min(data.score_contour.map(d => noteToMidi(d.note)))]

    // scales
    const xAudio = x(audioTimeDomain)
    const yAudio = y([d3.min(minMaxValues), d3.max(minMaxValues)])
    
    const xScore = x([0, d3.max(scoreContourTime)])
    const yScore = y([d3.min(minMaxValues), d3.max(minMaxValues)])

    const variableThickness = d3.scaleLinear()
    .range([2, 6])
    .domain([d3.min(audioContourDb), d3.max(audioContourDb)])

    const processAudioData = audioContourTime.map((d, i) => ({"time": +audioContourTime[i], "f0": +audioContourFrequency[i], "db": +audioContourDb[i]}))

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

    
    // draw audio and score contours
    // drawAudioContour(processAudioData, audioContour, areaGenerator)
    // drawScoreContour(data.score_contour, scoreContour, lineGenerator, xScore, yScore, graphWidth)

    // draw y axis
    group.append("g")
    .attr("transform", `translate(${-graphWidth * 0.02},0)`)
    .attr("class", "jost-regular")
    .call(d3.axisLeft(yScore).ticks(3).tickFormat(d => midiToNote(d)))


    // draw audio and score contour overlapping
    let firstNoteInScore = noteToMidi(scoreContourNotes[0])
    let firstNoteInAudio = hzToMidi(audioContourFrequency[0])
    
    let diff = Math.abs(firstNoteInAudio - firstNoteInScore)
    
    let alignScoreContour
    if (firstNoteInScore > firstNoteInAudio) {
        alignScoreContour = data.score_contour.map(d => ({...d, note: midiToNote(noteToMidi(d.note) - diff)}))
    }
    else {
        alignScoreContour = data.score_contour.map(d => ({...d, note: midiToNote(noteToMidi(d.note) + diff)}))
    }

    console.log(alignScoreContour)
    drawScoreContour(alignScoreContour, group, lineGenerator, xScore, yScore, graphWidth)
    drawAudioContour(processAudioData, audioContour, areaGenerator)
    
})
