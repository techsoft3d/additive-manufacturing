
class InstanceOperator {
    constructor(viewSync) {
        this._viewSync = viewSync;
        this._mainViewer = viewSync.getMainViewer();
        this._attachedViewers = viewSync.getAttachedViewers();
        this._ptDown = Communicator.Point2.zero();
        this._currentNodes = [];
        this._nodePosZ = 0;
    }
    
    onMouseDown(event) {
        this._ptDown.assign(event.getPosition());
    };

    onMouseUp(event) {
        const position = event.getPosition();
        if (position.equals(this._ptDown)) {
            const config = new Communicator.PickConfig(Communicator.SelectionMask.Face);
            this._mainViewer.view.pickFromPoint(position, config).then((selectionItem) => {
                if (selectionItem.isEntitySelection() &&
                    this._mainViewer.model.getNodeName(selectionItem.getNodeId()) === "printingPlane") {
                        this._insertGeometry(selectionItem.getPosition());
                }
                else {
                    alert("Please select a point on the Printing Plane");
                }
            });        }
    };

    _insertGeometry(position) {
        this._mainViewer.model.getMeshIds(this._currentNodes).then(meshIds => {
            meshIds.forEach((meshId, index) => {
                this._mainViewer.model.getNodeEffectiveFaceColor(this._currentNodes[index], 0).then(color => {
                    let netMatrix = this._mainViewer.model.getNodeNetMatrix(this._currentNodes[index]);
                    netMatrix.m[12] = position.x; // Add translation to the X-axis.
                    netMatrix.m[13] = position.y; // Add translation to the Y-axis.
                    netMatrix.m[14] = this._nodePosZ;
                    let mid = [];
                    let numInstances = this._attachedViewers.length + 1;
                    for (let i = 0; i < numInstances; ++i) {
                        mid.push(new Communicator.MeshInstanceData(meshId, netMatrix, "Node " + this._currentNodes + " Instance", color, Communicator.Color.black()));
                    }

                    let p1 = [this._mainViewer.model.createMeshInstance(mid.pop())];
                    let p2 = [];
                    this._attachedViewers.map(viewer => {
                        p1.push(viewer.model.createMeshInstance(mid.pop()))
                    });
                    Promise.all(p1)
                        .then( (nodeIds) => {
                            let masterNode = nodeIds.shift()
                            this._viewSync.setNodesMapping(masterNode, nodeIds);
                        })
                });
            });
        });
    };

    setNodesToInstance(nodeIds) {
        this._currentNodes = this._gatherChildLeafNodes(nodeIds);
        this._mainViewer.model.getNodesBounding(this._currentNodes).then(box => {
            this._nodePosZ = box.max.z - box.min.z;
        });
    }
    _gatherChildLeafNodes(startNodes) {
        const model = this._mainViewer.model;
        let nodes = startNodes.slice();
        let leaves = [];
        for (let i = 0; i < nodes.length; ++i) {
            let node = nodes[i];
            let kids = model.getNodeChildren(node);
            if (kids.length === 0) {
                leaves.push(node);
            }
            for (let j = 0; j < kids.length; j++) {
                let kid = kids[j];
                nodes.push(kid);
            }
        }
        return leaves;
    }
}
