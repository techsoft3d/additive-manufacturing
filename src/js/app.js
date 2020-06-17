// import instanceOperator from "./instanceOperator.js";
// import transformOperator from "./transformOperator.js";
// import printingPlane from "./printingPlane.js";
// import syncHelper from "./syncHelper.js";


let directoryPath = ".";
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
        })
        const overheadViewer = new Communicator.WebViewer({
            containerId: "subviewer",
            empty: true
        });
        this._viewerList = [mainViewer, overheadViewer];
        this._modelList = [];
        this._printSurfaces = [];
        this._viewSync = new syncHelper(this._viewerList);
        // By storing in the array, we can initialize both viewers with 
        // the same code using the array "map" function
        this._viewerList.map((viewer) => {
            viewer.start();
            viewer.setCallbacks({
                modelStructureReady: () => {
                    // Need to make a surface for each viewer
                    this._printSurfaces.push(new printingPlane(viewer, 300, 10));
                    // Load the model and pass in the matrix
                    this.loadModel("microengine", viewer);
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
                            alert('Error: No WebViewer Objects Detected. Report to TS3D.');
                    }
                    const defaultCam = Communicator.Camera.create(camPos, target, upVec, 1, 720, 720, 0.01);
                    viewer.view.setCamera(defaultCam);
                    // Background color for viewers
                    viewer.view.setBackgroundColor(new Communicator.Color(0, 153, 220), new Communicator.Color(218, 220, 222));
                }
            }); // End Callbacks on Both Viewers
        }); // End Map
        // Set additional callbacks for main viewer only
        mainViewer.setCallbacks({
            modelStructureReady: () => {
                // Additional options for modelStructureReady that we did not want in both viewers
                mainViewer.view.getAxisTriad().enable();
                mainViewer.view.getNavCube().enable();
                mainViewer.view.getNavCube().setAnchor(Communicator.OverlayAnchor.LowerRightCorner);
            },
            // Adding functionality for a selection callback in the main viewer
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
                // Otherwise, display node information for the first node in the selection array
                const nodeId = selectionEvents[0].getSelection().getNodeId();
                const modelFileName = mainViewer.model.getModelFileNameFromNode(nodeId);
                const modelFileFormat = mainViewer.model.getModelFileTypeFromNode(nodeId);
                document.getElementById("model-file-name").innerHTML = modelFileName || "N/A";
                document.getElementById("model-file-type").innerHTML = Communicator.FileType[modelFileFormat] || "N/A";
                document.getElementById("node-id").innerHTML = nodeId.toString() || "Unknown";
                document.getElementById("node-name").innerHTML = mainViewer.model.getNodeName(nodeId) || "Node Name Not Defined";
                transformOperator.setMatrixText(mainViewer.model.getNodeNetMatrix(nodeId));
            }
        }); // End Callbacks
        // Do not want any interaction in the overhead viewer, so we will disable all operators
        overheadViewer.operatorManager.clear();
        // Disable Default Handle Operator - overwriting with custom one that inherits its functionality
        mainViewer.operatorManager.remove(Communicator.OperatorId.Handle);
        // Create custom operators and register them with the main webviewer
        this._instanceOp = new instanceOperator(this._viewSync);
        this._instanceHandle = mainViewer.registerCustomOperator(this._instanceOp);
        this._transformOp = new transformOperator(this._viewSync);
        this._transformHandle = mainViewer.registerCustomOperator(this._transformOp);
        this.setEventListeners();
    } // End main Constructor
    // Function to load models and translate them so they are loaded 
    // at the origin and above the printing plane
    loadModel(modelName, viewer) {
        const modelNum = viewer.model.getNodeChildren(viewer.model.getAbsoluteRootNode()).length;
        const nodeName = "Model-" + (modelNum + 1);
        const modelNodeId = viewer.model.createNode(null, nodeName);
        this._modelList.push(modelName);
        viewer.model.loadSubtreeFromScsFile(modelNodeId, directoryPath + "/data/" + modelName + ".scs")
            .then(() => {
            let loadMatrix = viewer.model.getNodeNetMatrix(modelNodeId);
            viewer.model.getNodeRealBounding(modelNodeId)
                .then((box) => {
                loadMatrix.setTranslationComponent(-box.min.x, -box.min.y, -box.min.z);
                viewer.model.setNodeMatrix(modelNodeId, loadMatrix, true);
            });
        });
        this._viewSync.setNeedsUpdate(true);
    }
    setEventListeners() {
        // We will use the main viewer to gather scene information
        let mainViewer = this._viewerList[0];
        document.getElementById("arrange-button").onclick = () => {
            // One plane for each viewer - need to call for each plane
            this._transformOp.arrangeOnPlane(this._printSurfaces[0].getDimensions().planeSize)
                .then((results) => this._viewSync.syncNodeTransforms());
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
            // Use the button to push and pop the operator from the operator stack
            let elem = document.getElementById("instance-button");
            if (elem.innerHTML === "Instance Part") {
                // Gather nodes to be instanced
                let nodeIds = [];
                const selectionItems = mainViewer.selectionManager.getResults();
                selectionItems.map((selection) => {
                    nodeIds.push(selection.getNodeId());
                });
                if (selectionItems.length !== 0) {
                    elem.innerHTML = "Disable Instancing";
                    this._instanceOp.setNodesToInstance(nodeIds);
                    // Remove the selection operator from the stack while instancing
                    mainViewer.operatorManager.push(this._instanceHandle);
                    mainViewer.operatorManager.remove(Communicator.OperatorId.Select);
                    mainViewer.selectionManager.setHighlightNodeSelection(false);
                    mainViewer.selectionManager.setHighlightFaceElementSelection(false);
                    mainViewer.selectionManager.setPickTolerance(0);
                }
                else {
                    alert("Try Again. Please first select nodes from the model to instance!");
                }
            }
            else {
                elem.innerHTML = "Instance Part";
                // Remove the instance operator from the stack and reenable selection and highlighting
                mainViewer.selectionManager.clear();
                mainViewer.operatorManager.remove(this._instanceHandle);
                mainViewer.operatorManager.push(Communicator.OperatorId.Select);
                mainViewer.selectionManager.setHighlightNodeSelection(true);
                mainViewer.selectionManager.setHighlightFaceElementSelection(true);
            }
        };
        document.getElementById("open-model-button").onclick = () => {
            // Proxy to override the default behavior of file input type
            document.getElementById('file-input').click();
        };
        document.getElementById("file-input").onchange = (e) => {
            // Once a file has been selected by the user, use the file information to 
            // gather the associated relevant data like thumbnails
            let fileChoice = e.target.value;
            let filename = fileChoice.replace(/^.*[\\\/]/, '');
            let modelThumbnail = document.createElement('a');
            let modelname = filename.split(".", 1)[0];
            modelThumbnail.id = modelname;
            modelThumbnail.href = "";
            modelThumbnail.className = "model-thumb";
            modelThumbnail.setAttribute("model", modelname);
            let imgPath = directoryPath + "/data/thumbnails/" + modelname + ".png";
            // Check to see if the selected model has a corresponding thumbnail made
            fetch(imgPath)
                .then((resp) => {
                if (resp.ok) {
                    let modelImg = document.createElement('img');
                    modelImg.src = imgPath;
                    modelThumbnail.appendChild(modelImg);
                }
                else {
                    modelThumbnail.innerHTML = modelname;
                    console.log("No Image for this Model was found.");
                }
            });
            document.getElementById("models-scroller").appendChild(modelThumbnail);
            // Now update the event callbacks for the thumbnails
            const thumbnailElements = document.getElementsByClassName("model-thumb");
            for (let thumbnail of thumbnailElements) {
                let thumbnailElement = thumbnail;
                thumbnailElement.onclick = (e) => {
                    e.preventDefault();
                    let elem = e.currentTarget;
                    let modelToLoad = elem.getAttribute("model");
                    // Load the model into the scene when clicked
                    this._viewerList.map((viewer) => {
                        this.loadModel(modelToLoad, viewer);
                    });
                };
            }
            ;
        };
    } // End setting event handlers 
} // End main class 
