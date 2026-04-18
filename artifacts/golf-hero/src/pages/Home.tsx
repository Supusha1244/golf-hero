import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeartHandshake, Trophy, Target } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useGetPrizePool, useListCharities } from "@workspace/api-client-react";

export default function Home() {
  const { data: prizePool } = useGetPrizePool({ query: { queryKey: ["prizePool"] } });
  const { data: charities } = useListCharities({ featured: true }, { query: { queryKey: ["featuredCharities"] } });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden flex items-center justify-center min-h-[80vh]">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" />
          </div>
          
          <div className="container relative z-20 px-4 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Join the movement
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
              Play Golf. <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">Do Good.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Where sport and charity intersect. Every round played puts money toward causes that matter, and gives you a chance to win the monthly jackpot.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_-10px_rgba(255,215,0,0.5)] transition-all hover:scale-105">
                  Become a Member
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50">
                  How it Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/40">
              <div className="px-4">
                <div className="text-3xl font-bold text-primary mb-1">${prizePool?.totalPool?.toLocaleString() || "10,000"}+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Current Prize Pool</div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-bold text-white mb-1">{prizePool?.activeSubscribers?.toLocaleString() || "500"}+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Active Members</div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-bold text-white mb-1">5+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Partner Charities</div>
              </div>
              <div className="px-4">
                <div className="text-3xl font-bold text-primary mb-1">Monthly</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Draws</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">More than just a game</h2>
              <p className="text-muted-foreground text-lg">Your subscription fuels a powerful engine of giving and rewarding.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Track Your Scores</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Log your Stableford scores after each round. We track your rolling 5-score history to determine your draw eligibility.
                </p>
              </div>
              
              <div className="relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Support Causes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A significant portion of your subscription goes directly to the charity of your choice. You choose where your impact lands.
                </p>
              </div>
              
              <div className="relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Win Big</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enter the monthly draw using your performance metrics. Match numbers to win from the collective prize pool.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to make an impact?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join the community of golfers who are turning their passion into purpose.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
