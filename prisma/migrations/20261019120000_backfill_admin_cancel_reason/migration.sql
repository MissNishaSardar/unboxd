-- Backfill admin cancellation reasons for orders cancelled before the reason
-- split. Admin cancels previously wrote into "cancelReason". A customer cancel
-- sets "cancelledBy" to the order owner, so a differing "cancelledBy"
-- identifies a store cancel. Rows with a null "cancelledBy" keep their value in
-- "cancelReason" and still resolve through the read fallback.
UPDATE "Order"
SET "adminCancelReason" = "cancelReason"
WHERE "status" = 'CANCELLED'
  AND "adminCancelReason" IS NULL
  AND "cancelReason" IS NOT NULL
  AND "cancelledBy" IS NOT NULL
  AND "cancelledBy" <> "userId";
