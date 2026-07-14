import {
  type ChainId,
  ChainIds,
  NetworkId,
  type ProtocolParameters,
  type SlotConfig,
  SLOT_CONFIG_NETWORK,
  hardCodedProtocolParams,
} from "@blaze-cardano/core";

/** Network preset used as the base for emulator configuration. @public */
export type EmulatorNetworkPreset =
  | "mainnet"
  | "preprod"
  | "preview"
  | "custom";

/** Resolved network, protocol, and clock settings for an emulator. @public */
export interface EmulatorNetworkConfig {
  /** Named preset used as the base configuration. */
  preset: EmulatorNetworkPreset;
  /** Chain id used for addresses and provider metadata. */
  chainId: ChainId;
  /** Protocol parameters used by the emulator ledger and evaluator. */
  params: ProtocolParameters;
  /** Slot-to-time conversion settings. */
  slotConfig: SlotConfig;
  /** Number of slots in one emulator epoch. */
  slotsPerEpoch: number;
  /** Number of slots produced in one emulator block. */
  slotsPerBlock: number;
}

/** Overrides accepted by {@link createEmulatorNetworkConfig}. @public */
export interface EmulatorNetworkConfigInput {
  /** Named preset to use as the base configuration. */
  preset?: EmulatorNetworkPreset;
  /** Chain id override. */
  chainId?: ChainId;
  /** Protocol parameters override. */
  params?: ProtocolParameters;
  /** Slot-to-time fields to override on the selected preset. */
  slotConfig?: Partial<SlotConfig>;
  /** Epoch length override. */
  slotsPerEpoch?: number;
  /** Block length override, measured in slots. */
  slotsPerBlock?: number;
}

const DEFAULT_SLOTS_PER_EPOCH = 432000;
const DEFAULT_SLOTS_PER_BLOCK = 20;

/** @internal */
export const DEFAULT_EMULATOR_CHAIN_ID: ChainId = {
  networkId: NetworkId.Testnet,
  networkMagic: 0,
};

const cloneProtocolParameters = (
  params: ProtocolParameters,
): ProtocolParameters => structuredClone(params);

const networkPresets = {
  mainnet: {
    chainId: ChainIds.Mainnet,
    slotConfig: SLOT_CONFIG_NETWORK.Mainnet,
    slotsPerEpoch: 432000,
  },
  preprod: {
    chainId: ChainIds.Preprod,
    slotConfig: SLOT_CONFIG_NETWORK.Preprod,
    slotsPerEpoch: 432000,
  },
  preview: {
    chainId: ChainIds.Preview,
    slotConfig: SLOT_CONFIG_NETWORK.Preview,
    slotsPerEpoch: 86400,
  },
} satisfies Record<
  Exclude<EmulatorNetworkPreset, "custom">,
  { chainId: ChainId; slotConfig: SlotConfig; slotsPerEpoch: number }
>;

const customPreset = {
  chainId: DEFAULT_EMULATOR_CHAIN_ID,
  slotConfig: { zeroTime: 0, zeroSlot: 0, slotLength: 1000 },
  slotsPerEpoch: DEFAULT_SLOTS_PER_EPOCH,
};

const defaultConfigForPreset = (
  preset: EmulatorNetworkPreset,
): EmulatorNetworkConfig => {
  const defaults = preset === "custom" ? customPreset : networkPresets[preset];
  return {
    preset,
    chainId: { ...defaults.chainId },
    params: cloneProtocolParameters(hardCodedProtocolParams),
    slotConfig: { ...defaults.slotConfig },
    slotsPerEpoch: defaults.slotsPerEpoch,
    slotsPerBlock: DEFAULT_SLOTS_PER_BLOCK,
  };
};

/** Resolve a network preset and optional overrides into emulator settings. @public */
export const createEmulatorNetworkConfig = (
  input: EmulatorNetworkConfigInput | EmulatorNetworkPreset = "custom",
): EmulatorNetworkConfig => {
  const options = typeof input === "string" ? { preset: input } : input;
  const base = defaultConfigForPreset(options.preset ?? "custom");
  const chainId = options.chainId ? { ...options.chainId } : base.chainId;
  const slotConfig = { ...base.slotConfig, ...options.slotConfig };
  const slotsPerEpoch = options.slotsPerEpoch ?? base.slotsPerEpoch;
  const slotsPerBlock = options.slotsPerBlock ?? base.slotsPerBlock;

  if (
    chainId.networkId !== NetworkId.Mainnet &&
    chainId.networkId !== NetworkId.Testnet
  ) {
    throw new RangeError("chainId.networkId must be mainnet or testnet");
  }
  if (
    !Number.isSafeInteger(chainId.networkMagic) ||
    chainId.networkMagic < 0 ||
    chainId.networkMagic > 0xffffffff
  ) {
    throw new RangeError(
      "chainId.networkMagic must be a 32-bit unsigned integer",
    );
  }
  if (!Number.isFinite(slotConfig.zeroTime)) {
    throw new RangeError("zeroTime must be a finite number");
  }
  if (!Number.isSafeInteger(slotConfig.zeroSlot) || slotConfig.zeroSlot < 0) {
    throw new RangeError("zeroSlot must be a non-negative integer");
  }
  if (!Number.isFinite(slotConfig.slotLength) || slotConfig.slotLength <= 0) {
    throw new RangeError("slotLength must be a positive number");
  }
  if (!Number.isSafeInteger(slotsPerEpoch) || slotsPerEpoch <= 0) {
    throw new RangeError("slotsPerEpoch must be a positive integer");
  }
  if (!Number.isSafeInteger(slotsPerBlock) || slotsPerBlock <= 0) {
    throw new RangeError("slotsPerBlock must be a positive integer");
  }

  return {
    preset: options.preset ?? base.preset,
    chainId,
    params: options.params ?? base.params,
    slotConfig,
    slotsPerEpoch,
    slotsPerBlock,
  };
};
