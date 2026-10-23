-- One physical place per user. The address book never repeats the same
-- physical address, and label is display only so it stays out of the key.

-- Collapse legacy twin rows first so the index below can be created. The
-- oldest row in each twin group is kept, newer copies are removed.
DELETE FROM "UserAddress"
WHERE "id" NOT IN (
  SELECT MIN("id")
  FROM "UserAddress"
  GROUP BY "userId", "name", "phone", "addressLine", "city", "state", "pincode"
);

-- Restore the invariant of one default per user with at least one address.
UPDATE "UserAddress" AS ua
SET "isDefault" = 0
WHERE "isDefault" = 1
  AND EXISTS (
    SELECT 1
    FROM "UserAddress" AS u2
    WHERE u2."userId" = ua."userId"
      AND u2."isDefault" = 1
      AND u2."id" < ua."id"
  );

UPDATE "UserAddress" AS ua
SET "isDefault" = 1
WHERE "isDefault" = 0
  AND NOT EXISTS (
    SELECT 1
    FROM "UserAddress" AS u2
    WHERE u2."userId" = ua."userId"
      AND u2."isDefault" = 1
  )
  AND ua."updatedAt" = (
    SELECT MAX(u3."updatedAt")
    FROM "UserAddress" AS u3
    WHERE u3."userId" = ua."userId"
  );

-- The composite unique that makes repeat saves and colliding edits fail at
-- the database level instead of relying on the check-then-write order.
CREATE UNIQUE INDEX "UserAddress_twin_unique" ON "UserAddress"("userId", "name", "phone", "addressLine", "city", "state", "pincode");
