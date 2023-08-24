// src/components/SearchTrees/BFSTree.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import SecureInput from '../Main/SecureInput'; // Adjust the path as needed
import './BFSTree.scss';

const BFSTree = () => {
    const svgRef = useRef(null);

    // Sample data for the bar graph
    const data = [50, 100, 150];

    useEffect(() => {
        const svg = d3.select(svgRef.current);

        // Define scales
        const xScale = d3.scaleBand().domain(data.map((_, i) => i)).range([0, 300]).padding(0.1);
        const yScale = d3.scaleLinear().domain([0, d3.max(data)]).range([200, 0]);

        // Create bars
        svg.selectAll('.bar')
            .data(data)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', (d, i) => xScale(i))
            .attr('y', d => yScale(d))
            .attr('width', xScale.bandwidth())
            .attr('height', d => 200 - yScale(d))
            .attr('fill', 'blue');
    }, [data]);

    return (
        <div className="bfs-tree">
            <h1>BFS (Breadth First Search) Tree</h1>
            <SecureInput placeholder="Enter user input" />
            <svg ref={svgRef} className="visualization" width="300" height="200"></svg>
            <pre className="code-block">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.
      </pre>
        </div>
    );
};

export default BFSTree;
