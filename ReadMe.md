# Decentralized Marketplace Smart Contract

## Overview

This Clarity smart contract implements a decentralized marketplace on the Stacks blockchain, enabling users to create, manage, and fulfill product listings and orders securely.

## Features

- Create product listings
- Update existing listings
- Place orders
- Fulfill orders
- Retrieve listing and order details

## Contract Components

### Data Maps
- `listings`: Stores information about product listings
- `orders`: Tracks individual order details

### Key Functions

#### `create-listing`
- Creates a new product listing
- Parameters: `item-id`, `price`, `quantity`
- Returns: Unique listing ID

#### `update-listing`
- Allows seller to modify listing price and quantity
- Requires seller authorization
- Parameters: `listing-id`, `new-price`, `new-quantity`

#### `create-order`
- Enables buyers to place orders
- Handles STX token transfer
- Updates listing quantity
- Parameters: `listing-id`, `quantity`
- Returns: Unique order ID

#### `fulfill-order`
- Allows seller to mark an order as fulfilled
- Requires seller authorization
- Parameter: `order-id`

### Read-Only Functions
- `get-listing`: Retrieve listing details
- `get-order`: Retrieve order details

## Error Handling

The contract includes custom error codes:
- `err-not-found` (u101): Resource not found
- `err-unauthorized` (u102): Unauthorized action
- `err-invalid-quantity` (u103): Invalid order quantity

## Security Considerations
- Seller authentication for listing updates
- Quantity validation during order creation
- Direct STX transfer between buyer and seller

## Requirements
- Stacks blockchain
- Clarity smart contract support

## Usage Example

```clarity
;; Create a listing
(create-listing u1 u100 u10)

;; Place an order
(create-order u1 u2)

;; Fulfill an order
(fulfill-order u1)
```

## Contributing
Contributions are welcome. Please submit pull requests or open issues for improvements or bug fixes.

## License
[Add your license information here]
