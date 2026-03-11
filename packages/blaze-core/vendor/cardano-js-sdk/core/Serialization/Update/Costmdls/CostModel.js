var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CostModel_instances, _CostModel_language, _CostModel_costs, _CostModel_isOperationValid;
import { InvalidArgumentError } from "../../../../deps/util.js";
import { PlutusLanguageVersion } from '../../../Cardano/types/Script.js';
export class CostModel {
    constructor(language, costs) {
        _CostModel_instances.add(this);
        _CostModel_language.set(this, void 0);
        _CostModel_costs.set(this, void 0);
        __classPrivateFieldSet(this, _CostModel_language, language, "f");
        __classPrivateFieldSet(this, _CostModel_costs, costs, "f");
    }
    static newPlutusV1(costs) {
        return new CostModel(PlutusLanguageVersion.V1, costs);
    }
    static newPlutusV2(costs) {
        return new CostModel(PlutusLanguageVersion.V2, costs);
    }
    static newPlutusV3(costs) {
        return new CostModel(PlutusLanguageVersion.V3, costs);
    }
    set(operation, cost) {
        if (!__classPrivateFieldGet(this, _CostModel_instances, "m", _CostModel_isOperationValid).call(this, operation))
            throw new InvalidArgumentError('operation', `The given operation ${operation} is invalid for the current Language version ${__classPrivateFieldGet(this, _CostModel_language, "f")}.`);
        __classPrivateFieldGet(this, _CostModel_costs, "f")[operation] = cost;
    }
    get(operation) {
        if (!__classPrivateFieldGet(this, _CostModel_instances, "m", _CostModel_isOperationValid).call(this, operation))
            throw new InvalidArgumentError('operation', `The given operation ${operation} is invalid for the current Language version ${__classPrivateFieldGet(this, _CostModel_language, "f")}.`);
        return __classPrivateFieldGet(this, _CostModel_costs, "f")[operation];
    }
    costs() {
        return __classPrivateFieldGet(this, _CostModel_costs, "f");
    }
    language() {
        return __classPrivateFieldGet(this, _CostModel_language, "f");
    }
}
_CostModel_language = new WeakMap(), _CostModel_costs = new WeakMap(), _CostModel_instances = new WeakSet(), _CostModel_isOperationValid = function _CostModel_isOperationValid(operation) {
    return operation >= 0;
};
