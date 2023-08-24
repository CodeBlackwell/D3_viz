// src/components/SearchTrees/BFSTree.js
import React, { useState } from 'react';
import SecureInput from '../Main/SecureInput'; // Adjust the path as needed
import './BFSTree.scss';
import NodeGraph from '../Visualizations/NodeGraph/NodeGraph';

const BFSTree = () => {
    const [layers, setLayers] = useState(5); // State to hold the number of layers

    return (
        <div>
            <h1>BFS (Breadth First Search) Tree</h1>
            <SecureInput
                type="number"
                placeholder="Enter number of layers"
                onChange={(e) => setLayers(Number(e.target.value))} // Update layers state
            />
            <div>
                <NodeGraph layers={layers} /> {/* Pass layers to NodeGraph */}
            </div>
            <pre className="code-block">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.
      </pre>
        </div>
    );
};

export default BFSTree;
