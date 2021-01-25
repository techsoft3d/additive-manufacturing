class SyncHelper {
    constructor(viewerList) {
        // Copy the array, so we do not modify the reference values
        let tfViewerList = viewerList.slice(0);
        // Assign the first element to the main viewer
        this._mainViewer = tfViewerList.shift();
        // All remaining viewers are attached
        this._attachedViewers = tfViewerList;
        this._nodeMapping = new Map();
    }

    syncNodeTransforms(nodeIds = []) {
        if (nodeIds.length == 0) {
            nodeIds = [];
            this._gatherAllNodeIds(this._mainViewer.model.getAbsoluteRootNode(), nodeIds);
            nodeIds = nodeIds.filter(Boolean);
        }
        let matMap = new Map();
        for (let node of nodeIds) {
            matMap.set(node, this._mainViewer.model.getNodeMatrix(node));
        }
        for (let [node, matrix] of matMap.entries()) {
            this._attachedViewers.map((viewer, index) => {
                if (this._nodeMapping.has(node)) {
                    node = this._nodeMapping.get(node)[index];
                }
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

    setNodesMapping(masterNode, mappedNodes) {
        this._nodeMapping.set(masterNode, mappedNodes);
    }

    getMainViewer() {
        return this._mainViewer;
    }
    
    getAttachedViewers() {
        return this._attachedViewers;
    }
}
