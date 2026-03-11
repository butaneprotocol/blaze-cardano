import { Percent } from "../../../deps/util.js";
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
export const estimateStakePoolAPY = (rewardsHistory) => {
    if (rewardsHistory.length === 0)
        return null;
    const { activeStake, epochLength, memberRewards, pledge } = rewardsHistory.reduce((previous, current) => ({
        activeStake: previous.activeStake + current.activeStake,
        epochLength: previous.epochLength + current.epochLength,
        memberRewards: previous.memberRewards + current.memberRewards,
        pledge: previous.pledge + current.activeStake
    }));
    return Percent((Number(memberRewards) / Number(activeStake - pledge) / (epochLength / MILLISECONDS_PER_DAY)) * 365);
};
