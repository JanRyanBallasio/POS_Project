'use client'

import React, { useState, useEffect } from "react";
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
import { useCategories } from "@/hooks/global/fetching/useCategories";
import useAddCategory from "@/hooks/products/useAddCategory";
import { useProductFormStore } from "@/stores/productFormStore";

export default function AddCategoryModal() {
  const { isOpen, closeModal, openModal } = useProductModal();
  const { refetch } = useCategories();
  const { addCategory, loading, error } = useAddCategory();
  const setCategoryId = useProductFormStore((s) => s.setCategoryId);
  const setCategoryName = useProductFormStore((s) => s.setCategoryName);
  const [name, setName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen("addCategory")) {
      setName("");
      setSuccess(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addCategory(
        { name: name.trim() },
        {
          onSuccess: (createdRaw) => {
            // normalize in case API returns { data: {...} } or returns object directly
            const created = createdRaw?.data ?? createdRaw;

            // optimistic update: add new item to the front (prevent duplicate by id)
            mutate(CATEGORIES_KEY, (current: any[] = []) => {
              if (!created) return current;
              const exists = current.some(c => String(c?.id) === String(created?.id));
              return exists ? current : [created, ...current];
            }, false);

            // revalidate after optimistic update
            mutate(CATEGORIES_KEY);

            // set into store as before
            const createdId = created?.id ?? created?._id;
            const createdName = created?.name ?? "";
            if (createdId != null) {
              setCategoryId(String(createdId));
              setCategoryName(createdName);
            } else {
              console.warn("[AddCategoryModal] created object has no id field:", created);
            }

            setTimeout(() => {
              closeModal("addCategory");
              setSuccess(null);
            }, 600);
          },
        }
      );
    } catch (err) {
      console.error("Add category failed (modal)", err);
    }
  }

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
            <Button
              type="submit"
              disabled={loading}
              onClick={(ev) => {
                ev.preventDefault();
                handleSubmit(ev as unknown as React.FormEvent);
              }}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}