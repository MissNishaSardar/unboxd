import { z } from "zod";

export const signinSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type signinType = z.infer<typeof signinSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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
  min: z.coerce.number().min(0).optional().catch(undefined),
  max: z.coerce.number().min(0).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export type productListSearchParamsType = z.infer<
  typeof productListSearchParamsSchema
>;
