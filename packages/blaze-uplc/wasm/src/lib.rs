use std::collections::HashMap;

use js_sys::{self};
use pallas_addresses::ScriptHash;
use pallas_codec::utils::Bytes;
use pallas_primitives::conway::{
    self, CostModels, TransactionInput, TransactionOutput,
};
use pallas_primitives::Fragment;
use pallas_traverse::{Era, MultiEraTx};
use uplc::machine::cost_model::ExBudget;
use uplc::tx;
use uplc::tx::script_context::PlutusScript;
use uplc::tx::{ResolvedInput, SlotConfig};
use wasm_bindgen::prelude::*;

mod js_types;
use js_types::*;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn eval_phase_two_raw(
    tx_bytes: &[u8],
    utxos_refs_bytes: Vec<js_sys::Uint8Array>,
    utxos_outputs_bytes: Vec<js_sys::Uint8Array>,
    cost_mdls_bytes: &[u8],
    cpu_budget: u64,
    mem_budget: u64,
    slot_config_zero_time: u64,
    slot_config_zero_slot: u64,
    slot_config_slot_length: u32,
) -> Result<Vec<JsEvalResult>, JsValue> {
    let utxos_bytes = utxos_refs_bytes
        .into_iter()
        .zip(utxos_outputs_bytes.into_iter())
        .map(|(x, y)| (x.to_vec(), y.to_vec()))
        .collect::<Vec<(Vec<u8>, Vec<u8>)>>();
    return tx::eval_phase_two_raw(
        tx_bytes,
        &utxos_bytes,
        Some(cost_mdls_bytes),
        (cpu_budget, mem_budget),
        (
            slot_config_zero_time,
            slot_config_zero_slot,
            slot_config_slot_length,
        ),
        false,
        |_| (),
    )
    .map(|results| results.iter().map(Into::into).collect())
    .map_err(|e| e.to_string().into()); // TODO: rich error type
}

#[wasm_bindgen]
pub fn eval_phase_two_raw_with_override(
    tx_bytes: &[u8],
    utxos_refs_bytes: Vec<js_sys::Uint8Array>,
    utxos_outputs_bytes: Vec<js_sys::Uint8Array>,
    cost_mdls_bytes: &[u8],
    cpu_budget: u64,
    mem_budget: u64,
    slot_config_zero_time: u64,
    slot_config_zero_slot: u64,
    slot_config_slot_length: u32,
    override_script_hashes: Vec<js_sys::Uint8Array>,
    override_script_bytes: Vec<js_sys::Uint8Array>,
    override_script_languages: Vec<u8>,
) -> Result<Vec<JsEvalResult>, JsValue> {
    let utxos_bytes = utxos_refs_bytes
        .into_iter()
        .zip(utxos_outputs_bytes.into_iter())
        .map(|(x, y)| (x.to_vec(), y.to_vec()))
        .collect::<Vec<(Vec<u8>, Vec<u8>)>>();

    // Build the override scripts HashMap
    let mut override_scripts: HashMap<ScriptHash, PlutusScript> = HashMap::new();
    for i in 0..override_script_hashes.len() {
        let hash_bytes = override_script_hashes[i].to_vec();
        let script_bytes = override_script_bytes[i].to_vec();
        let lang = override_script_languages[i];

        let hash = ScriptHash::from(hash_bytes.as_slice());
        let plutus_script = match lang {
            1 => PlutusScript::V1(conway::PlutusScript::<1>(Bytes::from(script_bytes))),
            2 => PlutusScript::V2(conway::PlutusScript::<2>(Bytes::from(script_bytes))),
            3 => PlutusScript::V3(conway::PlutusScript::<3>(Bytes::from(script_bytes))),
            _ => return Err(JsValue::from_str(&format!("Invalid script language version: {}", lang))),
        };
        override_scripts.insert(hash, plutus_script);
    }

    // uplc only exposes the override entry point on parsed types, so decode
    // the raw inputs the same way tx::eval_phase_two_raw does internally,
    // then delegate to tx::eval_phase_two_with_override.
    let multi_era_tx = MultiEraTx::decode_for_era(Era::Conway, tx_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let cost_mdls = CostModels::decode_fragment(cost_mdls_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let budget = ExBudget {
        cpu: cpu_budget as i64,
        mem: mem_budget as i64,
    };

    let mut utxos = Vec::new();
    for (input, output) in &utxos_bytes {
        utxos.push(ResolvedInput {
            input: TransactionInput::decode_fragment(input)
                .map_err(|e| JsValue::from_str(&e.to_string()))?,
            output: TransactionOutput::decode_fragment(output)
                .map_err(|e| JsValue::from_str(&e.to_string()))?,
        });
    }

    let sc = SlotConfig {
        zero_time: slot_config_zero_time,
        zero_slot: slot_config_zero_slot,
        slot_length: slot_config_slot_length,
    };

    let MultiEraTx::Conway(conway_tx) = multi_era_tx else {
        return Err(JsValue::from_str(
            "expected a Conway-era transaction for override evaluation",
        ));
    };

    return tx::eval_phase_two_with_override(
        &conway_tx,
        &utxos,
        Some(&cost_mdls),
        Some(&budget),
        &sc,
        override_scripts,
        false,
        |_| (),
    )
    .map(|results| {
        results
            .iter()
            .map(|(redeemer, eval)| {
                JsEvalResult::new(&redeemer.encode_fragment().unwrap(), eval)
            })
            .collect()
    })
    .map_err(|e| e.to_string().into());
}

#[wasm_bindgen]
pub fn apply_params_to_script(
    params_bytes: &[u8],
    plutus_script_bytes: &[u8],
) -> Result<Vec<u8>, JsValue> {
    return tx::apply_params_to_script(params_bytes, plutus_script_bytes)
        .map_err(|e| e.to_string().into());
}
