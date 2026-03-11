export var CborSimpleValue;
(function (CborSimpleValue) {
    CborSimpleValue[CborSimpleValue["False"] = 20] = "False";
    CborSimpleValue[CborSimpleValue["True"] = 21] = "True";
    CborSimpleValue[CborSimpleValue["Null"] = 22] = "Null";
    CborSimpleValue[CborSimpleValue["Undefined"] = 23] = "Undefined";
})(CborSimpleValue || (CborSimpleValue = {}));
