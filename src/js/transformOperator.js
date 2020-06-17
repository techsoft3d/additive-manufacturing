
class transformOperator extends Communicator.Operator.HandleOperator {
    constructor(viewSync) {
        super(viewSync.getMainViewer());
        this._mainViewer = viewSync.getMainViewer();
        this._viewSync = viewSync;
    }
    static setMatrixText(matrix) {
        const ids = ['m11', 'm21', 'm31', 'm41',
            'm12', 'm22', 'm32', 'm42',
            'm13', 'm23', 'm33', 'm43',
            'm14', 'm24', 'm34', 'm44'];
        for (let [index, id] of ids.entries()) {
            document.getElementById(id).innerHTML = matrix.m[index].toFixed(1);
        }
    }
    onMouseMove(event) {
        super.onMouseMove(event);
        if (this.isDragging()) {
            const selectionItems = this._mainViewer.selectionManager.getResults();
            let nodeIds = [];
            selectionItems.map((selectionItem) => {
                nodeIds.push(selectionItem.getNodeId());
            });
            this._viewSync.syncNodeTransforms(nodeIds);
            transformOperator.setMatrixText(this._mainViewer.model.getNodeNetMatrix(nodeIds[0]));
        }
    }
    _gatherLeavesAndClearMats(node, leafArray, pArray2) {
        var children = this._mainViewer.model.getNodeChildren(node);
        if (children.length == 0)
            leafArray.push(node);
        for (var i = 0; i < children.length; i++) {
            var ident = new Communicator.Matrix;
            ident.loadIdentity();
            pArray2.push(this._mainViewer.model.setNodeMatrix(children[i], ident, false));
            this._gatherLeavesAndClearMats(children[i], leafArray, pArray2);
        }
    }
    arrangeOnPlane(boundarySize) {
        return new Promise((resolve) => {
            let leafArray = [];
            let setEmptyMatsPromises = [];
            let rootNode = this._mainViewer.model.getAbsoluteRootNode();
            let ident = new Communicator.Matrix;
            ident.loadIdentity();
            // Set the root node of the model tree to its identity matrix
            // and recursively do the same for all children
            this._mainViewer.model.setNodeMatrix(rootNode, ident, false);
            this._gatherLeavesAndClearMats(rootNode, leafArray, setEmptyMatsPromises);
            // Once all nodes have been reset, we can get the node boundings
            Promise.all(setEmptyMatsPromises).then((values) => {
                let getBoundingPromises = new Array();
                for (var i = 0; i < leafArray.length; i++)
                    getBoundingPromises.push(this._mainViewer.model.getNodesBounding([leafArray[i]]));
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
                        setNewMatPromises.push(this._mainViewer.model.setNodeMatrix(leafArray[i], m, false));
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
}
