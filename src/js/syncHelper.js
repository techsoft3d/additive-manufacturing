
class syncHelper {
    constructor(viewerList) {
        // Copy the array, so we do not modify the reference values
        let tfViewerList = viewerList.slice(0);
        // Assign the first element to the 
        this._mainViewer = tfViewerList.shift();
        // All remaining viewers are attached
        this._attachedViewers = tfViewerList;
        this._needsUpdate = true;
        this._modelTreeNodes = [];
    }
    syncNodeTransforms(nodeIds = []) {
        if (this._needsUpdate == true) {
            this._modelTreeNodes = [];
            this._gatherAllNodeIds(this._mainViewer.model.getAbsoluteRootNode(), this._modelTreeNodes);
            this._modelTreeNodes = this._modelTreeNodes.filter(Boolean);
            this._needsUpdate = false;
        }
        nodeIds = nodeIds.length == 0 ? this._modelTreeNodes : nodeIds;
        let matMap = new Map();
        for (let node of nodeIds) {
            matMap.set(node, this._mainViewer.model.getNodeMatrix(node));
        }
        for (let [node, matrix] of matMap.entries()) {
            this._attachedViewers.map((viewer) => {
                viewer.model.setNodeMatrix(node, matrix);
            });
        }
    }
    _gatherAllNodeIds(parent, nodeIds) {
        nodeIds.push(parent);
        let children = this._mainViewer.model.getNodeChildren(parent);
        if (children.length !== 0) {
            for (let child of children) {
                this._gatherAllNodeIds(child, nodeIds);
            }
        }
    }
    addInstanceNodeId(nodeId) {
        this._modelTreeNodes.push(nodeId);
    }
    setNeedsUpdate(option) {
        this._needsUpdate = option;
    }
    getModelTreeNodes() {
        return this._modelTreeNodes;
    }
    getMainViewer() {
        return this._mainViewer;
    }
    getAttachedViewers() {
        return this._attachedViewers;
    }
}
