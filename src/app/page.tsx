import Link from "next/link";
import {
  Layers,
  Mic,
  Music,
  Users,
  Download,
  BarChart,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-tr from-indigo-900 to-purple-800 text-white">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="container relative mx-auto px-6 py-24 lg:flex lg:items-center lg:justify-between">
          {/* Left */}
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <Waves className="w-12 h-12 text-indigo-400" />
              <span className="text-2xl font-bold">SoundBoard</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
              Collaborative Jam Session Recorder
            </h1>
            <p className="text-lg mb-8 text-gray-200">
              Create music together, anywhere. Record loops, layer tracks, and
              mix your collaborative jams in real-time with musicians worldwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/rooms">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg">
                  Start Jamming
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  variant="outline"
                  className="border-indigo-400 text-indigo-400 hover:bg-indigo-950 px-8 py-6 text-lg"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
          {/* Right */}
          <div className="mt-10 lg:mt-0 lg:w-1/3">
            <div className="bg-gray-900/80 rounded-2xl shadow-2xl p-6 backdrop-blur border border-gray-800">
              <Image
                src="/loop-mockup.png"
                alt="App mockup"
                width={800}
                height={600}
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto text-center mb-12 px-6">
          <h2 className="text-4xl font-bold mb-4 text-indigo-400">
            Core Features
          </h2>
          <p className="text-gray-400">
            Everything you need for professional remote jam sessions
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              className="bg-gray-800 border-gray-700 transform hover:-translate-y-2 hover:shadow-2xl transition-all hover:shadow-indigo-500/10"
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-950 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-indigo-300">
                  {title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-4xl mx-auto space-y-12 px-6">
          {steps.map(({ title, desc }, idx) => (
            <div
              key={idx}
              className={`flex flex-col md:flex-row items-center ${
                idx % 2 === 1 ? "md:flex-row-reverse" : ""
              } gap-6`}
            >
              <div className="flex-shrink-0 bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                {idx + 1}
              </div>
              <div>
                <h4 className="text-2xl font-semibold mb-2 text-indigo-300">
                  {title}
                </h4>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-indigo-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Jamming?</h2>
          <p className="mb-8 text-indigo-200">
            Join musicians worldwide on SoundBoard and create something amazing
            together.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-indigo-900 px-10 py-4 hover:shadow-xl hover:shadow-indigo-500/20"
          >
            <Link href="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center border-t border-gray-800">
        <p>
          &copy; {new Date().getFullYear()} SoundBoard. Built with{" "}
          <Link
            href="https://nextjs.org"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Next.js
          </Link>{" "}
          &amp;{" "}
          <Link
            href="https://tailwindcss.com"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Tailwind CSS
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Layers,
    title: "Jam Room Management",
    desc: "Create custom rooms with BPM, key signature, and private room codes for your collaborators.",
  },
  {
    icon: Mic,
    title: "Loop Recording",
    desc: "Record high-quality audio loops up to 30 seconds with our Web Audio API integration.",
  },
  {
    icon: Music,
    title: "Track Mixer",
    desc: "Mix your tracks with individual volume controls and enable/disable loops in real-time.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    desc: "Instant sync with auto-updates every 5 seconds as your collaborators add new loops.",
  },
  {
    icon: Download,
    title: "Export Mixdown",
    desc: "Download your finished collaboration as a single audio file with all active loops mixed.",
  },
  {
    icon: BarChart,
    title: "Profile Analytics",
    desc: "Track your musical journey with stats on rooms hosted, loops recorded, and exports created.",
  },
] as const;

const steps = [
  {
    title: "Create Your Jam Room",
    desc: "Set up your virtual studio with custom BPM and key signature, then invite your collaborators.",
  },
  {
    title: "Record & Collaborate",
    desc: "Record your loops and watch as other musicians add their parts in real-time.",
  },
  {
    title: "Mix & Export",
    desc: "Fine-tune your mix with individual track controls and export your finished collaboration.",
  },
] as const;
