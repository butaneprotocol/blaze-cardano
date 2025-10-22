use cardano/governance.{ProposalProcedure, Voter}

validator script(_param1: Int, _param2: ByteArray) {
  vote(_r: Data, _v: Voter, _self: Data) {
    True
  }

  propose(_r: Data, _p: ProposalProcedure, _self: Data) {
    True
  }

  else(_) {
    fail
  }
}
