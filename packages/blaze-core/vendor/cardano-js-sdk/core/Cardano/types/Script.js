export var ScriptType;
(function (ScriptType) {
    ScriptType["Native"] = "native";
    ScriptType["Plutus"] = "plutus";
})(ScriptType || (ScriptType = {}));
export var NativeScriptKind;
(function (NativeScriptKind) {
    NativeScriptKind[NativeScriptKind["RequireSignature"] = 0] = "RequireSignature";
    NativeScriptKind[NativeScriptKind["RequireAllOf"] = 1] = "RequireAllOf";
    NativeScriptKind[NativeScriptKind["RequireAnyOf"] = 2] = "RequireAnyOf";
    NativeScriptKind[NativeScriptKind["RequireNOf"] = 3] = "RequireNOf";
    NativeScriptKind[NativeScriptKind["RequireTimeAfter"] = 4] = "RequireTimeAfter";
    NativeScriptKind[NativeScriptKind["RequireTimeBefore"] = 5] = "RequireTimeBefore";
})(NativeScriptKind || (NativeScriptKind = {}));
export var PlutusLanguageVersion;
(function (PlutusLanguageVersion) {
    PlutusLanguageVersion[PlutusLanguageVersion["V1"] = 0] = "V1";
    PlutusLanguageVersion[PlutusLanguageVersion["V2"] = 1] = "V2";
    PlutusLanguageVersion[PlutusLanguageVersion["V3"] = 2] = "V3";
})(PlutusLanguageVersion || (PlutusLanguageVersion = {}));
export const isNativeScript = (script) => script.__type === ScriptType.Native;
export const isPlutusScript = (script) => script.__type === ScriptType.Plutus;
