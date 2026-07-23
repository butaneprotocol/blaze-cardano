import { Address4, Address6 } from 'ip-address';
import { InvalidArgumentError } from "../../../../../deps/util.js";
export const ipV4StringToByteArray = (address) => {
    if (!Address4.isValid(address))
        throw new InvalidArgumentError('address', `Invalid IP V4 string: ${address}`);
    return new Uint8Array(address.split('.').map((segment) => Number.parseInt(segment)));
};
export const byteArrayToIpV4String = (byteArray) => {
    if (byteArray.length !== 4)
        throw new InvalidArgumentError('byteArray', `Invalid IP V4 byte array, expected 4 bytes, but got ${byteArray.length}`);
    return [...byteArray].map((octect) => octect.toString()).join('.');
};
export const ipV6StringToByteArray = (address) => {
    if (!Address6.isValid(address))
        throw new InvalidArgumentError('address', `Invalid IP V6 string: ${address}`);
    const addressV6 = new Address6(address).toUnsignedByteArray();
    const filler = Array.from({ length: 16 })
        .fill(0, 0, 16)
        .slice(0, 16 - addressV6.length);
    return new Uint8Array([...filler, ...addressV6]);
};
export const byteArrayToIPv6String = (byteArray) => {
    const addressV6 = Address6.fromUnsignedByteArray([...byteArray]);
    return addressV6.canonicalForm();
};
