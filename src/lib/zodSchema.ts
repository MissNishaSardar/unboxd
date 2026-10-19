import { z } from "zod";

export const signinSchema = z.object({
  email: z.email({ error: "Enter a valid email" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(128, { error: "Password must be at most 128 characters" }),
  rememberMe: z.boolean().optional(),
});

export type signinType = z.infer<typeof signinSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email" }),
});

export type forgotPasswordType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .max(128, { error: "Password must be at most 128 characters" }),
    confirmPassword: z.string().min(1, { error: "Confirm your new password" }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type resetPasswordType = z.infer<typeof resetPasswordSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, { error: "Name must be at least 2 characters" }),
    email: z.email({ error: "Enter a valid email" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .max(128, { error: "Password must be at most 128 characters" }),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type signupType = z.infer<typeof signupSchema>;

const queryString = <T extends z.ZodType<string>>(schema: T) =>
  z
    .union([schema, z.array(schema)])
    .transform((value) => (Array.isArray(value) ? value[0] : value));

const csvStringArray = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    if (value === undefined || value === "" || value === null) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }, z.array(schema).default([]));

export const productSortSchema = z.enum([
  "price_asc",
  "price_desc",
  "newest",
  "rating_desc",
  "rating_asc",
]);

export const productListSearchParamsSchema = z
  .object({
    q: queryString(z.string().trim().min(1).max(100)).optional(),
    categories: csvStringArray(z.string().min(1).max(100)),
    category: queryString(z.string().min(1).max(100)).optional(),
    brands: csvStringArray(z.string().min(1).max(40)),
    brand: queryString(z.string().min(1).max(40)).optional(),
    sort: productSortSchema.catch("newest"),
    min: z
      .preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce.number().min(0).optional(),
      )
      .catch(undefined),
    max: z
      .preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce.number().min(0).optional(),
      )
      .catch(undefined),
    page: z.coerce.number().int().min(1).optional().catch(1),
  })
  .transform(({ category, categories, brand, brands, ...rest }) => ({
    ...rest,
    categories:
      categories.length > 0 ? categories
      : category ? [category]
      : [],
    brands:
      brands.length > 0 ? brands
      : brand ? [brand]
      : [],
  }));

export const searchSearchParamsSchema = z.object({
  q: queryString(z.string().trim().min(1).max(100)).optional(),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type searchSearchParamsType = z.infer<typeof searchSearchParamsSchema>;

export type productListSearchParamsType = z.infer<
  typeof productListSearchParamsSchema
>;

export const orderListSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type orderListSearchParamsType = z.infer<
  typeof orderListSearchParamsSchema
>;

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(80),
  phone: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const digits = value.replace(/\D/g, "");
      // Tolerate a pasted +91 country code or leading trunk 0.
      if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
      }
      if (digits.length === 11 && digits.startsWith("0")) {
        return digits.slice(1);
      }
      return digits;
    },
    z
      .string()
      .trim()
      .regex(/^[6-9][0-9]{9}$/, {
        error: "Enter a valid 10-digit mobile number",
      }),
  ),
  addressLine: z
    .string()
    .trim()
    .min(5, { error: "Address must be at least 5 characters" })
    .max(200),
  city: z
    .string()
    .trim()
    .min(2, { error: "City must be at least 2 characters" })
    .max(80),
  state: z.string().trim().min(1, { error: "Select a state" }).max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, { error: "Enter a valid 6-digit pincode" }),
});

export type checkoutType = z.infer<typeof checkoutSchema>;

export const userAddressSchema = checkoutSchema.extend({
  label: z
    .string()
    .trim()
    .max(20, { error: "Label must be at most 20 characters" })
    .optional()
    .or(z.literal("")),
});

export type userAddressType = z.infer<typeof userAddressSchema>;

export type userAddressInputType = z.input<typeof userAddressSchema>;

const money = (label: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .min(0, { error: `${label} must be 0 or more` })
      .max(999999, { error: `${label} must be at most 999999` }),
  );

