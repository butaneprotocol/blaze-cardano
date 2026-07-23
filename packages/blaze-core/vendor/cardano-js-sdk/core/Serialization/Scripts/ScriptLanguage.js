export var ScriptLanguage;
(function (ScriptLanguage) {
    ScriptLanguage[ScriptLanguage["Native"] = 0] = "Native";
    ScriptLanguage[ScriptLanguage["PlutusV1"] = 1] = "PlutusV1";
    ScriptLanguage[ScriptLanguage["PlutusV2"] = 2] = "PlutusV2";
    ScriptLanguage[ScriptLanguage["PlutusV3"] = 3] = "PlutusV3";
})(ScriptLanguage || (ScriptLanguage = {}));
