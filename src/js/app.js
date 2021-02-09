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
        this._viewSync = new SyncHelper(this._viewerList);
        this._modelList = [];
        this._printSurfaces = [];

        this._viewerList.map( (viewer) => viewer.start());

        this.setViewerCallbacks(mainViewer, overheadViewer);

        this.configureOperators(mainViewer, overheadViewer);

        this.setEventListeners();

    } // End main constructor


    configureOperators(mainViewer, overheadViewer) {

        // Create custom operators and register them with the main webviewer
        this._instanceOp = new InstanceOperator(this._viewSync);
        this._instanceHandle = mainViewer.registerCustomOperator(this._instanceOp);

        // Disable operators in the overhead viewer
        overheadViewer.operatorManager.clear();

    }

    setViewerCallbacks(mainViewer, overheadViewer) {
        this._viewerList.map((viewer) => {
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
                this.setMatrixText(mainViewer.model.getNodeNetMatrix(nodeId));
            },

            handleEvent: (eventType, nodeIds, initialMatrices, newMatrices) => {
                this.setMatrixText(mainViewer.model.getNodeNetMatrix(nodeIds[0]));
                this._viewSync.syncNodeTransforms(nodeIds);
            }

        });
    }

    // Function to load models and translate them so they are loaded 
    // at the origin and above the printing plane
    loadModel(modelName, viewer) {
        const modelNum = viewer.model.getNodeChildren(viewer.model.getAbsoluteRootNode()).length;
        const nodeName = "Model-" + (modelNum + 1);
        const modelNodeId = viewer.model.createNode(null, nodeName);
        this._modelList.push(modelName);
        viewer.model.loadSubtreeFromScsFile(modelNodeId, "./data/" + modelName + ".scs")
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
            // One plane for each viewer - need to call for each plane
            this.arrangeOnPlane(this._printSurfaces[0].getDimensions().planeSize)
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
                let handlesOp = mainViewer.operatorManager.getOperator(Communicator.OperatorId.Handle)
                handlesOp.addHandles(nodeIds);
                handlesOp.showHandles();
                mainViewer.operatorManager.push(handlesOp);
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
            let fileName = fileChoice.replace(/^.*[\\\/]/, '');
            let modelThumbnail = document.createElement('a');
            let modelName = fileName.split(".", 1)[0];
            modelThumbnail.id = modelName;
            modelThumbnail.href = "";
            modelThumbnail.className = "model-thumb";
            modelThumbnail.setAttribute("model", modelName);
            let imgPath = "./data/thumbnails/" + modelName + ".png";
            // Check to see if the selected model has a corresponding thumbnail made
            fetch(imgPath)
                .then((resp) => {
                if (resp.ok) {
                    let modelImg = document.createElement('img');
                    modelImg.src = imgPath;
                    modelThumbnail.appendChild(modelImg);
                }
                else {
                    modelThumbnail.innerHTML = modelName;
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
            };
        };
    } // End setting event handlers 


    setMatrixText(matrix) {
        const ids = 
           ['m11', 'm21', 'm31', 'm41',
            'm12', 'm22', 'm32', 'm42',
            'm13', 'm23', 'm33', 'm43',
            'm14', 'm24', 'm34', 'm44'];
        for (let [index, id] of ids.entries()) {
            document.getElementById(id).innerHTML = matrix.m[index].toFixed(1);
        }
    }

    arrangeOnPlane(boundarySize) {
        let mainViewer = this._viewerList[0];
        return new Promise((resolve) => {
            let leafArray = [];
            let setEmptyMatsPromises = [];
            let rootNode = mainViewer.model.getAbsoluteRootNode();
            let ident = new Communicator.Matrix;
            ident.loadIdentity();
        
            // Set the root node of the model tree to its identity matrix
            // and recursively do the same for all children
            mainViewer.model.setNodeMatrix(rootNode, ident, false);
            this._gatherLeavesAndClearMats(rootNode, leafArray, setEmptyMatsPromises);
        
            // Once all nodes have been reset, we can get the node boundings
            Promise.all(setEmptyMatsPromises).then((values) => {
                let getBoundingPromises = new Array();
                for (var i = 0; i < leafArray.length; i++) {
                    getBoundingPromises.push(mainViewer.model.getNodesBounding([leafArray[i]]));
                }
          
                // Once all node bounding have been gathered, start arranging
                Promise.all(getBoundingPromises).then((values) => {
                    let partSpacingX = 0;
                    let partSpacingY = 0;
                    for (let bb of values) {
                        if (bb.extents().x > partSpacingX) {
                            partSpacingX = bb.extents().x;
                        }
                        if (bb.extents().y > partSpacingY) {
                            partSpacingY = bb.extents().y;
                        }
                    }
            
                    let setNewMatPromises = [];
                    let extent = boundarySize * 0.7;
                    let x = -extent;
                    let y = -extent;
            
                    for (let i = 0; i < values.length; i++) {
                        let m = new Communicator.Matrix;
                        m.loadIdentity();
                        let bb = values[i];
                        let c = bb.center();
                        m.m[12] = x + bb.extents().x;
                        m.m[13] = y - c.y;
                        m.m[14] = -bb.min.z;
                        setNewMatPromises.push(mainViewer.model.setNodeMatrix(leafArray[i], m, false));
                        x += (bb.extents().x + partSpacingX);
                        if (x > extent) {
                            x = -extent;
                            y += partSpacingY * 1.5;
                        }
                    }
            
                    Promise.all(setNewMatPromises).then(() => resolve());
                });
            });
        });
    }

    _gatherLeavesAndClearMats(node, leafArray, promiseArr) {
        let mainViewer = this._viewerList[0];
        var children = mainViewer.model.getNodeChildren(node);
        if (children.length == 0)
          leafArray.push(node);
        for (var i = 0; i < children.length; i++) {
          var ident = new Communicator.Matrix;
          ident.loadIdentity();
          promiseArr.push(mainViewer.model.setNodeMatrix(children[i], ident, false));
          this._gatherLeavesAndClearMats(children[i], leafArray, promiseArr);
        }
    }


} // End main class 
