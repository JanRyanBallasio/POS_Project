import { z } from "zod";

export const getCategoryId = (c: any) => c?.id ?? c?._id ?? c?.category_id ?? c?.categoryId ?? c?.ID ?? null;

// 🎯 SIMPLIFIED ZOD: Better error messages and validation
export const ProductFormSchema = z.object({
  name: z.string()
    .min(1, "Product name is required")
    .max(100, "Product name must be less than 100 characters")
    .trim(),
  
  barcode: z.string()
    .min(1, "Barcode is required")
    .regex(/^\d+$/, "Barcode must contain only digits")
    .min(3, "Barcode must be at least 3 digits")
    .max(20, "Barcode must be less than 20 digits")
    .trim(),
  
  category_id: z.number()
    .int("Category must be a valid selection")
    .min(1, "Please select a valid category"),
  
  price: z.number()
    .min(0, "Price must be 0 or greater")
    .max(999999.99, "Price is too high"),
  
  quantity: z.number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity must be 0 or greater")
    .max(999999, "Quantity is too high"),

  unit: z.string()
    .min(1, "Unit is required")
    .refine((val) => ["pcs", "kg", "pck"].includes(val), {
      message: "Unit must be pcs, kg, or pck"
    }),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;
