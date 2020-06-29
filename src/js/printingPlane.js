
class printingPlane {
    constructor(viewerInstance, size = 300, depth = 10) {
        this._planeSize = size;
        this._planeDepth = depth;
        this._viewer = viewerInstance;
        this._nodeId = null;
        this._createPrintingPlane();
    }
    _createPrintingPlane() {
        let gridSize = this._planeSize;
        let d = this._planeDepth;
        let meshData = new Communicator.MeshData();
        meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
        meshData.setBackfacesEnabled(true);
        let gridCount = 15;
        let gridUnit = (gridSize / gridCount) * 2;
        for (let i = -gridCount / 2; i <= gridCount / 2; ++i) {
            let position = (gridUnit * i);
            meshData.addPolyline([
                -gridSize, position, 0,
                gridSize, position, 0,
            ]);
            meshData.addPolyline([
                position, -gridSize, 0,
                position, gridSize, 0,
            ]);
        }
        meshData.addFaces([
            // +Z Normal Plane
            -gridSize, -gridSize, 0,
            -gridSize, gridSize, 0,
            gridSize, gridSize, 0,
            -gridSize, -gridSize, 0,
            gridSize, gridSize, 0,
            gridSize, -gridSize, 0,
            // -Z Normal Plane
            -gridSize, -gridSize, -d,
            -gridSize, gridSize, -d,
            gridSize, gridSize, -d,
            -gridSize, -gridSize, -d,
            gridSize, gridSize, -d,
            gridSize, -gridSize, -d,
            // +X Normal Plane
            gridSize, -gridSize, 0,
            gridSize, -gridSize, -d,
            gridSize, gridSize, -d,
            gridSize, -gridSize, 0,
            gridSize, gridSize, -d,
            gridSize, gridSize, 0,
            // -X Normal Plane
            -gridSize, -gridSize, 0,
            -gridSize, -gridSize, -d,
            -gridSize, gridSize, 0,
            -gridSize, -gridSize, 0,
            -gridSize, gridSize, -d,
            -gridSize, gridSize, -d,
            // +Y Normal Plane
            -gridSize, gridSize, 0,
            gridSize, gridSize, 0,
            -gridSize, gridSize, -d,
            gridSize, gridSize, 0,
            gridSize, gridSize, -d,
            -gridSize, gridSize, -d,
            // -Y Normal Plane
            -gridSize, -gridSize, 0,
            gridSize, -gridSize, 0,
            -gridSize, -gridSize, -d,
            gridSize, -gridSize, 0,
            gridSize, -gridSize, -d,
            -gridSize, -gridSize, -d,
        ], [
            // +Z Normals
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            // -Z Normals
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            // +X Normals
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            // -X Normals
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            // +Y Normals
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            // -Y Normals
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
        ]);
        this._viewer.model.createMesh(meshData).then((meshId) => {
            let flags = Communicator.MeshInstanceCreationFlags.DoNotOutlineHighlight |
                Communicator.MeshInstanceCreationFlags.ExcludeBounding |
                Communicator.MeshInstanceCreationFlags.DoNotCut |
                Communicator.MeshInstanceCreationFlags.DoNotExplode |
                Communicator.MeshInstanceCreationFlags.DoNotLight;
            let meshInstanceData = new Communicator.MeshInstanceData(meshId, null, "printingPlane", null, null, null, flags);
            meshInstanceData.setLineColor(new Communicator.Color(150, 150, 150));
            meshInstanceData.setFaceColor(new Communicator.Color(75, 75, 75));
            // Do not provide a node id since this will be out of hierarchy
            this._viewer.model.createMeshInstance(meshInstanceData, null, null, true)
                .then((nodeId) => {
                this._nodeId = nodeId;
            });
        });
    }
    getDimensions() {
        return ({
            planeSize: this._planeSize,
            planeDepth: this._planeDepth,
        });
    }
    getNodeId() {
        return this._nodeId;
    }
}
