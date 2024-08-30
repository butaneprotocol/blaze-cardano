use aiken/transaction.{ScriptContext}

validator(param: Int) {
  pub fn spend(redeemer: Int, _context: ScriptContext) {
    redeemer > param
  }
}