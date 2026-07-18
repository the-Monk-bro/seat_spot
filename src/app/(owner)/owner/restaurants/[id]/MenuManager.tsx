"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/ImageUploader";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/actions/menu.actions";
import { formatPrice } from "@/lib/utils";
import type { IMenuItem } from "@/types";

interface MenuManagerProps {
  items: IMenuItem[];
  restaurantId: string;
}

function MenuItemForm({
  restaurantId,
  item,
  existingCategories,
  onSuccess,
}: {
  restaurantId: string;
  item?: IMenuItem;
  existingCategories: string[];
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState(item?.image ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    if (image) fd.append("image", image);

    const result = item
      ? await updateMenuItem(item._id, restaurantId, fd)
      : await createMenuItem(restaurantId, fd);

    if (result.success) {
      toast.success(item ? "Item updated" : "Item added");
      onSuccess();
    } else {
      toast.error(result.error ?? "Failed");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Item Image (optional)</Label>
        <ImageUploader value={image} onChange={setImage} label="Upload Image" aspect="square" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mi-name">Name</Label>
        <Input id="mi-name" name="name" placeholder="Butter Chicken" defaultValue={item?.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mi-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea id="mi-desc" name="description" placeholder="Describe the dish…" defaultValue={item?.description} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mi-price">Price (₹)</Label>
          <Input id="mi-price" name="price" type="number" min={0} step={0.5} defaultValue={item?.price} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mi-cat">Category</Label>
          <Input
            id="mi-cat"
            name="category"
            placeholder="Starters, Main…"
            defaultValue={item?.category}
            list="mi-cat-list"
            autoComplete="off"
            required
          />
          {existingCategories.length > 0 && (
            <datalist id="mi-cat-list">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {item ? "Update Item" : "Add Item"}
      </Button>
    </form>
  );
}

export function MenuManager({ items: initial, restaurantId }: MenuManagerProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<IMenuItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Derive unique sorted list of existing categories for the datalist
  const existingCategories = Array.from(
    new Set(initial.map((i) => i.category).filter(Boolean))
  ).sort();

  async function handleDelete(id: string) {
    setDeleting(id);
    const result = await deleteMenuItem(id, restaurantId);
    if (result.success) {
      toast.success("Item deleted");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed");
    }
    setDeleting(null);
  }

  const byCategory = initial.reduce<Record<string, IMenuItem[]>>((acc, i) => {
    const cat = i.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Menu ({initial.length} items)</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
            <MenuItemForm restaurantId={restaurantId} existingCategories={existingCategories} onSuccess={() => { setAddOpen(false); router.refresh(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">No menu items yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, catItems]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat}</h3>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-3 rounded-xl border bg-white p-3">
                    {item.image ? (
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    </div>
                    <div className="font-semibold text-primary text-sm shrink-0">{formatPrice(item.price)}</div>
                    <div className="flex gap-1 shrink-0">
                      <Dialog open={editItem?._id === item._id} onOpenChange={(o) => !o && setEditItem(null)}>
                        <DialogTrigger asChild>
                          <button onClick={() => setEditItem(item)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
                          <MenuItemForm
                            restaurantId={restaurantId}
                            item={item}
                            existingCategories={existingCategories}
                            onSuccess={() => { setEditItem(null); router.refresh(); }}
                          />
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleting === item._id}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                      >
                        {deleting === item._id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          : <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
