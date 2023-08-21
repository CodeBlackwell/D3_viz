import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const App = () => {
    const ref = useRef();

    useEffect(() => {
        // Sample data
        const data = [10, 20, 30, 40, 50];

        // Create a scale for the x-axis
        const xScale = d3.scaleBand()
            .domain(data.map((d, i) => i))
            .range([0, 300])
            .padding(0.2);

        // Create a scale for the y-axis
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data)])
            .range([200, 0]);

        // Create a D3 selection
        const svg = d3.select(ref.current)
            .attr('width', 300)
            .attr('height', 200);

        // Create bars
        svg.selectAll('rect')
            .data(data)
            .join('rect')
            .attr('x', (d, i) => xScale(i))
            .attr('y', d => yScale(d))
            .attr('width', xScale.bandwidth())
            .attr('height', d => 200 - yScale(d))
            .attr('fill', 'blue');
    }, []);

    return (
        <div>
            <h1>React D3 Bar Chart</h1>
            <svg ref={ref}></svg>
            <svg ref={ref}></svg>
        </div>
    );
};

export default App;
