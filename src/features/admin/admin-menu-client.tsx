"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ToggleLeft, ToggleRight, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toggleItemAvailability, upsertMenuItem } from "@/server/actions/menu";
import { toast } from "@/components/ui/toast";
import type { MenuItem, MenuCategory } from "@/types/models";

type MenuItemWithCat = MenuItem & { category: MenuCategory };

export function AdminMenuClient({
  items,
  categories,
}: {
  items: MenuItemWithCat[];
  categories: MenuCategory[];
}) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItemWithCat | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", preparationTime: "10",
    categoryId: categories[0]?.id ?? "", imageUrl: "", isAvailable: true,
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", description: "", price: "", preparationTime: "10", categoryId: categories[0]?.id ?? "", imageUrl: "", isAvailable: true });
    setShowForm(true);
  };
  const openEdit = (item: MenuItemWithCat) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description ?? "",
      price: item.price.toString(), preparationTime: item.preparationTime.toString(),
      categoryId: item.categoryId, imageUrl: item.imageUrl ?? "", isAvailable: item.isAvailable,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Name, price, and category are required");
      return;
    }
    setSaving(true);
    const result = await upsertMenuItem({
      id: editItem?.id,
      ...form,
      price: form.price,
      preparationTime: parseInt(form.preparationTime),
    });
    setSaving(false);
    if (result.success) {
      toast.success(editItem ? "Item updated" : "Item added");
      setShowForm(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleToggle = async (itemId: string, current: boolean) => {
    setTogglingId(itemId);
    await toggleItemAvailability(itemId, !current);
    router.refresh();
    setTogglingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Menu ({items.length} items)</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> Add Item
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h2 className="font-bold text-gray-900 mb-4">{editItem ? "Edit Item" : "Add New Item"}</h2>
            <div className="space-y-3">
              <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Price (PKR)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                <Input label="Prep Time (min)" type="number" value={form.preparationTime} onChange={(e) => setForm((f) => ({ ...f, preparationTime: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <Input label="Image URL" type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} hint="Optional: Unsplash or any direct image URL" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
                <span className="text-sm font-medium text-gray-700">Available now</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="ghost" fullWidth onClick={() => setShowForm(false)}>Cancel</Button>
              <Button fullWidth loading={saving} onClick={handleSave}>{editItem ? "Update" : "Add Item"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Item</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Orders</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.description && <div className="text-xs text-gray-400 truncate max-w-[180px]">{item.description}</div>}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {item.category.emoji} {item.category.name}
                </td>
                <td className="px-4 py-3 font-semibold text-orange-600">{formatPrice(item.price.toString())}</td>
                <td className="px-4 py-3 text-gray-500">{item.totalOrdered}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(item.id, item.isAvailable)} disabled={togglingId === item.id} className="flex items-center gap-1.5 disabled:opacity-50">
                    {item.isAvailable
                      ? <><ToggleRight size={22} className="text-green-500" /><span className="text-xs text-green-600">On</span></>
                      : <><ToggleLeft size={22} className="text-gray-400" /><span className="text-xs text-gray-500">Off</span></>}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
