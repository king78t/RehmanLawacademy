import {
  Building2,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Save,
  Scale,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  loadPaymentSettings,
  logDatabaseFetchFailure,
  updatePaymentSettings,
} from "@/lib/paid-course-data";
import type { PaymentSettings } from "@/lib/paid-course-types";
import { getBrandConfig, saveBrandConfig } from "@/lib/brand-config";

export function AdminPaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [brand, setBrand] = useState(getBrandConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentSettings()
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        logDatabaseFetchFailure("AdminPaymentSettings loadPaymentSettings", err);
        setError("Failed to load payment settings.");
        setLoading(false);
      });
  }, []);

  const handleChange = (key: keyof PaymentSettings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const updated = await updatePaymentSettings(settings);
      setSettings(updated);
      saveBrandConfig(brand);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      logDatabaseFetchFailure("AdminPaymentSettings handleSave updatePaymentSettings", err, { settingsId: settings.id });
      setError(err?.message || "Failed to update payment settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="surface p-6">
        <div className="loader-line w-1/3" />
        <div className="loader-line mt-4 h-32 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        Could not load payment settings.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Payment Configuration</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#14294d]">
            Official Pakistan Payment Accounts
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Configure the bank details and mobile wallet numbers shown to students on the purchase page.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Payment accounts successfully updated and active for all students!
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* BANK ACCOUNT CARD */}
        <div className="surface border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#1766a9]">
            <Building2 size={20} />
            <h3 className="font-display text-lg font-bold text-[#14294d]">
              Bank Transfer Details (1Link / Raast)
            </h3>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-bank-name">
                Bank Name
              </label>
              <input
                id="ps-bank-name"
                type="text"
                value={settings.bank_name}
                onChange={(e) => handleChange("bank_name", e.target.value)}
                placeholder="e.g. Meezan Bank / Bank of Punjab"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-bank-title">
                Account Title
              </label>
              <input
                id="ps-bank-title"
                type="text"
                value={settings.bank_account_title}
                onChange={(e) => handleChange("bank_account_title", e.target.value)}
                placeholder="e.g. Rehman Law Academy"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-bank-num">
                Account Number
              </label>
              <input
                id="ps-bank-num"
                type="text"
                value={settings.bank_account_number}
                onChange={(e) => handleChange("bank_account_number", e.target.value)}
                placeholder="02100100123456"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 font-mono px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-bank-iban">
                IBAN (International Bank Account Number)
              </label>
              <input
                id="ps-bank-iban"
                type="text"
                value={settings.bank_iban}
                onChange={(e) => handleChange("bank_iban", e.target.value)}
                placeholder="PK45MEZN0002100100123456"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 font-mono px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-bank-inst">
                Bank Instructions
              </label>
              <textarea
                id="ps-bank-inst"
                rows={2}
                value={settings.bank_instructions || ""}
                onChange={(e) => handleChange("bank_instructions", e.target.value)}
                placeholder="Transfer via mobile banking app (1Link / Raast) or visit any branch."
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>
          </div>
        </div>

        {/* EASYPAISA & JAZZCASH */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* EASYPAISA */}
          <div className="surface border border-emerald-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <Smartphone size={20} />
              <h3 className="font-display text-lg font-bold text-[#14294d]">
                Easypaisa Account
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600" htmlFor="ps-ep-title">
                  Account Title
                </label>
                <input
                  id="ps-ep-title"
                  type="text"
                  value={settings.easypaisa_account_title}
                  onChange={(e) => handleChange("easypaisa_account_title", e.target.value)}
                  placeholder="Rehman Law Academy"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600" htmlFor="ps-ep-num">
                  Easypaisa Mobile #
                </label>
                <input
                  id="ps-ep-num"
                  type="text"
                  value={settings.easypaisa_account_number}
                  onChange={(e) => handleChange("easypaisa_account_number", e.target.value)}
                  placeholder="0312-8891288"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 font-mono px-3 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600" htmlFor="ps-ep-inst">
                  Easypaisa Instructions
                </label>
                <textarea
                  id="ps-ep-inst"
                  rows={2}
                  value={settings.easypaisa_instructions || ""}
                  onChange={(e) => handleChange("easypaisa_instructions", e.target.value)}
                  placeholder="Send Money -> Mobile Account -> Enter number."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* JAZZCASH */}
          <div className="surface border border-amber-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <Smartphone size={20} />
              <h3 className="font-display text-lg font-bold text-[#14294d]">
                JazzCash Account
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600" htmlFor="ps-jc-title">
                  Account Title
                </label>
                <input
                  id="ps-jc-title"
                  type="text"
                  value={settings.jazzcash_account_title}
                  onChange={(e) => handleChange("jazzcash_account_title", e.target.value)}
                  placeholder="Rehman Law Academy"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600" htmlFor="ps-jc-num">
                  JazzCash Mobile #
                </label>
                <input
                  id="ps-jc-num"
                  type="text"
                  value={settings.jazzcash_account_number}
                  onChange={(e) => handleChange("jazzcash_account_number", e.target.value)}
                  placeholder="0300-1234567"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 font-mono px-3 text-xs outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600" htmlFor="ps-jc-inst">
                  JazzCash Instructions
                </label>
                <textarea
                  id="ps-jc-inst"
                  rows={2}
                  value={settings.jazzcash_instructions || ""}
                  onChange={(e) => handleChange("jazzcash_instructions", e.target.value)}
                  placeholder="Dial *786# or use JazzCash app -> Send Money."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-amber-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WHATSAPP HELPLINE */}
        <div className="surface border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#25D366]">
            <MessageCircle size={20} />
            <h3 className="font-display text-lg font-bold text-[#14294d]">
              Academy WhatsApp Helpline & Direct Support
            </h3>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-wa-num">
                WhatsApp Coordinator Phone Number
              </label>
              <input
                id="ps-wa-num"
                type="text"
                value={settings.whatsapp_support_number}
                onChange={(e) => handleChange("whatsapp_support_number", e.target.value)}
                placeholder="0312-8891288"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 font-mono px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-wa-msg">
                Default Inquiry Text Template
              </label>
              <input
                id="ps-wa-msg"
                type="text"
                value={settings.whatsapp_default_message || ""}
                onChange={(e) => handleChange("whatsapp_default_message", e.target.value)}
                placeholder="Assalam-o-Alaikum Rehman Law Academy, I need assistance."
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>
          </div>
        </div>

        {/* BRAND & FOUNDER PROFILE CONFIGURATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#1766a9]">
            <Scale size={20} />
            <h3 className="font-display text-lg font-bold text-[#14294d]">
              Academy Founder &amp; Brand Profile Settings
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Central identity details used across the homepage, about page, contact page, and course cards.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-founder-name">
                Founder Name
              </label>
              <input
                id="ps-founder-name"
                type="text"
                value={brand.founder.name}
                onChange={(e) => setBrand({ ...brand, founder: { ...brand.founder, name: e.target.value } })}
                placeholder="Adv. AbdulRehman Yaseen"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-founder-desig">
                Designation &amp; Bar Title
              </label>
              <input
                id="ps-founder-desig"
                type="text"
                value={brand.founder.designation}
                onChange={(e) => setBrand({ ...brand, founder: { ...brand.founder, designation: e.target.value } })}
                placeholder="High Court Advocate"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-founder-img">
                Founder Photograph Image URL (Leave blank to use default avatar)
              </label>
              <input
                id="ps-founder-img"
                type="text"
                value={brand.founder.imageUrl || ""}
                onChange={(e) => setBrand({ ...brand, founder: { ...brand.founder, imageUrl: e.target.value } })}
                placeholder="https://example.com/founder.jpg"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-brand-fb">
                Facebook Page URL
              </label>
              <input
                id="ps-brand-fb"
                type="text"
                value={brand.socials.facebook.url}
                onChange={(e) =>
                  setBrand({
                    ...brand,
                    socials: {
                      ...brand.socials,
                      facebook: { ...brand.socials.facebook, url: e.target.value },
                    },
                  })
                }
                placeholder="https://www.facebook.com/share/..."
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600" htmlFor="ps-brand-ig">
                Instagram Profile URL
              </label>
              <input
                id="ps-brand-ig"
                type="text"
                value={brand.socials.instagram.url}
                onChange={(e) =>
                  setBrand({
                    ...brand,
                    socials: {
                      ...brand.socials,
                      instagram: { ...brand.socials.instagram, url: e.target.value },
                    },
                  })
                }
                placeholder="https://www.instagram.com/abdulrehmanyaseenadv"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="button-primary flex items-center gap-2 !px-6 !py-3 text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving Settings..." : "Save Payment Account Settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
