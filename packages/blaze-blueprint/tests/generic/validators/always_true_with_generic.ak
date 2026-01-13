use cardano/transaction.{OutputReference, Transaction}

pub type GenericType<t> {
  action: t,
}

validator script(_param1: Int, _param2: ByteArray, _param3: GenericType<OutputReference>) {
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

validator script_no_params() {
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
