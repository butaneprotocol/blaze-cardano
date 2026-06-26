use cardano/transaction.{OutputReference, Transaction}

validator always_true {
  spend(_datum: Option<Data>, _redeemer: Data, _own_ref: OutputReference, _self: Transaction) {
    True
  }
}
