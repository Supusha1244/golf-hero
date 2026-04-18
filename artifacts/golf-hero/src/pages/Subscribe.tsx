import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Check, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  useGetSubscriptionStatus, useSubscribe, 
  getGetSubscriptionStatusQueryKey, getGetDashboardSummaryQueryKey 
} from "@workspace/api-client-react";

export default function Subscribe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: subStatus, isLoading } = useGetSubscriptionStatus({ 
    query: { queryKey: getGetSubscriptionStatusQueryKey() } 
  });
  
  const subscribe = useSubscribe();

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    subscribe.mutate({ data: { plan } }, {
      onSuccess: () => {
        toast({ title: "Subscription Active!", description: `You are now on the ${plan} plan.` });
        queryClient.invalidateQueries({ queryKey: getGetSubscriptionStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({ title: "Subscription failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const isActive = subStatus?.status === 'active';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join the Movement</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose a plan to start logging scores, participating in draws, and supporting causes you care about.
            </p>
          </div>

          {isActive && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-12 text-center max-w-2xl mx-auto">
              <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white mb-1">You have an active subscription</h3>
              <p className="text-muted-foreground text-sm">
                Your {subStatus.plan} plan is active. You're fully eligible for all GolfHero features.
              </p>
              <Link href="/dashboard">
                <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className={`bg-card border-border/50 relative overflow-hidden transition-all hover:border-primary/30 ${isActive && subStatus?.plan === 'monthly' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
              {isActive && subStatus?.plan === 'monthly' && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  CURRENT PLAN
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">Monthly</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  $10
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Full score tracking</li>
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Entry into monthly prize draws</li>
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Support your selected charity</li>
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Cancel anytime</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12 text-lg" 
                  variant={isActive ? "outline" : "default"}
                  disabled={isActive || subscribe.isPending}
                  onClick={() => handleSubscribe('monthly')}
                >
                  {subscribe.isPending ? "Processing..." : isActive ? "Current Plan" : "Subscribe Monthly"}
                </Button>
              </CardFooter>
            </Card>

            {/* Yearly Plan */}
            <Card className={`bg-card border-primary/50 relative overflow-hidden shadow-[0_0_30px_-10px_rgba(255,215,0,0.2)] transition-all hover:shadow-[0_0_40px_-10px_rgba(255,215,0,0.3)] ${isActive && subStatus?.plan === 'yearly' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                {isActive && subStatus?.plan === 'yearly' ? 'CURRENT PLAN' : 'BEST VALUE'}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl flex items-center gap-2">
                  Annual <Badge variant="secondary" className="bg-primary/20 text-primary">Save 16%</Badge>
                </CardTitle>
                <CardDescription>Commit to your game and your cause</CardDescription>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  $100
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/yr</span>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> <strong>Two months free</strong></li>
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Full score tracking</li>
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Entry into all monthly prize draws</li>
                  <li className="flex items-center"><Check className="text-primary w-5 h-5 mr-3 shrink-0" /> Larger continuous impact to charity</li>
                </ul>
              </CardContent>
              <CardFooter className="relative z-10">
                <Button 
                  className={`w-full h-12 text-lg ${isActive && subStatus?.plan === 'yearly' ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  variant={isActive && subStatus?.plan === 'yearly' ? "outline" : "default"}
                  disabled={isActive || subscribe.isPending}
                  onClick={() => handleSubscribe('yearly')}
                >
                  {subscribe.isPending ? "Processing..." : isActive && subStatus?.plan === 'yearly' ? "Current Plan" : "Subscribe Annually"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>A significant portion of all subscriptions goes directly to our charity partners.</p>
            <p>Payments are processed securely. Cancel anytime from your dashboard.</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
