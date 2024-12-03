;; Incentive System Contract

(define-fungible-token eco-token)

(define-map farmer-scores
  { farmer: principal }
  {
    sustainability-score: uint,
    ethical-score: uint,
    total-rewards: uint
  }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))

(define-public (register-farmer (farmer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set farmer-scores
      { farmer: farmer }
      {
        sustainability-score: u0,
        ethical-score: u0,
        total-rewards: u0
      }
    )
    (ok true)
  )
)

(define-public (update-farmer-scores (farmer principal) (sustainability-delta int) (ethical-delta int))
  (let
    ((current-scores (unwrap! (map-get? farmer-scores { farmer: farmer }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set farmer-scores
      { farmer: farmer }
      {
        sustainability-score: (max u0 (+ (get sustainability-score current-scores) sustainability-delta)),
        ethical-score: (max u0 (+ (get ethical-score current-scores) ethical-delta)),
        total-rewards: (get total-rewards current-scores)
      }
    )
    (ok true)
  )
)

(define-public (distribute-rewards (farmer principal) (amount uint))
  (let
    ((current-scores (unwrap! (map-get? farmer-scores { farmer: farmer }) err-not-found)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (try! (ft-mint? eco-token amount farmer))
    (map-set farmer-scores
      { farmer: farmer }
      (merge current-scores {
        total-rewards: (+ (get total-rewards current-scores) amount)
      })
    )
    (ok true)
  )
)

(define-read-only (get-farmer-scores (farmer principal))
  (map-get? farmer-scores { farmer: farmer })
)

(define-read-only (get-token-balance (farmer principal))
  (ok (ft-get-balance eco-token farmer))
)

