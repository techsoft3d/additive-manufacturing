import { Operators } from '@ts3d-hoops/web-viewer';

class InstanceOperator extends Operators.OperatorBase {
    constructor(viewSync) {
        super(viewSync.getMainViewer());
    }
}
