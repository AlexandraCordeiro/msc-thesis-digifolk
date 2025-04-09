import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// set the dimensions and margins of the graph
const margin = 100,
svgWidth = window.innerWidth - 10,
svgHeight = window.innerHeight - 10,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 2

const getNoteId = (n) => {
    let octave = parseInt(n.match(new RegExp("[0-9]+"))[0])
    let acc = n.match(new RegExp("[#b]"))
    let note = n.match(new RegExp("[a-zA-Z]+"))

    let accidental = 0
    let dic = {'C': 1, 'D': 2, 'E': 3, 'F': 4, 'G': 5, 'A': 6, 'B': 7}

    if (acc == '#') {accidental += 0.5}
      
    if (acc == 'b'){accidental -= 0.5}
      

    return (octave * 6) + (accidental) + dic[note]
}

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

const spectogramGroup = svg
    .append("g")
    .attr("id", "spectogram")
    .attr("transform", `translate(${svgWidth/2}, ${svgHeight/2})`)

const melodicContour = svg.append("g")
    .attr("id", "melodic-contour")
    .attr("transform", `translate(${svgWidth/2}, ${svgHeight/2})`)

const scoreMelody = svg.append("g")
.attr("id", "score-melody")
.attr("transform", `translate(${svgWidth/2}, ${svgHeight/2})`)

