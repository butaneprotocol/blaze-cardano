import { type SlotConfig } from "@blaze-cardano/core";

/**
 * Tracks slot, block, and epoch progression for the emulator.
 */
export class LedgerTimer {
  zeroTime: number;
  zeroSlot: number;
  block: number;
  slot: number;
  time: number;
  slotLength: number;
  slotsPerEpoch: number;
  epoch: number;

  constructor(
    slotConfig: SlotConfig = { zeroTime: 0, zeroSlot: 0, slotLength: 1000 },
    slotsPerEpoch: number = 432000,
  ) {
    this.block = 0;
    this.slot = slotConfig.zeroSlot;
    this.zeroSlot = slotConfig.zeroSlot;
    this.zeroTime = slotConfig.zeroTime;
    this.time = slotConfig.zeroTime;
    this.slotLength = slotConfig.slotLength;
    this.slotsPerEpoch = slotsPerEpoch;
    this.epoch = Math.floor((this.slot - this.zeroSlot) / this.slotsPerEpoch);
  }
}
