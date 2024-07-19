use aiken/transaction.{ScriptContext}

validator(_param1: Int, _param2: ByteArray) {
  pub fn spend(_datum: List<Int>, _redeemer: Int, _context: ScriptContext) {
    True
  }
}
