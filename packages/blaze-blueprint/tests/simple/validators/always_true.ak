use cardano/transaction.{OutputReference, Transaction}

validator script(_param1: Int, _param2: ByteArray) {
  spend(
    _datum: Option<List<Int>>,
    _redeemer: Int,
    utxo: OutputReference,
    self: Transaction,
  ) {
    True
  }

  else(_) {
    fail
  }
}
