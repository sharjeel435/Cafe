import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Utensils,
  Wallet,
  Check,
  Leaf,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
const steps = [
  {
    number: "01",
    title: "Find your favorite",
    text: "From a comforting plate of biryani to your between-class chai. Browse what’s available.",
    icon: Utensils,
  },
  {
    number: "02",
    title: "Make it your own",
    text: "Pick your extras, choose a collection time, and pay with your wallet or cash at pickup.",
    icon: ShoppingBag,
  },
  {
    number: "03",
    title: "Pick up & get going",
    text: "Follow your order, show your pickup code when it’s ready, and enjoy your break.",
    icon: Check,
  },
];
const questions = [
  [
    "How do pickup times work?",
    "Choose an available pickup window at checkout. We leave enough time to prepare your meal, and limit orders per slot to keep collection manageable.",
  ],
  [
    "How can I pay?",
    "Use your campus wallet or select cash at pickup, depending on the methods enabled by the cafeteria. Your total, including any extras and service fee, is shown before you order.",
  ],
  [
    "Can I cancel an order?",
    "You can usually cancel before the kitchen starts preparing your meal. The cafeteria’s cancellation policy applies, and eligible wallet payments are refunded automatically.",
  ],
  [
    "How do I try the demo?",
    "Open Sign In and choose a seeded demo account. There are student, staff, and admin accounts, so you can explore both ordering and kitchen management.",
  ],
];
export default function LandingPage() {
  return (
    <div className="bg-[#fbfaf6]">
      <Navbar />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:gap-16 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              BUKC · A better break starts here
            </span>
            <h1 className="mt-7 text-5xl font-bold leading-[1.08] tracking-[-0.045em] text-[#20392e] sm:text-6xl lg:text-7xl">
              Good food.
              <br />
              Less waiting.
              <br />
              <span className="text-orange-600">More campus life.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-gray-600">
              Your favorite BUKC campus meals, ready around your schedule. Order
              ahead, skip the queue, and make the most of your break.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="inline-flex items-center gap-3 rounded-xl bg-orange-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                Explore the menu <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-700 transition hover:border-orange-400"
              >
                Sign in to order
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-5 text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-green-700" />
                Made fresh on campus
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-green-700" />
                Pickup on your time
              </span>
            </div>
          </div>
          <div className="relative pb-6 pl-3 md:pl-0">
            <div className="relative aspect-[4/4.3] overflow-hidden rounded-[2rem] bg-orange-100">
              <Image
                src="/food/biryani.jpg"
                alt="A freshly prepared plate of chicken biryani"
                fill
                loading="eager"
                sizes="(max-width: 768px) 95vw, 550px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-20 left-7 text-white">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-orange-100">
                  A campus kind of comfort
                </p>
                <h2 className="text-3xl font-semibold">
                  Fresh. Flavorful. Familiar.
                </h2>
              </div>
            </div>
            <div className="absolute -left-2 bottom-0 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
              <span className="rounded-xl bg-green-100 p-3 text-green-800">
                <Clock size={22} />
              </span>
              <div>
                <p className="font-semibold text-gray-900">
                  Lunch that fits your timetable
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Order ahead. Pick up between classes.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="border-y border-[#e7e6df] bg-white py-14"
        >
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                  Less hassle, more flavor
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#20392e]">
                  Your next meal, in three steps.
                </h2>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700"
              >
                Let’s get you started <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map(({ number, title, text, icon: Icon }) => (
                <div
                  key={number}
                  className="rounded-2xl border border-gray-100 bg-[#fbfaf6] p-6"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="text-orange-600" size={25} />
                    <span className="text-3xl font-bold text-[#d9ddd6]">
                      {number}
                    </span>
                  </div>
                  <h3 className="mb-2 mt-5 text-lg font-bold text-[#20392e]">
                    {title}
                  </h3>
                  <p className="text-sm leading-6 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                Something for every craving
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#20392e]">
                Familiar favorites. Freshly made.
              </h2>
            </div>
            <Link
              href="/menu"
              className="hidden items-center gap-2 whitespace-nowrap text-sm font-semibold text-orange-700 sm:flex"
            >
              See the menu <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                image: "biryani",
                name: "A little taste of home",
                category: "Desi favorites",
                slug: "desi",
              },
              {
                image: "burger",
                name: "Big break energy",
                category: "Burgers & more",
                slug: "burgers",
              },
              {
                image: "chai",
                name: "Your daily chai ritual",
                category: "Tea & coffee",
                slug: "tea-coffee",
              },
            ].map((item) => (
              <Link
                key={item.image}
                href={`/menu?category=${item.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={`/food/${item.image}.jpg`}
                    alt={item.category}
                    fill
                    sizes="(max-width: 640px) 90vw, 360px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-orange-700">
                    {item.category}
                  </p>
                  <h3 className="mt-2 flex items-center justify-between text-lg font-bold text-[#20392e]">
                    {item.name}
                    <ArrowRight size={18} />
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section id="features" className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-8 rounded-3xl bg-[#20392e] p-8 text-white md:grid-cols-2 md:p-12">
            <div>
              <Leaf size={28} className="mb-5 text-orange-300" />
              <h2 className="text-3xl font-bold leading-tight">
                Built for busy days.
                <br />
                And well-earned breaks.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-green-100/80">
                From your first lecture to your last study session, a good meal
                should be the easy part.
              </p>
            </div>
            <div className="space-y-6">
              {[
                {
                  icon: Clock,
                  title: "A pickup time that works for you",
                  text: "Available slots and preparation times help you plan ahead.",
                },
                {
                  icon: Wallet,
                  title: "Your wallet. Your way.",
                  text: "Keep track of your balance, payments, and refunds in one place.",
                },
                {
                  icon: ShoppingBag,
                  title: "Follow every step",
                  text: "See when your order is accepted, cooking, and ready to collect.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <Icon size={22} className="mt-1 shrink-0 text-orange-300" />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-green-100/75">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="mb-8 text-center text-3xl font-bold text-[#20392e]">
            A few things you might be wondering.
          </h2>
          <div className="space-y-3">
            {questions.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-xl border border-gray-200 bg-white p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {question}
                  <ChevronDown
                    size={17}
                    className="shrink-0 transition group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-600">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-7">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-[#20392e]"
          >
            <Utensils size={18} className="text-orange-600" />
            CampusBite
          </Link>
          <p className="text-xs text-gray-500">
            Made for good food and better campus days.
          </p>
          <Link href="/login" className="text-xs font-medium text-gray-600">
            Student & staff sign in →
          </Link>
        </div>
      </footer>
    </div>
  );
}
