'use client'

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
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

export default function AddCategoryModal() {
  const { activeModal, closeModal } = useProductModal();
  const { refetch } = useCategories();
  const { addCategory, loading, error } = useAddCategory();

  const [name, setName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeModal !== "addCategory") {
      setName("");
      setSuccess(null);
    }
  }, [activeModal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("AddCategoryModal.handleSubmit called", { name });
    if (!name.trim()) return;
    try {
      await addCategory(
        { name: name.trim() },
        {
          onSuccess: (created) => {
            console.log("AddCategoryModal.onSuccess", created);
            setName("");
            setSuccess("Category added");

            // show sonner toast (soft-success style)
            toast.success("Category added", {
              style: {
                '--normal-bg':
                  'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
              } as React.CSSProperties
            });

            // close modal shortly after success so user sees the toast
            setTimeout(() => {
              closeModal();
              setSuccess(null);
            }, 600);

            // refresh category list
            refetch?.();
          },
        }
      );
    } catch (err) {
      console.error("Add category failed (modal)", err);
    }
  }

  return (
    <Dialog open={activeModal === "addCategory"} onOpenChange={(v) => { if (!v) closeModal(); }}>
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
            <Button variant="outline" type="button" onClick={() => closeModal()}>
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