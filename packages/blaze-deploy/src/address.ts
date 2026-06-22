import {
  type Address,
  type NetworkId,
  type Script,
  addressFromValidator,
  getBurnAddress,
} from "@blaze-cardano/core";

/** Build a deployment address from a validator script.
 *
 * @public
 */
export const deploymentAddressFromValidator = (
  network: NetworkId,
  validator: Script,
): Address => addressFromValidator(network, validator);

/** Return a burn address suitable for unspendable reference-script outputs.
 *
 * @public
 */
export const burnDeploymentAddress = (network: NetworkId): Address =>
  getBurnAddress(network);
