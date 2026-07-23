export var GovernanceActionType;
(function (GovernanceActionType) {
    GovernanceActionType["parameter_change_action"] = "parameter_change_action";
    GovernanceActionType["hard_fork_initiation_action"] = "hard_fork_initiation_action";
    GovernanceActionType["treasury_withdrawals_action"] = "treasury_withdrawals_action";
    GovernanceActionType["no_confidence"] = "no_confidence";
    GovernanceActionType["update_committee"] = "update_committee";
    GovernanceActionType["new_constitution"] = "new_constitution";
    GovernanceActionType["info_action"] = "info_action";
})(GovernanceActionType || (GovernanceActionType = {}));
export var Vote;
(function (Vote) {
    Vote[Vote["no"] = 0] = "no";
    Vote[Vote["yes"] = 1] = "yes";
    Vote[Vote["abstain"] = 2] = "abstain";
})(Vote || (Vote = {}));
export var VoterType;
(function (VoterType) {
    VoterType["ccHotKeyHash"] = "ccHotKeyHash";
    VoterType["ccHotScriptHash"] = "ccHotScriptHash";
    VoterType["dRepKeyHash"] = "dRepKeyHash";
    VoterType["dRepScriptHash"] = "dRepScriptHash";
    VoterType["stakePoolKeyHash"] = "stakePoolKeyHash";
})(VoterType || (VoterType = {}));
export const isDrepInfo = (drep) => 'id' in drep && 'active' in drep;
export const isDRepCredential = (deleg) => 'type' in deleg && 'hash' in deleg;
export const isDRepAlwaysAbstain = (deleg) => '__typename' in deleg && deleg.__typename === 'AlwaysAbstain';
export const isDRepAlwaysNoConfidence = (deleg) => '__typename' in deleg && deleg.__typename === 'AlwaysNoConfidence';
