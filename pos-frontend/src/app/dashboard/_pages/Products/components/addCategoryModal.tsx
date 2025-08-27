'use client'

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CATEGORIES_KEY } from "@/hooks/categories/useCategoryApi";

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

  useEffect(() => {
    if (!isOpen("addCategory")) {
      setName("");
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;

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

          <DialogFooter className="mt-5">
            <Button variant="outline" type="button" onClick={() => closeModal("addCategory")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}