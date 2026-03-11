import { LossOfPrecisionException } from './errors.js';
const LOSS_OF_PRECISION_MSG = 'Invalid conversion. Loss of precision';
const ldexp = (mantissa, exponent) => {
    const steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    let result = mantissa;
    for (let i = 0; i < steps; i++)
        result *= Math.pow(2, Math.floor((exponent + i) / steps));
    return result;
};
export const decodeHalf = (data) => {
    const half = (data[0] << 8) + data[1];
    const exp = (half >> 10) & 0x1f;
    const mant = half & 1023;
    let val;
    if (exp === 0) {
        val = ldexp(mant, -24);
    }
    else if (exp !== 31) {
        val = ldexp(mant + 1024, exp - 25);
    }
    else {
        val = mant === 0 ? Number.POSITIVE_INFINITY : Number.NaN;
    }
    return half & 32768 ? -val : val;
};
export const encodeHalf = (value) => {
    const u32 = Buffer.allocUnsafe(4);
    u32.writeFloatBE(value, 0);
    const u = u32.readUInt32BE(0);
    if ((u & 8191) !== 0) {
        throw new LossOfPrecisionException(LOSS_OF_PRECISION_MSG);
    }
    let s16 = (u >> 16) & 32768;
    const exp = (u >> 23) & 0xff;
    const mant = u & 8388607;
    if (exp >= 113 && exp <= 142) {
        s16 += ((exp - 112) << 10) + (mant >> 13);
    }
    else if (exp >= 103 && exp < 113) {
        if (mant & ((1 << (126 - exp)) - 1)) {
            throw new LossOfPrecisionException(LOSS_OF_PRECISION_MSG);
        }
        s16 += (mant + 8388608) >> (126 - exp);
    }
    else {
        throw new LossOfPrecisionException(LOSS_OF_PRECISION_MSG);
    }
    const result = new Uint8Array(2);
    result[0] = (s16 >>> 8) & 0xff;
    result[1] = s16 & 0xff;
    return result;
};
