import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const NodeGraph = ({ nodes, links }) => {
    const ref = useRef();

    useEffect(() => {
        const svg = d3.select(ref.current)
            .attr('width', 800)
            .attr('height', 600);

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(400, 300));

        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6);

        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', 5)
            .attr('fill', '#f00');

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });
    }, [nodes, links]);

    return (
        <svg ref={ref}></svg>
    );
};

export default NodeGraph;
