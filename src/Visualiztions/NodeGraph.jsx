import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const NodeGraph = ({ data }) => {
    const ref = useRef();

    useEffect(() => {
        // Sample data
        var treeData = data;

        // Set the dimensions and margins of the diagram
        var margin = { top: 20, right: 90, bottom: 30, left: 90 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        // Append the SVG object to the ref
        var svg = d3
            .select(ref.current)
            .append('svg')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Declare a tree layout
        var tree = d3.tree().size([height, width]);

        // Assigns parent, children, height, depth
        var root = d3.hierarchy(treeData, function (d) {
            return d.children;
        });
        root.x0 = height / 2;
        root.y0 = 0;

        // Collapse after the second level
        root.children.forEach(collapse);

        update(root);

        // Collapse the node and all its children
        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        function update(source) {
            // Code to update the tree goes here
        }
    }, [data]);

    return <div ref={ref}></div>;
};

export default NodeGraph;
