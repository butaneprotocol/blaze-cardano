import { CustomError } from 'ts-custom-error';
export class CborInvalidOperationException extends CustomError {
    constructor(reason) {
        super(reason);
    }
}
export class CborContentException extends CustomError {
    constructor(reason) {
        super(reason);
    }
}
export class LossOfPrecisionException extends CustomError {
    constructor(reason) {
        super(reason);
    }
}
