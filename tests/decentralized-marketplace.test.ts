import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let listings: { [key: number]: any } = {}
let orders: { [key: number]: any } = {}
let lastListingId = 0
let lastOrderId = 0
let stxBalances: { [key: string]: number } = {}

// Mock supply chain contract
const mockSupplyChain = {
  getFoodItem: (itemId: number) => ({
    current_owner: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
  }),
  transferOwnership: (itemId: number, newOwner: string) => ({ success: true })
}

// Mock contract functions
const createListing = (sender: string, itemId: number, price: number, quantity: number) => {
  if (sender !== mockSupplyChain.getFoodItem(itemId).current_owner) {
    return { success: false, error: 102 }
  }
  lastListingId++
  listings[lastListingId] = {
    seller: sender,
    item_id: itemId,
    price,
    quantity,
    status: 'active'
  }
  return { success: true, value: lastListingId }
}

const updateListing = (sender: string, listingId: number, newPrice: number, newQuantity: number) => {
  const listing = listings[listingId]
  if (!listing) {
    return { success: false, error: 101 }
  }
  if (listing.seller !== sender) {
    return { success: false, error: 102 }
  }
  listing.price = newPrice
  listing.quantity = newQuantity
  return { success: true }
}

const createOrder = (sender: string, listingId: number, quantity: number) => {
  const listing = listings[listingId]
  if (!listing) {
    return { success: false, error: 101 }
  }
  if (quantity > listing.quantity) {
    return { success: false, error: 103 }
  }
  const totalPrice = listing.price * quantity
  if ((stxBalances[sender] || 0) < totalPrice) {
    return { success: false, error: 104 }
  }
  
  stxBalances[sender] -= totalPrice
  stxBalances[listing.seller] = (stxBalances[listing.seller] || 0) + totalPrice
  
  lastOrderId++
  orders[lastOrderId] = {
    buyer: sender,
    listing_id: listingId,
    quantity,
    total_price: totalPrice,
    status: 'created'
  }
  
  listing.quantity -= quantity
  
  return { success: true, value: lastOrderId }
}

const fulfillOrder = (sender: string, orderId: number) => {
  const order = orders[orderId]
  if (!order) {
    return { success: false, error: 101 }
  }
  const listing = listings[order.listing_id]
  if (listing.seller !== sender) {
    return { success: false, error: 102 }
  }
  mockSupplyChain.transferOwnership(listing.item_id, order.buyer)
  order.status = 'fulfilled'
  return { success: true }
}

const getListing = (listingId: number) => {
  return listings[listingId] || null
}

const getOrder = (orderId: number) => {
  return orders[orderId] || null
}

describe('DecentralizedMarketplace', () => {
  beforeEach(() => {
    listings = {}
    orders = {}
    lastListingId = 0
    lastOrderId = 0
    stxBalances = {
      'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG': 10000,
      'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC': 5000
    }
  })
  
  it('allows creating a listing', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const result = createListing(wallet1, 1, 100, 10)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const listing = getListing(1)
    expect(listing).toEqual({
      seller: wallet1,
      item_id: 1,
      price: 100,
      quantity: 10,
      status: 'active'
    })
  })
  
  it('allows updating a listing', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    createListing(wallet1, 1, 100, 10)
    
    const result = updateListing(wallet1, 1, 120, 8)
    expect(result.success).toBe(true)
    
    const listing = getListing(1)
    expect(listing.price).toBe(120)
    expect(listing.quantity).toBe(8)
  })
  
  it('allows creating an order', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createListing(wallet1, 1, 100, 10)
    
    const result = createOrder(wallet2, 1, 2)
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const order = getOrder(1)
    expect(order).toEqual({
      buyer: wallet2,
      listing_id: 1,
      quantity: 2,
      total_price: 200,
      status: 'created'
    })
    
    expect(stxBalances[wallet1]).toBe(10200)
    expect(stxBalances[wallet2]).toBe(4800)
    
    const updatedListing = getListing(1)
    expect(updatedListing.quantity).toBe(8)
  })
  
  it('allows fulfilling an order', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createListing(wallet1, 1, 100, 10)
    createOrder(wallet2, 1, 2)
    
    const result = fulfillOrder(wallet1, 1)
    expect(result.success).toBe(true)
    
    const order = getOrder(1)
    expect(order.status).toBe('fulfilled')
  })
  
  it('prevents creating an order with insufficient quantity', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createListing(wallet1, 1, 100, 10)
    
    const result = createOrder(wallet2, 1, 15)
    expect(result.success).toBe(false)
    expect(result.error).toBe(103)
  })
  
  it('prevents creating an order with insufficient funds', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createListing(wallet1, 1, 1000, 10)
    
    const result = createOrder(wallet2, 1, 6)
    expect(result.success).toBe(false)
    expect(result.error).toBe(104)
  })
})

