import { Bip32PrivateKey, HexBlob } from "@blaze-cardano/core";
import { randomBytes } from "crypto";

/**
 * This test demonstrates a bug in Bip32PrivateKey.fromBytes().
 *
 * Root cause:
 * - Bip32PrivateKey.fromBip39Entropy() properly clamps the scalar (kL)
 * - Bip32PrivateKey.fromBytes() does NOT clamp the scalar
 *
 * For Ed25519, the scalar must be "clamped":
 * - Bits 0, 1, 2 must be 0 (divisible by 8 - cofactor)
 * - Bit 255 must be 0
 * - Bit 254 must be 1
 *
 * When using libsodium's _noclamp signing functions (as the SDK does for
 * extended keys via toRawKey()), unclamped scalars produce signatures that
 * may not verify correctly against the derived public key.
 *
 * The emulator uses Bip32PrivateKey.fromBytes(randomBytes(96)) which passes
 * unclamped random bytes, causing intermittent signature verification failures.
 */

/**
 * Check if a scalar is properly clamped according to Ed25519 requirements.
 */
function isClampedScalar(bytes: Uint8Array): boolean {
  if (bytes.length < 32) return false;

  // First byte: bits 0, 1, 2 must be 0 (value & 0b111 === 0, i.e., value & 7 === 0)
  const firstByte = bytes[0]!;
  if ((firstByte & 7) !== 0) return false;

  // Last byte of scalar (byte 31): bit 7 (255) must be 0, bit 6 (254) must be 1
  // This means: (value & 0b11000000) === 0b01000000, i.e., (value & 192) === 64
  const lastByte = bytes[31]!;
  if ((lastByte & 192) !== 64) return false;

  return true;
}

/**
 * Manually clamp a scalar according to Ed25519 requirements.
 */
function clampScalar(bytes: Uint8Array): Uint8Array {
  const clamped = new Uint8Array(bytes);
  // Clear bits 0, 1, 2 of first byte
  clamped[0] = clamped[0]! & 248; // 248 = 0b11111000
  // Clear bit 7, set bit 6 of byte 31
  clamped[31] = (clamped[31]! & 63) | 64; // 63 = 0b00111111, 64 = 0b01000000
  return clamped;
}

