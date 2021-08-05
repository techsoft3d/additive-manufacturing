'use strict';

// Application logic will begin once DOM content is loaded
window.onload = () => {
    const app = new main();
};

class main {

    constructor() {
        // Instantiate two viewers for two different views

        // Set up viewers
        this.setViewerCallbacks();
        this.configureOperators();
        this.setEventListeners();

    }  // End Constructor

    setViewerCallbacks() {

    } // End setting viewer callbacks

    configureOperators() {

    } // End configuring operators 
    
    setEventListeners() {
        // We will use the main viewer to gather scene information
        let mainViewer = this._viewerList[0];

        document.getElementById("handles-button").onclick = () => {
        
        };

        document.getElementById("arrange-button").onclick = () => {
        
        };

        document.getElementById("instance-button").onclick = () => {
        
        };

    } // End setting event handlers

    // Function to load models and translate them so they are loaded 
    // at the origin and above the printing plane
    loadModel(modelName, viewer) {

    }

    setMatrixText(matrix) {

    }

    arrangeOnPlane(boundarySize) {

    }

    _gatherLeavesAndClearMats(node, leafArray, promiseArr) {

    }

} // End main class 