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
var _CborInitialByte_initialByte;
export class CborInitialByte {
    constructor() {
        _CborInitialByte_initialByte.set(this, void 0);
    }
    CborInitialByte(majorType, additionalInfo) {
        __classPrivateFieldSet(this, _CborInitialByte_initialByte, (majorType << 5) | additionalInfo, "f");
    }
    static from(initialByte) {
        const init = new CborInitialByte();
        __classPrivateFieldSet(init, _CborInitialByte_initialByte, initialByte, "f");
        return init;
    }
    getInitialByte() {
        return __classPrivateFieldGet(this, _CborInitialByte_initialByte, "f");
    }
    getMajorType() {
        return __classPrivateFieldGet(this, _CborInitialByte_initialByte, "f") >> 5;
    }
    getAdditionalInfo() {
        return __classPrivateFieldGet(this, _CborInitialByte_initialByte, "f") & CborInitialByte.AdditionalInformationMask;
    }
}
_CborInitialByte_initialByte = new WeakMap();
CborInitialByte.IndefiniteLengthBreakByte = 0xff;
CborInitialByte.AdditionalInformationMask = 31;
