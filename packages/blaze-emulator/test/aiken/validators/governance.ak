use cardano/governance.{DelegateRepresentative, ProposalProcedure, Voter}

validator guard(expected_redeemer: Int, minimum_deposit: Int) {
  vote(redeemer: Int, voter: Voter, _self: Data) {
    redeemer == expected_redeemer &&
      when voter is {
        DelegateRepresentative(_) -> True
        _ -> False
      }
  }

  propose(redeemer: Int, proposal: ProposalProcedure, _self: Data) {
    redeemer == expected_redeemer && proposal.deposit >= minimum_deposit
  }

  publish(redeemer: Int, _certificate: Data, _self: Data) {
    redeemer == expected_redeemer
  }

  else(_) {
    fail
  }
}