// load data
d3.json("data.json").then(function(data) {
    const innerRadiusSpectogram = graphWidth * 0.05
    const outerRadiusSpectogram = graphHeight * 0.75
    const radiusMelodicContour = graphHeight * 0.5

    // scale domains
    const groupDataByTime = Array.from(d3.group(data.audio_spectogram_data, d => +d.time)).flatMap(d => d[1])
    const spectogramTimeDomain = [0, d3.max(data.audio_spectogram_data.flatMap(d => +d.time))]
    const spectogramFrequencyDomain = d3.extent(data.audio_spectogram_data, d => +d.freq)
    // console.log(spectogramFrequencyDomain)

    const melodicContourTimeDomain = [0, d3.max(data.melodic_contour[0].time)]
    const melodicContourFrequencyDomain = [d3.min(data.melodic_contour[0].f0), d3.max(data.melodic_contour[0].f0)]
    
    const maxDb = d3.max(data.audio_spectogram_data.map(d => +d.db))
    const minDb = d3.min(data.audio_spectogram_data.map(d => +d.db))

    // X scale
    var x = (domain) => {
        return d3.scaleLinear()
        .range([-Math.PI/2, -Math.PI/2 + 2 * Math.PI]) 
        // .align(0)                  
        .domain(domain)
    }
    
        
    // Y scale
    var y = (innerRadius, outerRadius, domain) => {
        return d3.scaleRadial()
        .range([innerRadius, outerRadius])   
        .domain(domain)
        .nice()
    }

    // diatonic scale form C2 to C7
    const c2Id = getNoteId("C2"), c7Id = getNoteId("C7");

    var diatonicScale = d3.scaleRadial()
        .range([(radiusMelodicContour), (radiusMelodicContour) * 2])
        .domain([c2Id, c7Id])

    var scoreTimeDomain = d3.scaleLinear()
        .range([-Math.PI/2, -Math.PI/2 + 2 * Math.PI])
        .domain([0, d3.max(data.score_melody.map(d => d.end))])

    /* const colorScale = d3
        .scaleLog()
        .domain([1, maxDb + 1 + Math.abs(minDb)])
        .range(['red', 'black']) */

    const colorScale = d3.scaleLinear(["lightblue", "black"])
        .domain([minDb, maxDb])

    const opacityScale = d3
        .scaleLog()
        .domain([1, maxDb + 1 + Math.abs(minDb)])
        .range([0, 1])
    
    /* const opacityScale = d3
        .scaleLinear()
        .domain([minDb, maxDb])
        .range(0, 1) */
    
    /* const radiusScale = d3
        .scaleLog()
        .domain([1, maxDb + 1 + Math.abs(minDb)])
        .range([0, 10]) */

    const radiusScale = d3
        .scaleLinear()
        .domain([minDb, maxDb])
        .range([0, graphWidth * 0.0015])


    const variableThickness = d3
        .scaleLinear()
        //.scaleSymlog()
        .domain([d3.min(data.melodic_contour[0].f0_db), d3.max(data.melodic_contour[0].f0_db)])
        .range([0, graphWidth * 0.005])

    
    let yScaleMelodicContour = y(radiusMelodicContour, radiusMelodicContour * 2, melodicContourFrequencyDomain)
    let xScaleMelodicContour = x(melodicContourTimeDomain)

    /* let lineGenerator = d3.line()
        .defined(d => +d.f0)
        .x(d => yScaleMelodicContour(+d.f0) * Math.cos(xScaleMelodicContour(+d.time)))
        .y(d => yScaleMelodicContour(+d.f0) * Math.sin(xScaleMelodicContour(+d.time)))
        // to smooth the line
        .curve(d3.curveBasis); */
        console.log("melodicContourFrequencyDomain:", melodicContourFrequencyDomain);
        console.log("yScaleMelodicContour range:", yScaleMelodicContour.range());
        
    let areaGenerator = d3.areaRadial()
        .angle(d => xScaleMelodicContour(+d.time)) 
        .innerRadius(d => yScaleMelodicContour(+d.f0) - 3)  // Adjust inner radius by dB
        .outerRadius(d => yScaleMelodicContour(+d.f0) + 3)  // Adjust outer radius by dB
        .defined(d => +d.f0) 
        .curve(d3.curveBasis); 

        console.log("F0 values:", data.melodic_contour[0].f0);
        console.log("DB values:", data.melodic_contour[0].f0_db);
        console.log("Time values:", data.melodic_contour[0].time);
        
    // console.log(data.melodic_contour[0].time.map((d, i) => ({"time": +d, "f0": +data.melodic_contour[0].f0[i], "db": +data.melodic_contour[0].f0_db[i]})))
    melodicContour.append("path")
      .datum(data.melodic_contour[0].time.map((d, i) => ({"time": +d, "f0": +data.melodic_contour[0].f0[i], "db": +data.melodic_contour[0].f0_db[i]})))
      .attr("fill", "lightblue")
      .attr("fill-opacity", 0.7)
      /* .attr("stroke", "black")
      .attr("stroke-width", 1.5) */
      .attr("d", d => areaGenerator(d))
    
    let scoreMelodyGenerator = d3.line()
        .x(d => diatonicScale(getNoteId(d.note)) * Math.cos(scoreTimeDomain(+d.start)))
        .y(d => diatonicScale(getNoteId(d.note)) * Math.sin(scoreTimeDomain(+d.start)))
        // to smooth the line
        // .curve(d3.curveBasis);

    scoreMelody.append("path")
        .datum(data.score_melody)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", d => scoreMelodyGenerator(d))
    
    scoreMelody.selectAll(".scoreNotes")
        .data(data.score_melody)
        .enter()
            .append("circle")
            .attr("cx", d => diatonicScale(getNoteId(d.note)) * Math.cos(scoreTimeDomain(+d.start)))
            .attr("cy", d => diatonicScale(getNoteId(d.note)) * Math.sin(scoreTimeDomain(+d.start)))
            .attr("fill", "black")
            .attr("r", 3)
        

    
    let yScale = y(innerRadiusSpectogram, outerRadiusSpectogram, spectogramFrequencyDomain)
    let xScale = x(spectogramTimeDomain)

    console.log("yScale domain:", yScale.domain())
    console.log("yScale range:", yScale.range())


    spectogramGroup.selectAll("circle")
        .data(groupDataByTime)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => yScale(+d.freq) * Math.cos(xScale(+d.time)))
        .attr("cy", (d, i) => yScale(+d.freq) * Math.sin(xScale(+d.time)))
        .attr("r", d => radiusScale(+d.db))
        .attr("fill", d => colorScale(+d.db))
        .attr("fill-opacity", d => opacityScale(+d.db + Math.abs(maxDb) + 1) * 0.5)
})