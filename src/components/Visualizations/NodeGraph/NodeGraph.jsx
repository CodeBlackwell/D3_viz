import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const generateTreeData = (layers) => {
    const createNode = (level) => {
        if (level >= layers) return { name: `Level ${level}`, children: [] };
        return {
            name: `Level ${level}`,
            children: [createNode(level + 1), createNode(level + 1)]
        };
    };
    return { name: 'Root', children: [createNode(1), createNode(1)] };
};

const NodeTree = ({ layers }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        const treeData = generateTreeData(layers);
        const svg = d3.select(svgRef.current);

        // Define the tree layout
        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree().size([600, 400]);
        const treeRoot = treeLayout(root);

        // Draw the links
        const linkGenerator = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        svg.selectAll('path')
            .data(treeRoot.links())
            .enter()
            .append('path')
            .attr('d', linkGenerator)
            .attr('stroke', 'black');

        // Draw the nodes
        svg.selectAll('circle')
            .data(treeRoot.descendants())
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 5)
            .attr('fill', 'blue');
    }, [layers]);

    return (
        <svg ref={svgRef} width="800" height="600"></svg>
    );
};

export default NodeTree;
