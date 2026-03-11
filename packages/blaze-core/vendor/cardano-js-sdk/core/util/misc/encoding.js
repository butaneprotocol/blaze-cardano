export const bytesToHex = (bytes) => Buffer.from(bytes).toString('hex');
export const hexToBytes = (hex) => Buffer.from(hex, 'hex');
export const utf8ToBytes = (str) => Buffer.from(str, 'utf8');
export const utf8ToHex = (str) => Buffer.from(str, 'utf8').toString('hex');
