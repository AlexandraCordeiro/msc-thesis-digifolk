import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// set the dimensions and margins of the graph
const margin = 100,
svgWidth = window.innerWidth - 10,
svgHeight = window.innerHeight - 10,
graphWidth = svgWidth - margin,
graphHeight = svgHeight / 2

// append the svg object to the body of the page
    const svg = d3.select("#viz")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform",`translate(${margin/2},0)`);

    d3.json("harmonic_intervals_data.json").then(function(data) {
        // List of node names
        const allNodes = data.nodes.map(d => d.name)
        const allIds = data.nodes.map(d => d.id)
        let extent = d3.extent(allIds)
    
        // A linear scale to position the nodes on the X axis
        const x = d3.scaleLinear()
            .domain(extent)
            .range([0, graphWidth])
    
        // display x axis
        svg.append("g")
            .attr('class', 'jost-regular')
            .attr("transform", `translate(0,${graphHeight - 30})`)
            .call(d3.axisBottom(x)
                .tickValues(data.nodes.map(d => d.id)) 
                .tickFormat(d => {
                    const match = data.nodes.find(n => n.id === d);
                    return match ? match.name : "";
                })
                .tickPadding(120)
            );
    
        // Add links between nodes
        const idToNode = {};
        data.nodes.forEach(function (n) {
            idToNode[n.id] = n;
        });
    
        // Add the links
        const links = svg
        .append('g')
        .attr('id', 'links')
        .selectAll('links')
        .data(data.links)
        .join('path')
        .attr('d', d => {
    
            let y = graphHeight - 30
            let startid = idToNode[d.source]
            let endid = idToNode[d.target]
            let start = x(idToNode[d.source].id)      // start node on the x axis
            let end = x(idToNode[d.target].id)        // end node on the x axis
            let arcHeight = (end - start)
            
            // loop
            let path;
            if (d.source == d.target) {
    
                let loopWidth = 30
                let loopHeight = 30
    
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
                    start - end, ',',                   // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
                    arcHeight, 0, 0, ',',
                    startid > endid ? 0 : 1, end, ',', y]
                    .join(' ');
            }
            return path
        })
        .style("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", d => d.count * 0.7)


        // add frequency rings
        const rings = svg
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
                .attr('cy', graphHeight - 125)
                .attr('r', d => 5 * (d[0] + 1))
                .style('stroke', 'black')
                .style('fill', 'none')


        // add circular bar plot
        
        // radius
        const innerRadius = 13;
        const outerRadius = innerRadius * 2;

        // x scale
        const xCircularBarPlot = d3.scaleBand()
            .range([0, 2 * Math.PI]) // Full circle
            .domain(data.note_frequency_by_measure.flatMap(d => d.measures.map(m => m.measure)));

        // y scale
        const yCircularBarPlot = d3.scaleRadial()
            .range([innerRadius, outerRadius])
            .domain([0, d3.max(data.note_frequency_by_measure.flatMap(d => d.measures.map(m => m.counter)))]);

        
        const circularBarPlot = svg.append('g')
            .attr('id', 'circular-bar-plots')

        // Create bars
        data.note_frequency_by_measure.forEach(note => {

            console.log(note.measures)
            const group = circularBarPlot.append('g')
                .attr('transform', `translate(${x(note.id)}, ${graphHeight + 100})`);

            group.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 13)
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)

            group.selectAll('path')
                .data(note.measures)
                .enter()
                .append('path')
                .attr('fill', "black")
                .attr('d', d3.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(d => yCircularBarPlot(d.counter)) // Bar height depends on counter
                    .startAngle(d => xCircularBarPlot(d.measure))
                    .endAngle(d => xCircularBarPlot(d.measure) + xCircularBarPlot.bandwidth())
                    .padAngle(0.3)
                    .padRadius(innerRadius));



        });
                
        
        // fundamental frequency contour (f0)
        let f0 = svg.append('g')
            .attr('id', 'fundamental-frequency')

        // x axis
        var xFundamentalFrequency = d3.scaleLinear()
            .domain(d3.extent(data.time))
            .range([ 0, graphWidth ]);

        // y axis
        var yFundamentalFrequency = d3.scaleLinear()
            .domain([0, d3.max(data.f0)])
            .range([ graphHeight/3, 0 ]);

        // line function
        let line =  d3.line()
            .x(d => xFundamentalFrequency(d.time))
            .y(d => yFundamentalFrequency(d.f0))
            .defined(d => d.f0 !== null)

        // Add the line
        f0.append("path")
            .datum(data.time.map((t, i) => ({ time: t, f0: data.f0[i] })))
            .attr("fill", "none")
            .attr("d", line)
            .attr('stroke', 'black')
            .attr("stroke-width", 2)
            .attr("transform", `translate(0, ${margin * 2})`)

                                        
        // midi melodic contour

                                       
    })