const optionalDateTime = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      const zoned = new Date(trimmed);
      return Number.isNaN(zoned.getTime()) ? trimmed : zoned;
    }
    if (/T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      const withZone = new Date(`${trimmed}+05:30`);
      return Number.isNaN(withZone.getTime()) ? trimmed : withZone;
    }
    const istDate = new Date(`${trimmed}:00+05:30`);
    return Number.isNaN(istDate.getTime()) ? trimmed : istDate;
  }
  return value;
}, z.date().optional());

export const flashSaleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters" })
      .max(80, { error: "Name must be at most 80 characters" }),
    discountPercent: z.coerce
      .number()
      .int({ error: "Discount must be a whole percent" })
      .min(0, { error: "Discount must be 0 or more" })
      .max(90, { error: "Discount must be at most 90" })
      .default(0),
    startsAt: optionalDateTime,
    endsAt: optionalDateTime,
    bannerText: z
      .string()
      .trim()
      .max(140, { error: "Must be at most 140 characters" })
      .default(""),
    bannerEnabled: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after start time",
      });
    }
  });

export type flashSaleType = z.infer<typeof flashSaleSchema>;

export const productVariantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Variant name is required" })
    .max(100, { error: "Variant name must be at most 100 characters" }),
  stock: z.coerce.number().int().min(0, { error: "Stock must be 0 or more" }),
});

export type productVariantFormType = z.infer<typeof productVariantFormSchema>;

export const productImageFormSchema = z.object({
  url: z.string().min(1, { error: "Image URL is required" }),
  alt: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type productImageFormType = z.infer<typeof productImageFormSchema>;

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters" })
      .max(120, { error: "Name must be at most 120 characters" }),
    description: z
      .string()
      .trim()
      .min(10, { error: "Description must be at least 10 characters" })
      .max(2000, { error: "Description must be at most 2000 characters" }),
    basePrice: money("Base price"),
    discountPercent: z.coerce
      .number()
      .int({ error: "Discount must be a whole percent" })
      .min(0, { error: "Discount must be 0 or more" })
      .max(90, { error: "Discount must be at most 90" })
      .default(0),
    discountStartsAt: optionalDateTime,
    discountEndsAt: optionalDateTime,
    brand: z
      .string()
      .trim()
      .min(1, { error: "Brand is required" })
      .max(40, { error: "Brand must be at most 40 characters" }),
    categoryId: z.string().min(1, { error: "Select a category" }),
    isActive: z.boolean().default(true),
    variants: z
      .array(productVariantFormSchema)
      .min(1, { error: "Add at least one variant" }),
    images: z
      .array(productImageFormSchema)
      .min(1, { error: "Add at least one image" }),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.variants.forEach((variant, index) => {
      const key = variant.name.trim().toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "name"],
          message: "Variant names must be unique",
        });
      }
      seen.add(key);
    });
    if (
      data.discountStartsAt &&
      data.discountEndsAt &&
      data.discountEndsAt <= data.discountStartsAt
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["discountEndsAt"],
        message: "End time must be after start time",
      });
    }
  });

export type productFormType = z.infer<typeof productFormSchema>;
export type productFormInputType = z.input<typeof productFormSchema>;

export const adminProductSortSchema = z.enum([
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
]);

