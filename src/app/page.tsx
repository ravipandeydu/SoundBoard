import Link from "next/link";
import {
  Layers,
  Mic,
  Music,
  Users,
  Download,
  BarChart,
  Waves,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { AnimatedBackground } from "@/components/AnimatedBackground";

// Warm up function to be called during page load
async function warmupDatabase() {
  try {
    const response = await fetch("/api/warmup");
    if (!response.ok) {
      console.error("Database warmup failed:", await response.text());
    }
  } catch (error) {
    console.error("Database warmup error:", error);
  }
}

export default async function LandingPage() {
  // Call warmup during page load
  await warmupDatabase();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Hero Section with Animated Waveform Background */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-black"></div>
        <AnimatedBackground />
        <div className="container relative mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                <Waves className="w-5 h-5 text-violet-400 animate-pulse" />
                <span className="text-sm font-medium">SoundBoard Studio</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                Where
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-500 to-pink-500">
                  Music Connects
                </span>
                Everyone
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed">
                Transform your ideas into masterpieces. Collaborate with
                musicians worldwide in real-time, create loops, and produce
                professional tracks together.
              </p>

              <div className="flex items-center gap-6">
                <Link href="/rooms">
                  <Button className="group relative overflow-hidden bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-lg rounded-full transition-all duration-300">
                    <span className="relative z-10 flex items-center gap-2">
                      Start Creating <Play className="w-5 h-5" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-pink-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </Button>
                </Link>
                <Link
                  href="/demo"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Watch Demo →
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-400">10k+</div>
                  <div className="text-sm text-gray-400">Active Musicians</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-400">50k+</div>
                  <div className="text-sm text-gray-400">Tracks Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-400">120+</div>
                  <div className="text-sm text-gray-400">Countries</div>
                </div>
              </div>
            </div>

            {/* Right Content - 3D Interface Mockup */}
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-black rounded-xl p-1">
                  <Image
                    src="/loop-mockup.png"
                    alt="SoundBoard Interface"
                    width={800}
                    height={600}
                    className="rounded-lg shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Glassmorphism Cards */}
      <section className="py-24 bg-gradient-to-b from-black to-violet-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
                Studio-Grade Features
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              Professional tools for your creative journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="group bg-white/5 backdrop-blur-xl border-0 hover:bg-white/10 transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors duration-300">
                    <Icon className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-violet-400 transition-colors">
                    {title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Timeline Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent"></div>
        <div className="container mx-auto px-6 relative">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
              Your Creative Journey
            </span>
          </h2>

          <div className="max-w-4xl mx-auto space-y-12">
            {steps.map(({ title, desc }, idx) => (
              <div key={idx} className="flex items-start gap-8 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                  {idx + 1}
                </div>
                <div className="flex-1 bg-white/5 backdrop-blur-xl p-6 rounded-xl group-hover:bg-white/10 transition-all duration-300">
                  <h4 className="text-xl font-semibold mb-2 text-white">
                    {title}
                  </h4>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-black to-violet-950 relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Make
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
              Something Amazing?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of musicians creating, collaborating, and sharing
            their music with the world.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-12 py-6 rounded-full text-lg shadow-xl hover:shadow-violet-500/25 transition-all duration-300"
          >
            <Link href="/signup">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-xl py-8 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} SoundBoard Studio. Powered by{" "}
            <Link
              href="https://nextjs.org"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Next.js
            </Link>{" "}
            &{" "}
            <Link
              href="https://tailwindcss.com"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Tailwind CSS
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Layers,
    title: "Virtual Studio Rooms",
    desc: "Create your perfect recording environment with customizable room settings and professional tools.",
  },
  {
    icon: Mic,
    title: "Pro Audio Recording",
    desc: "Studio-quality recording with advanced audio processing and real-time monitoring.",
  },
  {
    icon: Music,
    title: "Advanced Mix Console",
    desc: "Professional mixing tools with EQ, effects, and precise control over every track.",
  },
  {
    icon: Users,
    title: "Live Collaboration",
    desc: "Connect with musicians globally with ultra-low latency real-time collaboration.",
  },
  {
    icon: Download,
    title: "Pro Export Options",
    desc: "Export in multiple formats with adjustable quality settings and stem separation.",
  },
  {
    icon: BarChart,
    title: "Creative Insights",
    desc: "Deep analytics and progress tracking to help you grow as an artist.",
  },
] as const;

const steps = [
  {
    title: "Set Up Your Studio",
    desc: "Create your virtual recording space with professional-grade tools and customizable settings.",
  },
  {
    title: "Collaborate & Create",
    desc: "Connect with musicians worldwide and record your parts with pristine audio quality.",
  },
  {
    title: "Mix & Master",
    desc: "Polish your tracks with professional mixing tools and export studio-quality productions.",
  },
] as const;
