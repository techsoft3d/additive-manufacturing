
class TransformOperator extends Communicator.Operator.HandleOperator {
    
    constructor(viewSync) {
        super(viewSync.getMainViewer());
        this._mainViewer = viewSync.getMainViewer();
        this._viewSync = viewSync;
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
    

    static setMatrixText(matrix) {
        const ids = 
           ['m11', 'm21', 'm31', 'm41',
            'm12', 'm22', 'm32', 'm42',
            'm13', 'm23', 'm33', 'm43',
            'm14', 'm24', 'm34', 'm44'];
        for (let [index, id] of ids.entries()) {
            document.getElementById(id).innerHTML = matrix.m[index].toFixed(1);
        }
    }
}
