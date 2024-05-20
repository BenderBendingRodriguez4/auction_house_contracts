import {
  OwnershipTransferred as OwnershipTransferredEvent,
  AuctioneerChanged as AuctioneerChangedEvent,
  AuctionStarted as AuctionStartedEvent,
  AuctionEnded as AuctionEndedEvent,
  BidSubmitted as BidSubmittedEvent,
} from "../generated/auctionHouseContract/auctionHouseContract"
import {
  OwnershipTransferred,
  AuctioneerChanged,
  AuctionStarted,
  AuctionEnded,
  BidSubmitted,
} from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previous_owner = event.params.previous_owner
  entity.new_owner = event.params.new_owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuctioneerChanged(event: AuctioneerChangedEvent): void {
  let entity = new AuctioneerChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previous_auctioneer = event.params.previous_auctioneer
  entity.new_auctioneer = event.params.new_auctioneer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuctionStarted(event: AuctionStartedEvent): void {
  let entity = new AuctionStarted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.lot = event.params.lot
  entity.patron = event.params.patron
  entity.end_date = event.params.end_date

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleAuctionEnded(event: AuctionEndedEvent): void {
  let entity = new AuctionEnded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.lot = event.params.lot
  entity.winner = event.params.winner
  entity.proceeds = event.params.proceeds

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBidSubmitted(event: BidSubmittedEvent): void {
  let entity = new BidSubmitted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.lot = event.params.lot
  entity.bidder = event.params.bidder
  entity.bid = event.params.bid
  entity.new_end_date = event.params.new_end_date

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
