export default class syncHelper {
    _mainViewer: Communicator.WebViewer;
    _attachedViewers: Communicator.WebViewer[];
    _needsUpdate: boolean;
    _modelTreeNodes: number[];

    constructor(viewerList: Communicator.WebViewer[]) {
        // Copy the array, so we do not modify the reference values
        let tfViewerList = viewerList.slice(0);
        // Assign the first element to the 
        this._mainViewer = tfViewerList.shift();
        // All remaining viewers are attached
        this._attachedViewers = tfViewerList;
        this._needsUpdate = true;
        this._modelTreeNodes = [];
    }

    syncNodeTransforms(nodeIds = []): void {
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
            this._attachedViewers.map( (viewer) => {
                viewer.model.setNodeMatrix(node, matrix);
            });
        }
    }

    _gatherAllNodeIds(parent: number, nodeIds: number[]) {
        nodeIds.push(parent);
        let children = this._mainViewer.model.getNodeChildren(parent);
        if (children.length !== 0) {
            for (let child of children) {
                this._gatherAllNodeIds(child, nodeIds);
            }
        }
    }

    addInstanceNodeId(nodeId: number): void {
        this._modelTreeNodes.push(nodeId);
    }

    setNeedsUpdate(option: boolean): void {
        this._needsUpdate = option;
    }

    getModelTreeNodes(): number[] {
        return this._modelTreeNodes;
    }

    getMainViewer(): Communicator.WebViewer {
        return this._mainViewer;
    }

    getAttachedViewers(): Communicator.WebViewer[] {
        return this._attachedViewers;
    }

}