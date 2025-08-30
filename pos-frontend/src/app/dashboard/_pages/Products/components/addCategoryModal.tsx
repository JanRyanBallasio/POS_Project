'use client'

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CATEGORIES_KEY } from "@/hooks/categories/useCategoryApi";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductModal } from "@/contexts/productRegister-context";
import useAddCategory from "@/hooks/products/useAddCategory";
import { useProductFormStore } from "@/stores/productFormStore";

export default function AddCategoryModal() {
  const { isOpen, closeModal } = useProductModal();
  const { addCategory, loading, error } = useAddCategory();
  const setCategoryId = useProductFormStore((s) => s.setCategoryId);
  const setCategoryName = useProductFormStore((s) => s.setCategoryName);
  const [name, setName] = useState("");
  const { data: categories = [] } = useSWR(CATEGORIES_KEY);
  const [clientError, setClientError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  
  useEffect(() => {
    if (!isOpen("addCategory")) {
      setName("");
      setShowValidation(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setClientError("Name is required");
      return;
    }
    const exists = (categories as any[]).some(
      (c) => String(c?.name ?? "").toLowerCase() === trimmed.toLowerCase()
    );
    setClientError(exists ? "Category with this name already exists" : null);
  }, [name, categories]);
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setShowValidation(true);
      const trimmed = name.trim();
      if (!trimmed) {
        setClientError("Category name is required");
        return;
      }

      const exists = (categories as any[]).some(
        (c) => String(c?.name ?? "").toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) {
        setClientError("Category with this name already exists");
        return;
      }

      try {
        await addCategory(
          { name: trimmed },
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
                toast("Category added", { description: "Added but ID was not returned." });
              }

              closeModal("addCategory");
              toast("Category added", { description: createdName || "New category created." });
            },
          }
        );
      } catch (err: any) {
        toast("Failed to add category", { description: err?.message ?? "An error occurred." });
      }
    },
    [name, addCategory, setCategoryId, setCategoryName, closeModal]
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
                onChange={(e) => setName(e.target.value)}
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
                 <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}