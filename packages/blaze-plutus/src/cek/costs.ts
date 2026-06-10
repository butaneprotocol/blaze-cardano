// Default PlutusV3 (Conway era) builtin cost parameters.
// Values match Cardano mainnet cost model parameters.
// Ported from plutuz/src/cek/cost_model_defaults.zig.

import type { DefaultFunction } from "../types";
import type { BuiltinCostModel } from "./costing";

function oneConst(mem: number, cpu: number): BuiltinCostModel {
  return {
    arity: "one",
    fun: {
      mem: { tag: "constant", value: mem },
      cpu: { tag: "constant", value: cpu },
    },
  };
}

function twoConst(mem: number, cpu: number): BuiltinCostModel {
  return {
    arity: "two",
    fun: {
      mem: { tag: "constant", value: mem },
      cpu: { tag: "constant", value: cpu },
    },
  };
}

function threeConst(mem: number, cpu: number): BuiltinCostModel {
  return {
    arity: "three",
    fun: {
      mem: { tag: "constant", value: mem },
      cpu: { tag: "constant", value: cpu },
    },
  };
}

function sixConst(mem: number, cpu: number): BuiltinCostModel {
  return {
    arity: "six",
    fun: {
      mem: { tag: "constant", value: mem },
      cpu: { tag: "constant", value: cpu },
    },
  };
}