export const adminProductListSearchParamsSchema = z.object({
  search: queryString(z.string().min(1).max(100)).optional(),
  sort: adminProductSortSchema.catch("newest"),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
  stock: z.enum(["all", "low", "out"]).catch("all"),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type adminProductListSearchParamsType = z.infer<
  typeof adminProductListSearchParamsSchema
>;

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

export type orderStatusType = z.infer<typeof orderStatusSchema>;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const adminOrderSortSchema = z.enum(["date_desc", "date_asc"]);

export type adminOrderSortType = z.infer<typeof adminOrderSortSchema>;

export const adminOrderListSearchParamsSchema = z.object({
  search: queryString(z.string().min(1).max(100)).optional(),
  status: queryString(orderStatusSchema).optional(),
  date: queryString(dateStringSchema).optional(),
  sort: adminOrderSortSchema.catch("date_desc"),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type adminOrderListSearchParamsType = z.infer<
  typeof adminOrderListSearchParamsSchema
>;

export const cancelReasonSchema = z.enum([
  "changed_mind",
  "found_cheaper",
  "delivery_too_slow",
  "ordered_by_mistake",
  "payment_issue",
  "other",
]);

export type cancelReasonType = z.infer<typeof cancelReasonSchema>;

export const CANCEL_REASON_LABELS: Record<cancelReasonType, string> = {
  changed_mind: "Changed my mind",
  found_cheaper: "Found it cheaper elsewhere",
  delivery_too_slow: "Delivery is too slow",
  ordered_by_mistake: "Ordered by mistake",
  payment_issue: "Payment issue",
  other: "Other",
};

export const adminCancelReasonSchema = z.enum([
  "out_of_stock",
  "unable_to_fulfill",
  "address_issue",
  "suspected_fraud",
  "customer_request",
  "payment_unsettled",
  "other",
]);

export type adminCancelReasonType = z.infer<typeof adminCancelReasonSchema>;

export const ADMIN_CANCEL_REASON_LABELS: Record<adminCancelReasonType, string> =
  {
    out_of_stock: "Out of stock",
    unable_to_fulfill: "Unable to fulfill",
    address_issue: "Address issue",
    suspected_fraud: "Suspected fraud",
    customer_request: "Customer requested it",
    payment_unsettled: "Payment not settled",
    other: "Other",
  };

export const adminCancelOrderSchema = z
  .object({
    reason: adminCancelReasonSchema,
    note: z
      .string()
      .trim()
      .max(500, { error: "Note must be at most 500 characters" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reason === "other" && !data.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Please add a note when reason is Other",
      });
    }
  });

export type adminCancelOrderType = z.infer<typeof adminCancelOrderSchema>;

export const updateOrderStatusSchema = z
  .object({
    status: orderStatusSchema,
    reason: adminCancelReasonSchema.optional(),
    note: z
      .string()
      .trim()
      .max(500, { error: "Note must be at most 500 characters" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "CANCELLED" && !data.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Choose a cancellation reason",
      });
    }
    if (data.reason === "other" && !data.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Please add a note when reason is Other",
      });
    }
  });

export type updateOrderStatusType = z.infer<typeof updateOrderStatusSchema>;

export const cancelOrderSchema = z
  .object({
    reason: cancelReasonSchema,
    note: z
      .string()
      .trim()
      .max(500, { error: "Note must be at most 500 characters" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reason === "other" && !data.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Please add a note when reason is Other",
      });
    }
  });

export type cancelOrderType = z.infer<typeof cancelOrderSchema>;

export const bulkOrderStatusSchema = z
  .object({
    orderIds: z.array(z.string().min(1)).min(1),
    status: z.enum(["SHIPPED", "DELIVERED", "CANCELLED"]),
    reason: adminCancelReasonSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "CANCELLED" && !data.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Choose a cancellation reason",
      });
    }
  });

export type bulkOrderStatusType = z.infer<typeof bulkOrderStatusSchema>;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(80, { error: "Name must be at most 80 characters" }),
  parentId: z.string().min(1).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});

export type categoryFormType = z.infer<typeof categoryFormSchema>;

export type categoryFormInputType = z.input<typeof categoryFormSchema>;

export const reassignCategorySchema = z.object({
  targetCategoryId: z.string().min(1),
});

export const moveCategoryToSchema = z.object({
  parentId: z.string().min(1).nullable(),
  index: z.number().int().min(0).max(9999),
});

export type moveCategoryToType = z.infer<typeof moveCategoryToSchema>;

export type reassignCategoryType = z.infer<typeof reassignCategorySchema>;

export const userRoleSchema = z.enum(["admin", "user"]);

export type userRoleType = z.infer<typeof userRoleSchema>;

export const banUserSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(200, { error: "Reason must be at most 200 characters" })
    .optional(),
  expiryDays: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : value,
    z.coerce
      .number()
      .int({ error: "Expiry must be whole days" })
      .min(1, { error: "Expiry must be at least 1 day" })
      .max(30, { error: "Expiry must be at most 30 days" })
      .optional(),
  ),
});

