"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSettings } from "@/server/actions/settings";
import { toast } from "@/components/ui/toast";

export function AdminSettingsClient({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cafeteriaName: settings.cafeteriaName ?? "KU Main Cafeteria",
    openTime: settings.openTime ?? "08:00",
    closeTime: settings.closeTime ?? "17:00",
    serviceFee: settings.serviceFee ?? "0",
    slotDuration: settings.slotDuration ?? "10",
    maxOrdersPerSlot: settings.maxOrdersPerSlot ?? "20",
    cashEnabled: settings.cashEnabled ?? "true",
    walletEnabled: settings.walletEnabled ?? "true",
    avgPrepTime: settings.avgPrepTime ?? "12",
    rushHourStart: settings.rushHourStart ?? "12:00",
    rushHourEnd: settings.rushHourEnd ?? "13:30",
  });

  const handleSave = async () => {
    setLoading(true);
    const result = await updateSettings(form);
    setLoading(false);
    if (result.success) {
      toast.success("Settings saved!");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save settings");
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Cafeteria Settings</h1>

      {/* General */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">General</h2>
        <div className="space-y-4">
          <Input label="Cafeteria Name" value={form.cafeteriaName} onChange={set("cafeteriaName")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Opening Time" type="time" value={form.openTime} onChange={set("openTime")} />
            <Input label="Closing Time" type="time" value={form.closeTime} onChange={set("closeTime")} />
          </div>
        </div>
      </div>

      {/* Ordering */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Ordering</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Slot Duration (min)" type="number" value={form.slotDuration} onChange={set("slotDuration")} />
            <Input label="Max Orders/Slot" type="number" value={form.maxOrdersPerSlot} onChange={set("maxOrdersPerSlot")} />
          </div>
          <Input label="Service Fee (PKR)" type="number" value={form.serviceFee} onChange={set("serviceFee")} hint="Set to 0 for no service fee" />
          <Input label="Avg Prep Time (min)" type="number" value={form.avgPrepTime} onChange={set("avgPrepTime")} />
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Payment Methods</h2>
        <div className="space-y-3">
          {[
            { key: "cashEnabled", label: "Cash at Pickup" },
            { key: "walletEnabled", label: "Campus Wallet" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-800">{label}</span>
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4"
                checked={form[key as keyof typeof form] === "true"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.checked ? "true" : "false" }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Rush hour */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Rush Hour Window</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Rush Hour Start" type="time" value={form.rushHourStart} onChange={set("rushHourStart")} />
          <Input label="Rush Hour End" type="time" value={form.rushHourEnd} onChange={set("rushHourEnd")} />
        </div>
      </div>

      <Button fullWidth size="lg" loading={loading} onClick={handleSave}>
        Save Settings
      </Button>
    </div>
  );
}
