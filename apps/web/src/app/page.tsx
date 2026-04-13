import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Shield,
  Sparkles,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import AppLogo from "@/components/layout/AppLogo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const features = [
  {
    title: "30 Videos",
    description: "Upload and organize your media library with structured metadata.",
    icon: Upload,
  },
  {
    title: "30 Accounts",
    description: "Connect multiple platforms in one professional dashboard.",
    icon: Users,
  },
  {
    title: "30 Days",
    description: "Schedule and automate a full month of content with one workflow.",
    icon: Calendar,
  },
  {
    title: "AI Captions",
    description: "Generate platform-ready copy faster with AI-assisted writing.",
    icon: Sparkles,
  },
  {
    title: "Anti-Ban Protection",
    description: "Use smarter timing and content planning for safer automation.",
    icon: Shield,
  },
  {
    title: "27,000 Posts",
    description: "Scale your reach with a powerful multi-platform automation engine.",
    icon: Zap,
  },
];

const platforms = ["Instagram", "Twitter/X", "LinkedIn", "Facebook", "YouTube", "Threads"];

export default function HomePage() {
  return (
    <main>
      <header className="topbar-blur">
        <div className="container-app flex h-20 items-center justify-between">
          <AppLogo href="/" />
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container-app py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-[#7d73ff]/20 bg-[#7d73ff]/10 px-4 py-2 text-sm font-medium text-[#9b91ff]">
            Powered by AI
          </div>

          <h1 className="text-balance text-5xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
            30×30×30 <span className="gradient-text">Social Automation</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">
            Upload 30 videos, connect 30 accounts, and automate 30 days of content
            publishing from one premium dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button fullWidth>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" fullWidth>
                View Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Videos", value: "30" },
              { label: "Accounts", value: "30" },
              { label: "Days", value: "30" },
              { label: "Total Posts", value: "27K" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[28px] border border-white/10 bg-[#07122b]/75 p-5 text-center backdrop-blur-xl"
              >
                <div className="text-4xl font-black text-white">{item.value}</div>
                <div className="mt-2 text-sm text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">
            Everything you need to scale your social presence like a real SaaS product.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-[#151f4f] text-[#847cff]">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container-app py-10 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="section-title">All Major Platforms</h2>
          <p className="section-subtitle">
            Connect and manage multiple accounts seamlessly.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {platforms.map((platform) => (
            <div
              key={platform}
              className="rounded-[26px] border border-white/10 bg-[#07122b]/70 px-6 py-8 text-center text-lg font-bold text-white backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#7a74ff]/25"
            >
              {platform}
            </div>
          ))}
        </div>
      </section>

      <section className="container-app py-12 sm:py-20">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(123,102,255,0.18),transparent_35%),rgba(7,18,43,0.86)] px-6 py-12 text-center shadow-2xl sm:px-10 sm:py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#151f4f] text-[#847cff]">
            <Zap className="h-8 w-8" />
          </div>

          <h2 className="mt-6 text-4xl font-black text-white sm:text-5xl">
            Ready to Scale Your Content?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            Start automating your social media presence with a cleaner dashboard,
            smarter scheduling, and AI-assisted content workflows.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button fullWidth>Create Account</Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button variant="secondary" fullWidth>
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}