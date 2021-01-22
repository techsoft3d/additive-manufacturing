
// Application logic will begin once DOM content is loaded
window.onload = () => {
    const app = new main();
};

class main {

    constructor() {
        // Instantiate two viewers for two different views
        const mainViewer = new Communicator.WebViewer({
            containerId: "viewer",
            empty: true
        });
        const overheadViewer = new Communicator.WebViewer({
            containerId: "subviewer",
            empty: true
        });
        this._viewerList = [mainViewer, overheadViewer];
        this._modelList = [];
        this._printSurfaces = [];

        this._viewerList.map( (viewer) => {
            viewer.start();
            viewer.setCallbacks({
                modelStructureReady: () => {
                    // Create Printing Plane
                    this._printSurfaces.push(new PrintingPlane(viewer, 300, 10));

                    // Load Model
                    this.loadModel("microengine", viewer);

                }, 
                sceneReady: () => {
                                        
                    // Set the cameras for the two viewers
                    let camPos, target, upVec;
                    switch (viewer) {
                        case mainViewer:
                            camPos = new Communicator.Point3(-1000, -1000, 1000);
                            target = new Communicator.Point3(0, 0, 0);
                            upVec = new Communicator.Point3(0, 0, 1);
                            break;
                        case overheadViewer:
                            camPos = new Communicator.Point3(0, 0, 1000);
                            target = new Communicator.Point3(0, 0, 0);
                            upVec = new Communicator.Point3(0, 1, 0);
                            break;
                        default:
                            alert('Error: No WebViewer Objects Detected.');
                    }
                    const defaultCam = Communicator.Camera.create(camPos, target, upVec, 1, 720, 720, 0.01);
                    viewer.view.setCamera(defaultCam);
                    
                    // Background color for viewers
                    viewer.view.setBackgroundColor(new Communicator.Color(0, 153, 220), new Communicator.Color(218, 220, 222));
                }
            }); // End Callbacks on Both Viewers
        }); // End map

        // Set additional callbacks for main viewer only
        mainViewer.setCallbacks({
            sceneReady: () => {
                // Additional options for modelStructureReady that we did not want in both viewers
                mainViewer.view.getAxisTriad().enable();
                mainViewer.view.getNavCube().enable();
                mainViewer.view.getNavCube().setAnchor(Communicator.OverlayAnchor.LowerRightCorner);
            }, 
            // Adding functionality for a selection callback in the mainViewer
            selectionArray: (selectionEvents) => {
                // Do Not Want the Build Plate as a Part of any Model Selection Events
                const ppNodeId = this._printSurfaces[0].getNodeId(); // Node Id of the build plate
                
                // Return the selection IDs for the current selections, check if the printing plane
                // was selected in the results - if so, remove it
                const selectionIds = selectionEvents.map(sEvent => sEvent.getSelection().getNodeId());
                const foundIndex = selectionIds.indexOf(ppNodeId);
                
                if (foundIndex != -1) {
                    mainViewer.selectionManager.remove(selectionEvents[foundIndex].getSelection());
                    selectionEvents.splice(foundIndex, 1);
                }
                
                // If the printing plane was the only result, no other selections fired
                // this callback, so exit
                if (selectionEvents.length == 0)
                    return;

                const nodeId = selectionEvents[0].getSelection().getNodeId();
                const modelFileName = mainViewer.model.getModelFileNameFromNode(nodeId);
                const modelFileFormat = mainViewer.model.getModelFileTypeFromNode(nodeId);
                document.getElementById("model-file-name").innerHTML = modelFileName || "N/A";
                document.getElementById("model-file-type").innerHTML = Communicator.FileType[modelFileFormat] || "N/A";
                document.getElementById("node-id").innerHTML = nodeId.toString() || "Unknown";
                document.getElementById("node-name").innerHTML = mainViewer.model.getNodeName(nodeId) || "Node Name Not Defined";
                TransformOperator.setMatrixText(mainViewer.model.getNodeNetMatrix(nodeId));
            }
        });

        // Disable interaction with the overhead viewer
        overheadViewer.operatorManager.clear();

        this._transformOp = new TransformOperator(mainViewer);
        this._transformHandle = mainViewer.registerCustomOperator(this._transformOp);
        // Disable Default Handle Operator - overwriting with custom one that inherits its functionality
        mainViewer.operatorManager.remove(Communicator.OperatorId.Handle);

        this.setEventListeners();

    } // End main constructor


    // Function to load models and translate them so they are loaded 
    // at the origin and above the printing plane
    loadModel(modelName, viewer) {
        const modelNum = viewer.model.getNodeChildren(viewer.model.getAbsoluteRootNode()).length;
        const nodeName = "Model-" + (modelNum + 1);
        const modelNodeId = viewer.model.createNode(null, nodeName);
        this._modelList.push(modelName);
        viewer.model.loadSubtreeFromScsFile(modelNodeId, "/data/" + modelName + ".scs")
            .then(() => {
            let loadMatrix = viewer.model.getNodeNetMatrix(modelNodeId);
            viewer.model.getNodeRealBounding(modelNodeId)
                .then((box) => {
                loadMatrix.setTranslationComponent(box.min.x * -1, box.min.y * -1, box.min.z * -1);
                viewer.model.setNodeMatrix(modelNodeId, loadMatrix, true);
            });
        });
    }

    setEventListeners() {
        // We will use the main viewer to gather scene information
        let mainViewer = this._viewerList[0];
        document.getElementById("arrange-button").onclick = () => {
        };
        document.getElementById("handles-button").onclick = () => {
            // Need to gather the selected node IDs to know which nodes
            // will be affected by the transformation
            let nodeIds = [];
            const selectionItems = mainViewer.selectionManager.getResults();
            selectionItems.map((selectionItem) => {
                nodeIds.push(selectionItem.getNodeId());
            });
            // Ensure the user has made a selection before trying to add handles
            if (selectionItems.length !== 0) {
                this._transformOp.addHandles(nodeIds);
                this._transformOp.showHandles();
                mainViewer.operatorManager.push(this._transformHandle);
            }
            else {
                alert("Try Again. Please first select nodes from the model to transform!");
            }
        };
        document.getElementById("instance-button").onclick = () => {
        };
        document.getElementById("open-model-button").onclick = () => {
        };
    } // End setting event handlers 

} // End main class 
