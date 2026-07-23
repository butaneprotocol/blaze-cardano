export var CborMajorType;
(function (CborMajorType) {
    CborMajorType[CborMajorType["UnsignedInteger"] = 0] = "UnsignedInteger";
    CborMajorType[CborMajorType["NegativeInteger"] = 1] = "NegativeInteger";
    CborMajorType[CborMajorType["ByteString"] = 2] = "ByteString";
    CborMajorType[CborMajorType["Utf8String"] = 3] = "Utf8String";
    CborMajorType[CborMajorType["Array"] = 4] = "Array";
    CborMajorType[CborMajorType["Map"] = 5] = "Map";
    CborMajorType[CborMajorType["Tag"] = 6] = "Tag";
    CborMajorType[CborMajorType["Simple"] = 7] = "Simple";
})(CborMajorType || (CborMajorType = {}));