export type banUserType = z.infer<typeof banUserSchema>;

export type banUserInputType = z.input<typeof banUserSchema>;

export const bulkUserIdsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

export type bulkUserIdsType = z.infer<typeof bulkUserIdsSchema>;

export const bulkProductIdsSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(100),
});

export type bulkProductIdsType = z.infer<typeof bulkProductIdsSchema>;

export const adminUserSortSchema = z.enum([
  "joined_desc",
  "joined_asc",
  "name_asc",
  "name_desc",
  "email_asc",
  "email_desc",
]);

export type adminUserSortType = z.infer<typeof adminUserSortSchema>;

export const adminUserListSearchParamsSchema = z.object({
  search: queryString(z.string().min(1).max(100)).optional(),
  role: z.enum(["all", "admin", "user"]).catch("all"),
  sort: adminUserSortSchema.catch("joined_desc"),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type adminUserListSearchParamsType = z.infer<
  typeof adminUserListSearchParamsSchema
>;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(80, { error: "Name must be at most 80 characters" }),
  image: z.string().trim().nullable().optional(),
});

export type profileUpdateType = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { error: "Current password must be at least 8 characters" })
      .max(128),
    newPassword: z
      .string()
      .min(8, { error: "New password must be at least 8 characters" })
      .max(128),
    confirmPassword: z.string().min(1, { error: "Confirm your new password" }),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type changePasswordType = z.infer<typeof changePasswordSchema>;

export const reviewCreateSchema = z.object({
  productId: z.string().min(1, { error: "Product is required" }),
  rating: z.number().int().min(1).max(5),
  title: z
    .string()
    .trim()
    .min(5, { error: "Title must be at least 5 characters" })
    .max(80, { error: "Title must be at most 80 characters" }),
  body: z
    .string()
    .trim()
    .min(10, { error: "Review must be at least 10 characters" })
    .max(1000, { error: "Review must be at most 1000 characters" }),
});

export type reviewCreateType = z.infer<typeof reviewCreateSchema>;

export const reviewHelpfulSchema = z.object({
  reviewId: z.string().min(1),
});

export type reviewHelpfulType = z.infer<typeof reviewHelpfulSchema>;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(80, { error: "Name must be at most 80 characters" }),
  email: z.email({ error: "Enter a valid email" }),
  subject: z
    .string()
    .trim()
    .min(5, { error: "Subject must be at least 5 characters" })
    .max(120, { error: "Subject must be at most 120 characters" }),
  message: z
    .string()
    .trim()
    .min(10, { error: "Message must be at least 10 characters" })
    .max(1000, { error: "Message must be at most 1000 characters" }),
});

export type contactType = z.infer<typeof contactSchema>;

export const storeSettingsSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, { error: "Store name must be at least 2 characters" })
    .max(60, { error: "Store name must be at most 60 characters" }),
  supportEmail: z.email({ error: "Enter a valid email" }),
  supportPhone: z
    .string()
    .trim()
    .max(20, { error: "Phone must be at most 20 characters" }),
  codEnabled: z.boolean(),
  deliveryDays: z.coerce
    .number()
    .int()
    .min(1, { error: "Must be at least 1 day" })
    .max(30, { error: "Must be at most 30 days" }),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(2, { error: "Must be at least 2 units" })
    .max(50, { error: "Must be at most 50 units" }),
  returnWindowDays: z.coerce
    .number()
    .int()
    .min(1, { error: "Must be at least 1 day" })
    .max(90, { error: "Must be at most 90 days" }),
  freeShippingThreshold: z.coerce
    .number()
    .min(0, { error: "Must be at least 0" })
    .max(1000000, { error: "Too large" }),
  shippingFlatRate: z.coerce
    .number()
    .min(0, { error: "Must be at least 0" })
    .max(100000, { error: "Too large" }),
  maxDiscountPercent: z.coerce
    .number()
    .int({ error: "Must be a whole percent" })
    .min(0, { error: "Must be at least 0" })
    .max(90, { error: "Must be at most 90" }),
});

export type storeSettingsType = z.infer<typeof storeSettingsSchema>;
