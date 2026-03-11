import { ComposableError, formatErrorMessage } from "../deps/util.js";
import { CustomError } from 'ts-custom-error';
export var ProviderFailure;
(function (ProviderFailure) {
    ProviderFailure["Conflict"] = "CONFLICT";
    ProviderFailure["NotFound"] = "NOT_FOUND";
    ProviderFailure["Unknown"] = "UNKNOWN";
    ProviderFailure["Forbidden"] = "FORBIDDEN";
    ProviderFailure["InvalidResponse"] = "INVALID_RESPONSE";
    ProviderFailure["NotImplemented"] = "NOT_IMPLEMENTED";
    ProviderFailure["Unhealthy"] = "UNHEALTHY";
    ProviderFailure["ConnectionFailure"] = "CONNECTION_FAILURE";
    ProviderFailure["BadRequest"] = "BAD_REQUEST";
    ProviderFailure["ServerUnavailable"] = "SERVER_UNAVAILABLE";
})(ProviderFailure || (ProviderFailure = {}));
export const providerFailureToStatusCodeMap = {
    [ProviderFailure.BadRequest]: 400,
    [ProviderFailure.Forbidden]: 403,
    [ProviderFailure.NotFound]: 404,
    [ProviderFailure.Conflict]: 409,
    [ProviderFailure.Unhealthy]: 500,
    [ProviderFailure.Unknown]: 500,
    [ProviderFailure.InvalidResponse]: 500,
    [ProviderFailure.NotImplemented]: 500,
    [ProviderFailure.ConnectionFailure]: 500,
    [ProviderFailure.ServerUnavailable]: 500
};
export const statusCodeMapToProviderFailure = new Map(Object.entries(providerFailureToStatusCodeMap).map(([key, value]) => [value, key]));
const isProviderFailure = (reason) => Object.values(ProviderFailure).includes(reason);
export const reasonToProviderFailure = (reason) => isProviderFailure(reason) ? reason : ProviderFailure.Unknown;
export class ProviderError extends ComposableError {
    constructor(reason, innerError, detail) {
        super(formatErrorMessage(reason, detail), innerError);
        this.reason = reason;
        this.detail = detail;
    }
}
export class HandleOwnerChangeError extends CustomError {
    constructor(handle, expectedAddress, actualAddress) {
        super(`Expected: ${expectedAddress} for handle $${handle}. Actual: ${actualAddress}`);
        this.handle = handle;
        this.expectedAddress = expectedAddress;
        this.actualAddress = actualAddress;
    }
}
export var SerializationFailure;
(function (SerializationFailure) {
    SerializationFailure["InvalidType"] = "INVALID_TYPE";
    SerializationFailure["Overflow"] = "OVERFLOW";
    SerializationFailure["InvalidAddress"] = "INVALID_ADDRESS";
    SerializationFailure["MaxLengthLimit"] = "MAX_LENGTH_LIMIT";
    SerializationFailure["InvalidScript"] = "INVALID_SCRIPT";
    SerializationFailure["InvalidNativeScriptKind"] = "INVALID_NATIVE_SCRIPT_KIND";
    SerializationFailure["InvalidScriptType"] = "INVALID_SCRIPT_TYPE";
    SerializationFailure["InvalidDatum"] = "INVALID_DATUM";
})(SerializationFailure || (SerializationFailure = {}));
export class SerializationError extends ComposableError {
    constructor(reason, detail, innerError) {
        super(formatErrorMessage(reason, detail), innerError);
        this.reason = reason;
        this.detail = detail;
    }
}
export class InvalidProtocolParametersError extends CustomError {
    constructor(reason) {
        super(reason);
    }
}
export class NotImplementedError extends CustomError {
    constructor(missingFeature) {
        super(`Not implemented: ${missingFeature}`);
    }
}
export class TimeoutError extends CustomError {
    constructor(message) {
        super(`Timeout: ${message}`);
    }
}
