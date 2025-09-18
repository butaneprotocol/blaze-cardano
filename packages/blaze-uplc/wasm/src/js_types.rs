use uplc::machine::{cost_model::ExBudget, eval_result::EvalResult, Trace};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct JsExBudget {
    pub cpu: i64,
    pub mem: i64,
}

impl From<ExBudget> for JsExBudget {
    fn from(value: ExBudget) -> Self {
        Self {
            cpu: value.cpu,
            mem: value.mem,
        }
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct JsTrace {
    kind: String,
    value: String,
}

#[wasm_bindgen]
impl JsTrace {
    #[wasm_bindgen(getter)]
    pub fn kind(&self) -> String {
        self.kind.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn value(&self) -> String {
        self.value.clone()
    }
}

impl From<Trace> for JsTrace {
    fn from(value: Trace) -> Self {
        match value {
            Trace::Log(log) => Self {
                kind: "log".to_string(),
                value: log,
            },
            Trace::Label(label) => Self {
                kind: "label".to_string(),
                value: label,
            },
        }
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct JsEvalResult {
    redeemer: js_sys::Uint8Array,
    // pub result: Result<js_sys::Uint8Array, String>,
    pub remaining_budget: JsExBudget,
    pub initial_budget: JsExBudget,
    traces: Vec<JsTrace>,
}

impl From<&(Vec<u8>, EvalResult)> for JsEvalResult {
    fn from(value: &(Vec<u8>, EvalResult)) -> Self {
        JsEvalResult::new(&value.0, &value.1)
    }
}

impl JsEvalResult {
    pub fn new(redeemer: &Vec<u8>, eval_result: &EvalResult) -> Self {
        let traces = eval_result
            .traces()
            .into_iter()
            .map(|t| t.into())
            .collect();
        Self {
            redeemer: js_sys::Uint8Array::from(&redeemer[..]),
            remaining_budget: eval_result.remaining_budget.into(),
            initial_budget: eval_result.initial_budget.into(),
            traces,
        }
    }
}

#[wasm_bindgen]
impl JsEvalResult {
    #[wasm_bindgen(getter)]
    pub fn traces(&self) -> Vec<JsTrace> {
        self.traces.clone()
    }
    #[wasm_bindgen(getter)]
    pub fn redeemer(&self) -> js_sys::Uint8Array {
        self.redeemer.clone()
    }
}