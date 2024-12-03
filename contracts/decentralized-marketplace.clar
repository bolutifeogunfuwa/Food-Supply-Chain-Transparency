;; Decentralized Marketplace Contract

(define-map listings
  { listing-id: uint }
  {
    seller: principal,
    item-id: uint,
    price: uint,
    quantity: uint,
    status: (string-ascii 20)
  }
)

(define-map orders
  { order-id: uint }
  {
    buyer: principal,
    listing-id: uint,
    quantity: uint,
    total-price: uint,
    status: (string-ascii 20)
  }
)

(define-data-var last-listing-id uint u0)
(define-data-var last-order-id uint u0)

(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-invalid-quantity (err u103))

(define-public (create-listing (item-id uint) (price uint) (quantity uint))
  (let
    ((new-id (+ (var-get last-listing-id) u1)))
    (map-set listings
      { listing-id: new-id }
      {
        seller: tx-sender,
        item-id: item-id,
        price: price,
        quantity: quantity,
        status: "active"
      }
    )
    (var-set last-listing-id new-id)
    (ok new-id)
  )
)

(define-public (update-listing (listing-id uint) (new-price uint) (new-quantity uint))
  (let
    ((listing (unwrap! (map-get? listings { listing-id: listing-id }) err-not-found)))
    (asserts! (is-eq tx-sender (get seller listing)) err-unauthorized)
    (map-set listings
      { listing-id: listing-id }
      (merge listing {
        price: new-price,
        quantity: new-quantity
      })
    )
    (ok true)
  )
)

(define-public (create-order (listing-id uint) (quantity uint))
  (let
    ((listing (unwrap! (map-get? listings { listing-id: listing-id }) err-not-found))
     (new-id (+ (var-get last-order-id) u1))
     (total-price (* (get price listing) quantity)))
    (asserts! (<= quantity (get quantity listing)) err-invalid-quantity)
    (try! (stx-transfer? total-price tx-sender (get seller listing)))
    (map-set orders
      { order-id: new-id }
      {
        buyer: tx-sender,
        listing-id: listing-id,
        quantity: quantity,
        total-price: total-price,
        status: "created"
      }
    )
    (map-set listings
      { listing-id: listing-id }
      (merge listing {
        quantity: (- (get quantity listing) quantity)
      })
    )
    (var-set last-order-id new-id)
    (ok new-id)
  )
)

(define-public (fulfill-order (order-id uint))
  (let
    ((order (unwrap! (map-get? orders { order-id: order-id }) err-not-found))
     (listing (unwrap! (map-get? listings { listing-id: (get listing-id order) }) err-not-found)))
    (asserts! (is-eq tx-sender (get seller listing)) err-unauthorized)
    (map-set orders
      { order-id: order-id }
      (merge order {
        status: "fulfilled"
      })
    )
    (ok true)
  )
)

(define-read-only (get-listing (listing-id uint))
  (map-get? listings { listing-id: listing-id })
)

(define-read-only (get-order (order-id uint))
  (map-get? orders { order-id: order-id })
)

