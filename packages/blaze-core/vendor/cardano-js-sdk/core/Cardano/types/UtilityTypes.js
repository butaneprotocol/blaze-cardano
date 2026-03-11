import FractionJs from 'fraction.js';
const toFractionJs = (value) => {
    if (typeof value === 'number') {
        return new FractionJs(value);
    }
    const { numerator, denominator } = value;
    return new FractionJs(numerator, denominator);
};
export const FractionUtils = {
    toFraction(value) {
        const fractionJs = toFractionJs(value);
        const { n: numerator, d: denominator } = fractionJs;
        return { denominator, numerator };
    },
    toNumber(value) {
        const fractionJs = toFractionJs(value);
        return fractionJs.valueOf();
    }
};
