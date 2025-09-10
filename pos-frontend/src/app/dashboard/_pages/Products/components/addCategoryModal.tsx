'use client'

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
// import { CATEGORIES_KEY } from "@/hooks/categories/useCategoryApi";
import useSWR from "swr";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductModal } from "@/contexts/productRegister-context";
import useAddCategory from "@/hooks/products/useAddCategory";
import { useProductFormStore } from "@/stores/productFormStore";
const CATEGORIES_KEY = "categories:list";
export default function AddCategoryModal() {
  const { isOpen, closeModal } = useProductModal();
  const { addCategory, loading, error } = useAddCategory();
  const setCategoryId = useProductFormStore((s) => s.setCategoryId);
  const setCategoryName = useProductFormStore((s) => s.setCategoryName);
  const [name, setName] = useState("");
  const { data: categories = [] } = useSWR(CATEGORIES_KEY);
  const [clientError, setClientError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen("addCategory")) {
      setName("");
      setShowValidation(false);
      setClientError(null);
    }
  }, [isOpen]);

  // Validation helper (pure)
  const validateName = useCallback(
    (raw: string): string | null => {
      const trimmed = (raw || "").trim();
      if (!trimmed) return "Name is required";
      if (trimmed.length < 2) return "Name is too short";
      // duplicate check against current categories
      const exists = (categories as any[]).some(
        (c) => String(c?.name ?? "").toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return "Category with this name already exists";
      return null;
    },
    [categories]
  );

  // Called on every input change — only update error state when it actually changes
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setName(v);
      setShowValidation(false); // reset visible validation while typing
      const err = validateName(v);
      setClientError((prev) => (prev === err ? prev : err));
    },
    [validateName]
  );

  // Submit handler runs validation again (shows errors) and only proceeds when valid
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // show validation UI
      setShowValidation(true);
      const err = validateName(name);
      if (err) {
        setClientError((prev) => (prev === err ? prev : err));
        return;
      }

      setClientError(null);
      setIsSubmitting(true);
      try {
        await addCategory(
          { name: name.trim() },
          {
            onSuccess: (createdRaw) => {
              const created = createdRaw?.data ?? createdRaw;
              if (!created) return;

              // optimistic insert then revalidate
              mutate(
                CATEGORIES_KEY,
                (current: any[] = []) => {
                  const exists = current.some((c) => String(c?.id) === String(created?.id));
                  return exists ? current : [created, ...current];
                },
                false
              );
              mutate(CATEGORIES_KEY);

              const createdId = created?.id ?? created?._id;
              const createdName = created?.name ?? "";
              if (createdId != null) {
                setCategoryId(String(createdId));
                setCategoryName(createdName);
              } else {
                showSuccessToast("Category added", "Added but ID was not returned.");
              }

              closeModal("addCategory");
              showSuccessToast("Category added", createdName || "New category created.");
            },
          }
        );
      } catch (err: any) {
        showErrorToast("Failed to add category", err?.message ?? "An error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, addCategory, setCategoryId, setCategoryName, closeModal, validateName]
  );

  return (
    <Dialog open={isOpen("addCategory")} onOpenChange={(v) => { if (!v) closeModal("addCategory"); }}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Fill in the details below to add a new category.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Name</Label>

              <Input
                id="category-name"
                value={name}
                onChange={handleNameChange}
                placeholder="Category name"
                required
                autoFocus
              />

            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          <DialogFooter className="mt-2">
            <div className=" flex flex-col w-full gap-2">
              <div className="flex justify-start">
                {showValidation && clientError && <div className="text-sm text-red-600">{clientError}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => closeModal("addCategory")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim() || isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}