export const DEFAULT_BUILTIN_COSTS: Record<DefaultFunction, BuiltinCostModel> =
  {
    // ===== Integer operations =====

    addInteger: {
      arity: "two",
      fun: {
        mem: { tag: "max_size", model: { intercept: 1, slope: 1 } },
        cpu: { tag: "max_size", model: { intercept: 100788, slope: 420 } },
      },
    },

    subtractInteger: {
      arity: "two",
      fun: {
        mem: { tag: "max_size", model: { intercept: 1, slope: 1 } },
        cpu: { tag: "max_size", model: { intercept: 100788, slope: 420 } },
      },
    },

    multiplyInteger: {
      arity: "two",
      fun: {
        mem: { tag: "added_sizes", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "multiplied_sizes",
          model: { intercept: 90434, slope: 519 },
        },
      },
    },

    divideInteger: {
      arity: "two",
      fun: {
        mem: {
          tag: "subtracted_sizes",
          intercept: 0,
          slope: 1,
          minimum: 1,
        },
        cpu: {
          tag: "const_above_diagonal",
          constant: 85848,
          model: {
            minimum: 85848,
            coeff00: 123203,
            coeff10: 1716,
            coeff01: 7305,
            coeff20: 57,
            coeff11: 549,
            coeff02: -900,
          },
        },
      },
    },

    quotientInteger: {
      arity: "two",
      fun: {
        mem: {
          tag: "subtracted_sizes",
          intercept: 0,
          slope: 1,
          minimum: 1,
        },
        cpu: {
          tag: "const_above_diagonal",
          constant: 85848,
          model: {
            minimum: 85848,
            coeff00: 123203,
            coeff10: 1716,
            coeff01: 7305,
            coeff20: 57,
            coeff11: 549,
            coeff02: -900,
          },
        },
      },
    },

    remainderInteger: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_y", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "const_above_diagonal",
          constant: 85848,
          model: {
            minimum: 85848,
            coeff00: 123203,
            coeff10: 1716,
            coeff01: 7305,
            coeff20: 57,
            coeff11: 549,
            coeff02: -900,
          },
        },
      },
    },

    modInteger: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_y", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "const_above_diagonal",
          constant: 85848,
          model: {
            minimum: 85848,
            coeff00: 123203,
            coeff10: 1716,
            coeff01: 7305,
            coeff20: 57,
            coeff11: 549,
            coeff02: -900,
          },
        },
      },
    },

    equalsInteger: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "min_size", model: { intercept: 51775, slope: 558 } },
      },
    },

    lessThanInteger: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "min_size", model: { intercept: 44749, slope: 541 } },
      },
    },

    lessThanEqualsInteger: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "min_size", model: { intercept: 43285, slope: 552 } },
      },
    },

    // ===== ByteString operations =====

    appendByteString: {
      arity: "two",
      fun: {
        mem: { tag: "added_sizes", model: { intercept: 0, slope: 1 } },
        cpu: { tag: "added_sizes", model: { intercept: 1000, slope: 173 } },
      },
    },

    consByteString: {
      arity: "two",
      fun: {
        mem: { tag: "added_sizes", model: { intercept: 0, slope: 1 } },
        cpu: { tag: "linear_in_y", model: { intercept: 72010, slope: 178 } },
      },
    },

    sliceByteString: {
      arity: "three",
      fun: {
        mem: { tag: "linear_in_z", model: { intercept: 4, slope: 0 } },
        cpu: { tag: "linear_in_z", model: { intercept: 20467, slope: 1 } },
      },
    },

    lengthOfByteString: oneConst(10, 22100),
    indexByteString: twoConst(4, 13169),

    equalsByteString: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: {
          tag: "linear_on_diagonal",
          intercept: 29498,
          slope: 38,
          constant: 24548,
        },
      },
    },

    lessThanByteString: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "min_size", model: { intercept: 28999, slope: 74 } },
      },
    },

    lessThanEqualsByteString: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "min_size", model: { intercept: 28999, slope: 74 } },
      },
    },

    // ===== Cryptography and hash functions =====

    sha2_256: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 4 },
        cpu: { tag: "linear", model: { intercept: 270652, slope: 22588 } },
      },
    },

    sha3_256: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 4 },
        cpu: { tag: "linear", model: { intercept: 1457325, slope: 64566 } },
      },
    },

    blake2b_256: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 4 },
        cpu: { tag: "linear", model: { intercept: 201305, slope: 8356 } },
      },
    },

    blake2b_224: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 4 },
        cpu: { tag: "linear", model: { intercept: 207616, slope: 8310 } },
      },
    },

    keccak_256: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 4 },
        cpu: { tag: "linear", model: { intercept: 2261318, slope: 64571 } },
      },
    },

    verifyEd25519Signature: {
      arity: "three",
      fun: {
        mem: { tag: "constant", value: 10 },
        cpu: {
          tag: "linear_in_y",
          model: { intercept: 53384111, slope: 14333 },
        },
      },
    },

    verifyEcdsaSecp256k1Signature: threeConst(10, 43053543),

    verifySchnorrSecp256k1Signature: {
      arity: "three",
      fun: {
        mem: { tag: "constant", value: 10 },
        cpu: {
          tag: "linear_in_y",
          model: { intercept: 43574283, slope: 26308 },
        },
      },
    },

    ripemd_160: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 3 },
        cpu: { tag: "linear", model: { intercept: 1964219, slope: 24520 } },
      },
    },

    // ===== String operations =====

    appendString: {
      arity: "two",
      fun: {
        mem: { tag: "added_sizes", model: { intercept: 4, slope: 1 } },
        cpu: { tag: "added_sizes", model: { intercept: 1000, slope: 59957 } },
      },
    },

    equalsString: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: {
          tag: "linear_on_diagonal",
          intercept: 1000,
          slope: 60594,
          constant: 39184,
        },
      },
    },

    encodeUtf8: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 4, slope: 2 } },
        cpu: { tag: "linear", model: { intercept: 1000, slope: 42921 } },
      },
    },

    decodeUtf8: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 4, slope: 2 } },
        cpu: { tag: "linear", model: { intercept: 91189, slope: 769 } },
      },
    },

    // ===== Control flow =====

    ifThenElse: threeConst(1, 76049),
    chooseUnit: twoConst(4, 61462),
    trace: twoConst(32, 59498),

    // ===== Pair operations =====

    fstPair: oneConst(32, 141895),
    sndPair: oneConst(32, 141992),

    // ===== List operations =====

    chooseList: threeConst(32, 132994),
    mkCons: twoConst(32, 72362),
    headList: oneConst(32, 83150),
    tailList: oneConst(32, 81663),
    nullList: oneConst(32, 74433),

    // ===== Data operations =====

    chooseData: sixConst(32, 94375),
    constrData: twoConst(32, 22151),
    mapData: oneConst(32, 68246),
    listData: oneConst(32, 33852),
    iData: oneConst(32, 15299),
    bData: oneConst(32, 11183),
    unConstrData: oneConst(32, 24588),
    unMapData: oneConst(32, 24623),
    unListData: oneConst(32, 25933),
    unIData: oneConst(32, 20744),
    unBData: oneConst(32, 20142),

    equalsData: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "min_size", model: { intercept: 898148, slope: 27279 } },
      },
    },

    mkPairData: twoConst(32, 11546),
    mkNilData: oneConst(32, 7243),
    mkNilPairData: oneConst(32, 7391),

    serialiseData: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 0, slope: 2 } },
        cpu: { tag: "linear", model: { intercept: 955506, slope: 213312 } },
      },
    },

    // ===== BLS12-381 G1 =====

    bls12_381_G1_add: twoConst(18, 962335),
    bls12_381_G1_neg: oneConst(18, 267929),

    bls12_381_G1_scalarMul: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 18 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 76433006, slope: 8868 },
        },
      },
    },

    bls12_381_G1_equal: twoConst(1, 442008),
    bls12_381_G1_compress: oneConst(6, 2780678),
    bls12_381_G1_uncompress: oneConst(18, 52948122),

    bls12_381_G1_hashToGroup: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 18 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 52538055, slope: 3756 },
        },
      },
    },

    bls12_381_G1_multiScalarMul: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 18 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 321837444, slope: 25087669 },
        },
      },
    },

    // ===== BLS12-381 G2 =====

    bls12_381_G2_add: twoConst(36, 1995836),
    bls12_381_G2_neg: oneConst(36, 284546),

    bls12_381_G2_scalarMul: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 36 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 158221314, slope: 26549 },
        },
      },
    },

    bls12_381_G2_equal: twoConst(1, 901022),
    bls12_381_G2_compress: oneConst(12, 3227919),
    bls12_381_G2_uncompress: oneConst(36, 74698472),

    bls12_381_G2_hashToGroup: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 36 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 166917843, slope: 4307 },
        },
      },
    },

    bls12_381_G2_multiScalarMul: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 36 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 617887431, slope: 67302824 },
        },
      },
    },

    // ===== BLS12-381 pairing =====

    bls12_381_millerLoop: twoConst(72, 254006273),
    bls12_381_mulMlResult: twoConst(72, 2174038),
    bls12_381_finalVerify: twoConst(1, 333849714),

    // ===== Byte/Integer conversion =====

    integerToByteString: {
      arity: "three",
      fun: {
        mem: {
          tag: "literal_in_y_or_linear_in_z",
          model: { intercept: 0, slope: 1 },
        },
        cpu: {
          tag: "quadratic_in_z",
          model: { coeff0: 1293828, coeff1: 28716, coeff2: 63 },
        },
      },
    },

    byteStringToInteger: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_y", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "quadratic_in_y",
          model: { coeff0: 1006041, coeff1: 43623, coeff2: 251 },
        },
      },
    },

    // ===== Bitwise operations =====

    andByteString: {
      arity: "three",
      fun: {
        mem: { tag: "linear_in_max_yz", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "linear_in_y_and_z",
          intercept: 100181,
          slopeY: 726,
          slopeZ: 719,
        },
      },
    },

    orByteString: {
      arity: "three",
      fun: {
        mem: { tag: "linear_in_max_yz", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "linear_in_y_and_z",
          intercept: 100181,
          slopeY: 726,
          slopeZ: 719,
        },
      },
    },

    xorByteString: {
      arity: "three",
      fun: {
        mem: { tag: "linear_in_max_yz", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "linear_in_y_and_z",
          intercept: 100181,
          slopeY: 726,
          slopeZ: 719,
        },
      },
    },

    complementByteString: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 0, slope: 1 } },
        cpu: { tag: "linear", model: { intercept: 107878, slope: 680 } },
      },
    },

    readBit: twoConst(1, 95336),

    writeBits: {
      arity: "three",
      fun: {
        mem: { tag: "linear_in_x", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "linear_in_y",
          model: { intercept: 281145, slope: 18848 },
        },
      },
    },

    replicateByte: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_x", model: { intercept: 1, slope: 1 } },
        cpu: { tag: "linear_in_x", model: { intercept: 180194, slope: 159 } },
      },
    },

    shiftByteString: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_x", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 158519, slope: 8942 },
        },
      },
    },

    rotateByteString: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_x", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 159378, slope: 8813 },
        },
      },
    },

    countSetBits: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "linear", model: { intercept: 107490, slope: 3298 } },
      },
    },

    findFirstSetBit: {
      arity: "one",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: { tag: "linear", model: { intercept: 106057, slope: 655 } },
      },
    },

    // ===== Modular exponentiation =====

    expModInteger: {
      arity: "three",
      fun: {
        mem: { tag: "linear_in_z", model: { intercept: 0, slope: 1 } },
        cpu: {
          tag: "exp_mod",
          coeff00: 607153,
          coeff11: 231697,
          coeff12: 53144,
        },
      },
    },

    // ===== Array/List operations =====

    dropList: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 4 },
        cpu: {
          tag: "linear_in_x",
          model: { intercept: 116711, slope: 1957 },
        },
      },
    },

    lengthOfArray: oneConst(10, 231883),

    listToArray: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 7, slope: 1 } },
        cpu: { tag: "linear", model: { intercept: 1000, slope: 24838 } },
      },
    },

    indexArray: twoConst(32, 232010),

    // ===== Value operations (V4) =====

    insertCoin: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 45, slope: 21 } },
        cpu: { tag: "linear", model: { intercept: 356924, slope: 18413 } },
      },
    },

    lookupCoin: {
      arity: "three",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: {
          tag: "linear_in_z",
          model: { intercept: 219951, slope: 9444 },
        },
      },
    },

    unionValue: {
      arity: "two",
      fun: {
        mem: { tag: "added_sizes", model: { intercept: 24, slope: 21 } },
        cpu: {
          tag: "with_interaction",
          c00: 1000,
          c10: 172116,
          c01: 183150,
          c11: 6,
        },
      },
    },

    valueContains: {
      arity: "two",
      fun: {
        mem: { tag: "constant", value: 1 },
        cpu: {
          tag: "const_above_diagonal",
          constant: 213283,
          model: {
            minimum: 0,
            coeff00: 618401,
            coeff10: 1998,
            coeff01: 28258,
            coeff20: 0,
            coeff11: 0,
            coeff02: 0,
          },
        },
      },
    },

    valueData: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 2, slope: 22 } },
        cpu: { tag: "linear", model: { intercept: 1000, slope: 38159 } },
      },
    },

    unValueData: {
      arity: "one",
      fun: {
        mem: { tag: "linear", model: { intercept: 1, slope: 11 } },
        cpu: {
          tag: "quadratic",
          model: { coeff0: 1000, coeff1: 95933, coeff2: 1 },
        },
      },
    },

    scaleValue: {
      arity: "two",
      fun: {
        mem: { tag: "linear_in_y", model: { intercept: 12, slope: 21 } },
        cpu: {
          tag: "linear_in_y",
          model: { intercept: 1000, slope: 277577 },
        },
      },
    },
  };
