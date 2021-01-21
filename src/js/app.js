
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

        this._viewerList.map( (viewer) => {
            viewer.start();
            viewer.setCallbacks({
                modelStructureReady: () => {
                    // Create Printing Plane
                    
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
            }
        });

        // Disable interaction with the overhead viewer
        overheadViewer.operatorManager.clear();

    } // End main constructor


    // Function to load models and translate them so they are loaded 
    // at the origin and above the printing plane
    loadModel(modelName, viewer) {
        const modelNum = viewer.model.getNodeChildren(viewer.model.getAbsoluteRootNode()).length;
        const nodeName = "Model-" + (modelNum + 1);
        const modelNodeId = viewer.model.createNode(null, nodeName);
        this._modelList.push(modelName); 
        viewer.model.loadSubtreeFromScsFile(modelNodeId, "/data/" + modelName + ".scs");
    }
} // End main class 
