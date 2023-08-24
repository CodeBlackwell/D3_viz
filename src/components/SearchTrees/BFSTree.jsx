// src/components/SearchTrees/BFSTree.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import SecureInput from '../Main/SecureInput'; // Adjust the path as needed
import './BFSTree.scss';
import NodeTree from "../Visualizations/NodeGraph/NodeGraph";
const BFSTree = () => {

    return (
        <div className="bfs-tree">
            <h1>BFS (Breadth First Search) Tree</h1>
            <SecureInput placeholder="Enter user input" />
            <NodeTree layers={5} />
            <pre className="code-block">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.
      </pre>
        </div>
    );
};

export default BFSTree;
