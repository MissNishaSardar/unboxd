import { z } from "zod";

export const signinSchema = z.object({
  email: z.email({ error: "Enter a valid email" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(128, { error: "Password must be at most 128 characters" }),
});

export type signinType = z.infer<typeof signinSchema>;

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

export const productSortSchema = z.enum(["price_asc", "price_desc", "newest"]);

export const productListSearchParamsSchema = z.object({
  category: queryString(z.string().min(1).max(100)).optional(),
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
});

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
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,15}$/, { error: "Enter a valid phone number" }),
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
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, { error: "Enter a valid 6-digit pincode" }),
});

export type checkoutType = z.infer<typeof checkoutSchema>;

const money = (label: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number()
      .min(0, { error: `${label} must be 0 or more` })
      .max(999999, { error: `${label} must be at most 999999` }),
  );

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
  });

export type productFormType = z.infer<typeof productFormSchema>;
export type productFormInputType = z.input<typeof productFormSchema>;

export const adminProductSortSchema = z.enum([
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
]);

export const adminProductListSearchParamsSchema = z.object({
  search: queryString(z.string().min(1).max(100)).optional(),
  sort: adminProductSortSchema.catch("newest"),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
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

export const adminOrderListSearchParamsSchema = z.object({
  search: queryString(z.string().min(1).max(100)).optional(),
  status: queryString(orderStatusSchema).optional(),
  date: queryString(dateStringSchema).optional(),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type adminOrderListSearchParamsType = z.infer<
  typeof adminOrderListSearchParamsSchema
>;

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export type updateOrderStatusType = z.infer<typeof updateOrderStatusSchema>;

export const bulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
  status: z.enum(["SHIPPED", "CANCELLED"]),
});

export type bulkOrderStatusType = z.infer<typeof bulkOrderStatusSchema>;

export const updateVariantStockSchema = z.object({
  stock: z.coerce.number().int().min(0),
});

export type updateVariantStockType = z.infer<typeof updateVariantStockSchema>;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(80, { error: "Name must be at most 80 characters" }),
  parentId: z.string().min(1).optional().or(z.literal("")),
});

export type categoryFormType = z.infer<typeof categoryFormSchema>;

export const reassignCategorySchema = z.object({
  targetCategoryId: z.string().min(1),
});

export type reassignCategoryType = z.infer<typeof reassignCategorySchema>;

export const userRoleSchema = z.enum(["admin", "user"]);

export type userRoleType = z.infer<typeof userRoleSchema>;

export const bulkUserIdsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

export type bulkUserIdsType = z.infer<typeof bulkUserIdsSchema>;

export const adminUserListSearchParamsSchema = z.object({
  search: queryString(z.string().min(1).max(100)).optional(),
  role: z.enum(["all", "admin", "user"]).catch("all"),
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
  bio: z
    .string()
    .trim()
    .max(160, { error: "Bio must be at most 160 characters" })
    .optional()
    .or(z.literal("")),
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
