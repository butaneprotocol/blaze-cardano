use js_sys::{self};
use uplc::tx;
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
pub fn apply_params_to_script(
    params_bytes: &[u8],
    plutus_script_bytes: &[u8],
) -> Result<Vec<u8>, JsValue> {
    return tx::apply_params_to_script(params_bytes, plutus_script_bytes)
        .map_err(|e| e.to_string().into());
}
