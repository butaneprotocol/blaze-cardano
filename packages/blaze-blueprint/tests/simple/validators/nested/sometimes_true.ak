use cardano/transaction.{OutputReference, Transaction}

validator script(param: Int) {
  spend(
    datum: Option<Data>,
    redeemer: Int,
    utxo: OutputReference,
    self: Transaction,
  ) {
    redeemer > param
  }

  else(_) {
    fail
  }
}
