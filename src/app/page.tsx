import Link from "next/link";
import { Utensils, Clock, ShoppingBag, CheckCircle, Star, Zap, Shield, Smartphone, ArrowRight, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

// Static cafeteria data for hero stats (in production, fetch from DB)
const LIVE_STATS = {
  status: "OPEN",
  avgPrep: 12,
  activeOrders: 18,
  nextSlot: "1:20 PM",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse",
    desc: "Explore today's cafeteria menu from your phone — anywhere on campus.",
    icon: "🍽️",
  },
  {
    step: "02",
    title: "Order",
    desc: "Add your meal, choose a pickup time slot, and pay with cash or wallet.",
    icon: "📱",
  },
  {
    step: "03",
    title: "Pick Up",
    desc: "Get notified when ready. Walk up, show your code, and grab your food.",
    icon: "🎉",
  },
];

const POPULAR_ITEMS = [
  { name: "Chicken Biryani", price: "Rs. 250", emoji: "🍛", badge: "Most Ordered" },
  { name: "Zinger Burger", price: "Rs. 380", emoji: "🍔", badge: "Student Fav" },
  { name: "Club Sandwich", price: "Rs. 320", emoji: "🥪", badge: null },
  { name: "Chicken Roll", price: "Rs. 180", emoji: "🌯", badge: "Quick Pick" },
  { name: "French Fries", price: "Rs. 180", emoji: "🍟", badge: null },
  { name: "Chai", price: "Rs. 80", emoji: "☕", badge: "Classic" },
];

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: "Live Availability",
    desc: "See what's available right now. No surprises at the counter.",
  },
  {
    icon: <Clock size={20} />,
    title: "Pickup Scheduling",
    desc: "Choose a 10-minute window that fits between your classes.",
  },
  {
    icon: <ShoppingBag size={20} />,
    title: "Order Tracking",
    desc: "Watch your order go from confirmed → preparing → ready.",
  },
  {
    icon: <Shield size={20} />,
    title: "Secure Wallet",
    desc: "Top up your campus wallet and pay instantly without cash.",
  },
  {
    icon: <Star size={20} />,
    title: "Rush-Hour Control",
    desc: "Capped pickup slots prevent overcrowding during lunch rush.",
  },
  {
    icon: <Smartphone size={20} />,
    title: "Mobile First",
    desc: "Designed for your phone. Order on the way to your next lecture.",
  },
];

const FAQ = [
  {
    q: "When can I pick up my order?",
    a: "You choose a 10-minute pickup window when placing your order. Slots are capped to avoid congestion. Once your food is ready, you'll get a notification.",
  },
  {
    q: "What if I need to cancel?",
    a: "You can cancel your order before the kitchen starts preparing it. Wallet payments are refunded instantly.",
  },
  {
    q: "Do I need to pay upfront?",
    a: "You can pay with Cash at Pickup (hand the money to the cashier) or your Campus Wallet (deducted when you place the order).",
  },
  {
    q: "What if an item runs out?",
    a: "Items are marked unavailable in real time. You won't be able to add out-of-stock items to your order.",
  },
  {
    q: "Can I reorder a previous meal?",
    a: "Yes! Your order history has a one-click Reorder button for past meals.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 md:py-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Cafeteria is Open — Live orders running
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 text-balance">
              Skip the Queue.{" "}
              <span className="text-orange-500">Grab Your Food.</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Pre-order your cafeteria meal from your phone. Choose a pickup
              slot, pay your way, and collect your food without waiting in line.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg">
                  Order Now
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/menu">
                <Button variant="outline" size="lg">
                  Explore Menu
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Stats Card */}
          <div className="flex justify-center md:justify-end">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Utensils size={18} className="text-orange-500" />
                  <span className="font-semibold text-gray-800">
                    Today&apos;s Cafeteria
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {LIVE_STATS.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-orange-600">
                    {LIVE_STATS.avgPrep}m
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Avg. Prep Time
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {LIVE_STATS.activeOrders}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Orders Active
                  </div>
                </div>
                <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                  <div className="text-sm font-semibold text-gray-700">
                    Next available pickup
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-0.5">
                    {LIVE_STATS.nextSlot}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/register">
                  <Button fullWidth size="sm">
                    Start Your Order
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How CampusBite Works
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Order in 3 simple steps. No waiting, no stress.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-orange-200" />
                )}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-50 rounded-2xl text-3xl mb-4 relative z-10">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR TODAY ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                Popular Today
              </h2>
              <p className="text-gray-500">
                What students are ordering right now
              </p>
            </div>
            <Link
              href="/menu"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View full menu <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_ITEMS.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-3">{item.emoji}</div>
                {item.badge && (
                  <span className="inline-block text-[10px] font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mb-2">
                    {item.badge}
                  </span>
                )}
                <div className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                  {item.name}
                </div>
                <div className="text-sm font-bold text-orange-600">
                  {item.price}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link href="/menu">
              <Button variant="outline">View Full Menu</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything You Need
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Built for busy university students with a full-featured cafeteria
              ordering experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CAMPUSBITE ───────────────────────────────────────────────── */}
      <section className="py-20 bg-orange-500">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Why CampusBite?
            </h2>
            <p className="text-orange-100 max-w-md mx-auto">
              Real benefits for students and cafeteria staff.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stat: "~15 min", label: "Saved per visit", icon: "⏱️" },
              { stat: "0", label: "Surprise wait times", icon: "✅" },
              { stat: "Real-time", label: "Order tracking", icon: "📡" },
              { stat: "Any time", label: "Order from campus", icon: "🎓" },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {item.stat}
                </div>
                <div className="text-sm text-orange-100">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group border border-gray-200 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 list-none">
                  {item.q}
                  <ChevronDown
                    size={18}
                    className="text-gray-400 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform"
                  />
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to skip the queue?
          </h2>
          <p className="text-gray-400 mb-6">
            Join thousands of Karachi University students ordering smarter.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Create Account
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 border-t border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-lg text-white">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-500 rounded-lg text-white">
                <Utensils size={14} />
              </span>
              Campus<span className="text-orange-400">Bite</span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
              <Link href="/#how-it-works" className="hover:text-white">
                How It Works
              </Link>
              <Link href="/menu" className="hover:text-white">
                Menu
              </Link>
              <Link href="/login" className="hover:text-white">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-white">
                Register
              </Link>
            </div>

            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} CampusBite. Karachi University.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
