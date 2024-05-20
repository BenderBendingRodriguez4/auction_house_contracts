import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  AuctioneerChanged,
  AuctionStarted,
  AuctionEnded,
  BidSubmitted
} from "../generated/auctionHouseContract/auctionHouseContract"

export function createOwnershipTransferredEvent(
  previous_owner: Address,
  new_owner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previous_owner",
      ethereum.Value.fromAddress(previous_owner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("new_owner", ethereum.Value.fromAddress(new_owner))
  )

  return ownershipTransferredEvent
}

export function createAuctioneerChangedEvent(
  previous_auctioneer: Address,
  new_auctioneer: Address
): AuctioneerChanged {
  let auctioneerChangedEvent = changetype<AuctioneerChanged>(newMockEvent())

  auctioneerChangedEvent.parameters = new Array()

  auctioneerChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previous_auctioneer",
      ethereum.Value.fromAddress(previous_auctioneer)
    )
  )
  auctioneerChangedEvent.parameters.push(
    new ethereum.EventParam(
      "new_auctioneer",
      ethereum.Value.fromAddress(new_auctioneer)
    )
  )

  return auctioneerChangedEvent
}

export function createAuctionStartedEvent(
  lot: BigInt,
  patron: Address,
  end_date: BigInt
): AuctionStarted {
  let auctionStartedEvent = changetype<AuctionStarted>(newMockEvent())

  auctionStartedEvent.parameters = new Array()

  auctionStartedEvent.parameters.push(
    new ethereum.EventParam("lot", ethereum.Value.fromUnsignedBigInt(lot))
  )
  auctionStartedEvent.parameters.push(
    new ethereum.EventParam("patron", ethereum.Value.fromAddress(patron))
  )
  auctionStartedEvent.parameters.push(
    new ethereum.EventParam(
      "end_date",
      ethereum.Value.fromUnsignedBigInt(end_date)
    )
  )

  return auctionStartedEvent
}

export function createAuctionEndedEvent(
  lot: BigInt,
  winner: Address,
  proceeds: BigInt
): AuctionEnded {
  let auctionEndedEvent = changetype<AuctionEnded>(newMockEvent())

  auctionEndedEvent.parameters = new Array()

  auctionEndedEvent.parameters.push(
    new ethereum.EventParam("lot", ethereum.Value.fromUnsignedBigInt(lot))
  )
  auctionEndedEvent.parameters.push(
    new ethereum.EventParam("winner", ethereum.Value.fromAddress(winner))
  )
  auctionEndedEvent.parameters.push(
    new ethereum.EventParam(
      "proceeds",
      ethereum.Value.fromUnsignedBigInt(proceeds)
    )
  )

  return auctionEndedEvent
}

export function createBidSubmittedEvent(
  lot: BigInt,
  bidder: Address,
  bid: BigInt,
  new_end_date: BigInt
): BidSubmitted {
  let bidSubmittedEvent = changetype<BidSubmitted>(newMockEvent())

  bidSubmittedEvent.parameters = new Array()

  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam("lot", ethereum.Value.fromUnsignedBigInt(lot))
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam("bidder", ethereum.Value.fromAddress(bidder))
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam("bid", ethereum.Value.fromUnsignedBigInt(bid))
  )
  bidSubmittedEvent.parameters.push(
    new ethereum.EventParam(
      "new_end_date",
      ethereum.Value.fromUnsignedBigInt(new_end_date)
    )
  )

  return bidSubmittedEvent
}