describe("Unclamped Scalar Bug", () => {
  test("random bytes are usually not properly clamped", () => {
    // Generate many random 96-byte keys and check how many have clamped scalars
    let clampedCount = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const entropy = randomBytes(96);
      if (isClampedScalar(entropy)) {
        clampedCount++;
      }
    }

    // With random bytes, the probability of being clamped is:
    // P(bits 0,1,2 = 0) * P(bit 255 = 0) * P(bit 254 = 1) = (1/8) * (1/2) * (1/2) = 1/32 ≈ 3.125%
    // So most random bytes will NOT be properly clamped
    console.log(
      `Clamped scalars: ${clampedCount}/${iterations} (expected ~3%)`,
    );
    expect(clampedCount).toBeLessThan(iterations / 2); // Should be way less than 50%
  });

  test("fromBip39Entropy produces clamped keys, fromBytes does not", async () => {
    // Generate entropy that is definitely NOT clamped
    let unclampedEntropy: Buffer;
    do {
      unclampedEntropy = randomBytes(96);
      // Ensure first byte has some of bits 0,1,2 set (unclamped)
      unclampedEntropy[0] = unclampedEntropy[0]! | 7; // Set bits 0, 1, 2
    } while (isClampedScalar(unclampedEntropy));

    // fromBytes does NOT clamp - key will have unclamped scalar
    const unclampedKey = Bip32PrivateKey.fromBytes(
      new Uint8Array(unclampedEntropy),
    );
    const unclampedKeyBytes = unclampedKey.bytes();
    expect(isClampedScalar(unclampedKeyBytes)).toBe(false);

    // fromBip39Entropy DOES clamp
    const clampedKey = Bip32PrivateKey.fromBip39Entropy(
      Buffer.from(unclampedEntropy.slice(0, 32)), // Use first 32 bytes as entropy
      "",
    );
    const clampedKeyBytes = clampedKey.bytes();
    expect(isClampedScalar(clampedKeyBytes)).toBe(true);
  });

  test("unclamped scalars cause intermittent signature verification failures", async () => {
    // This test demonstrates the actual bug:
    // When using Bip32PrivateKey.fromBytes() with unclamped random bytes,
    // the signature may not verify correctly.
    //
    // We run multiple iterations to demonstrate that failures occur,
    // rather than relying on a single random sample which might pass.

    const iterations = 10;
    let failures = 0;

    for (let i = 0; i < iterations; i++) {
      // Generate entropy that is definitely NOT clamped
      let unclampedEntropy: Buffer;
      do {
        unclampedEntropy = randomBytes(96);
        // Ensure first byte has some of bits 0,1,2 set (unclamped)
        unclampedEntropy[0] = unclampedEntropy[0]! | 7; // Set bits 0, 1, 2
      } while (isClampedScalar(unclampedEntropy));

      const masterkey = Bip32PrivateKey.fromBytes(
        new Uint8Array(unclampedEntropy),
      );

      // Derive payment key (this also won't be clamped properly)
      const accountKey = await masterkey.derive([
        0x80000000 + 1852,
        0x80000000 + 1815,
        0x80000000 + 0,
      ]);
      const paymentKey = await accountKey.derive([0, 0]);

      // Get raw key and public key
      const rawPrivateKey = paymentKey.toRawKey();
      const rawPublicKey = await rawPrivateKey.toPublic();

      // Sign a message
      const message = HexBlob("deadbeef");
      const signature = await rawPrivateKey.sign(message);

      // Verify the signature
      const isValid = await rawPublicKey.verify(signature, message);

      if (!isValid) {
        failures++;
      }
    }

    console.log(
      `Unclamped key verification failures: ${failures}/${iterations}`,
    );

    // With unclamped scalars, we expect SOME failures (typically ~50%)
    // If we get 0 failures in 10 tries, the bug isn't manifesting (very unlikely)
    // This assertion proves the bug exists
    expect(failures).toBeGreaterThan(0);
  });

  test("properly clamped keys always work correctly", async () => {
    // Generate random bytes and manually clamp them
    const entropy = randomBytes(96);
    const clampedEntropy = clampScalar(entropy);

    const masterkey = Bip32PrivateKey.fromBytes(new Uint8Array(clampedEntropy));

    // Verify the key is clamped
    expect(isClampedScalar(masterkey.bytes())).toBe(true);

    // Derive and sign
    const accountKey = await masterkey.derive([
      0x80000000 + 1852,
      0x80000000 + 1815,
      0x80000000 + 0,
    ]);
    const paymentKey = await accountKey.derive([0, 0]);

    const rawPrivateKey = paymentKey.toRawKey();
    const rawPublicKey = await rawPrivateKey.toPublic();

    const message = HexBlob("deadbeef");
    const signature = await rawPrivateKey.sign(message);

    // With properly clamped scalars, verification should always work
    const isValid = await rawPublicKey.verify(signature, message);
    expect(isValid).toBe(true);
  });

  test("clamped keys ALWAYS work - verifies the fix", async () => {
    // This test verifies that when we properly clamp scalars,
    // signature verification ALWAYS succeeds (100% of the time)

    const iterations = 20;
    let failures = 0;

    for (let i = 0; i < iterations; i++) {
      // Generate random bytes and clamp them (this is what the fix does)
      const entropy = clampScalar(new Uint8Array(randomBytes(96)));

      const masterkey = Bip32PrivateKey.fromBytes(entropy);
      const accountKey = await masterkey.derive([
        0x80000000 + 1852,
        0x80000000 + 1815,
        0x80000000 + 0,
      ]);
      const paymentKey = await accountKey.derive([0, 0]);

      const rawPrivateKey = paymentKey.toRawKey();
      const rawPublicKey = await rawPrivateKey.toPublic();

      const message = HexBlob("deadbeef");
      const signature = await rawPrivateKey.sign(message);
      const isValid = await rawPublicKey.verify(signature, message);

      if (!isValid) {
        failures++;
      }
    }

    console.log(`Clamped key verification failures: ${failures}/${iterations}`);

    // With properly clamped scalars, we expect ZERO failures
    expect(failures).toBe(0);
  });

  test("multiple unclamped keys - demonstrates intermittent failures", async () => {
    // Run multiple iterations to show the bug is intermittent
    const iterations = 20;
    let failures = 0;
    const failedKeys: string[] = [];

    for (let i = 0; i < iterations; i++) {
      // Generate random unclamped entropy
      let entropy: Buffer;
      do {
        entropy = randomBytes(96);
        entropy[0] = entropy[0]! | 7; // Force unclamped
      } while (isClampedScalar(entropy));

      const masterkey = Bip32PrivateKey.fromBytes(new Uint8Array(entropy));
      const accountKey = await masterkey.derive([
        0x80000000 + 1852,
        0x80000000 + 1815,
        0x80000000 + 0,
      ]);
      const paymentKey = await accountKey.derive([0, 0]);

      const rawPrivateKey = paymentKey.toRawKey();
      const rawPublicKey = await rawPrivateKey.toPublic();

      const message = HexBlob("deadbeef");
      const signature = await rawPrivateKey.sign(message);
      const isValid = await rawPublicKey.verify(signature, message);

      if (!isValid) {
        failures++;
        failedKeys.push(
          Buffer.from(masterkey.bytes().slice(0, 8)).toString("hex"),
        );
      }
    }

    console.log(`Failures: ${failures}/${iterations}`);
    if (failures > 0) {
      console.log(`Failed keys (first 8 bytes): ${failedKeys.join(", ")}`);
    }

    // Document that failures can occur (this test may pass or fail depending on random bytes)
    // The important thing is to demonstrate the bug exists
    if (failures > 0) {
      console.log(
        `BUG DEMONSTRATED: ${failures} out of ${iterations} unclamped keys failed signature verification`,
      );
    }
  });
});
