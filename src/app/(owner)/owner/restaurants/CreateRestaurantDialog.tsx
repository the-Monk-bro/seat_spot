"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/ImageUploader";
import { createRestaurant } from "@/actions/restaurant.actions";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  cuisine: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  phone: z.string().min(7),
});
type FormData = z.infer<typeof schema>;

export function CreateRestaurantDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState("");
  const [cover, setCover] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    if (logo) formData.append("logo", logo);
    if (cover) formData.append("coverImage", cover);

    const result = await createRestaurant(formData);
    if (result.success) {
      toast.success("Restaurant created! Pending admin approval.");
      setOpen(false);
      reset();
      setLogo("");
      setCover("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to create restaurant");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Restaurant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Restaurant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Cover Image</Label>
              <ImageUploader value={cover} onChange={setCover} label="Upload Cover" />
            </div>
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <ImageUploader value={logo} onChange={setLogo} label="Upload Logo" aspect="square" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-name">Restaurant Name</Label>
            <Input id="r-name" placeholder="e.g. The Golden Spoon" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-desc">Description</Label>
            <Textarea id="r-desc" placeholder="Describe your restaurant…" {...register("description")} rows={3} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-cuisine">Cuisine</Label>
              <Input id="r-cuisine" placeholder="e.g. Indian, Italian" {...register("cuisine")} />
              {errors.cuisine && <p className="text-xs text-destructive">{errors.cuisine.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">Phone</Label>
              <Input id="r-phone" placeholder="+91 98765 43210" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-address">Address</Label>
            <Input id="r-address" placeholder="Street address" {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-city">City</Label>
            <Input id="r-city" placeholder="Mumbai" {...register("city")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? "Creating…" : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
