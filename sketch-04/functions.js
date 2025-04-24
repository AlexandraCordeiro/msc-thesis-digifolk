export const getStartOffset = (f0) => {

    for (let i = 0; i < f0.length - 1; i++) {
        if (f0[i] == 0 && f0[i + 1] > 0) {
            // save index for later
            return i + 1;
        }
    }
    return 0;

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

export const drawScoreContour = (data, group, lineGenerator, x, y, graphWidth) => {
    group.append("path")
    .datum(data.flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])))
    .attr("stroke", "black")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("d", d => lineGenerator(d))

    group.selectAll("circle")
    .data(data.flatMap(d => ([{"note": d.note, "time": +d.start}, {"note": d.note, "time": +d.end}])))
    .enter()
    .append("circle")
    .attr("fill", "black")
    .attr("cx", d => x(+d.time))
    .attr("cy", d => y(noteToMidi(d.note)))
    .attr("r", graphWidth * 0.003)
}

export const drawAudioContour = (data, group, areaGenerator) => {
    group.append("path")
    .datum(data)
    .attr("fill", "black")
    .attr("fill-opacity", 0.7)
    .attr("d", d => areaGenerator(d))
}
