import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Trophy, Gift, CheckCircle, Clock, XCircle, AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  useGetMyWinnings, useGetPrizePool, useSubmitWinnerProof,
  getGetMyWinningsQueryKey, getGetPrizePoolQueryKey
} from "@workspace/api-client-react";

export default function Prizes() {
  const { data: prizePool, isLoading: isPoolLoading } = useGetPrizePool({ query: { queryKey: getGetPrizePoolQueryKey() } });
  const { data: winnings, isLoading: isWinningsLoading } = useGetMyWinnings({ query: { queryKey: getGetMyWinningsQueryKey() } });
  
  const submitProof = useSubmitWinnerProof();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [proofUrl, setProofUrl] = useState("");
  const [activeWinningId, setActiveWinningId] = useState<number | null>(null);

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWinningId || !proofUrl) return;

    submitProof.mutate({ data: { winnerId: activeWinningId, proofUrl } }, {
      onSuccess: () => {
        toast({ title: "Proof Submitted", description: "Your verification proof has been submitted for review." });
        queryClient.invalidateQueries({ queryKey: getGetMyWinningsQueryKey() });
        setActiveWinningId(null);
        setProofUrl("");
      },
      onError: (err) => {
        toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="bg-card border-b border-border/50 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Gift className="w-12 h-12 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Prize Pool & Winnings</h1>
          <p className="text-lg text-muted-foreground">
            Track the current collective prize pool and manage your personal winnings from monthly draws.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl space-y-12">
        {/* Current Pool Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="text-primary" /> Current Pool Breakdown
          </h2>
          
          {isPoolLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : prizePool ? (
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/20 md:col-span-2">
                <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full">
                  <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider mb-2">Grand Jackpot (Match 5)</p>
                  <div className="text-5xl font-bold text-primary">${prizePool.jackpotPool.toLocaleString()}</div>
                  {prizePool.jackpotRolledOver && (
                    <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 w-fit mt-4">
                      Includes Rollover
                    </Badge>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-rows-2 gap-4 md:col-span-2">
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase font-semibold">Match 4 Pool</p>
                      <div className="text-2xl font-bold">${prizePool.pool4Match.toLocaleString()}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-500 font-bold">4</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-border/50">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase font-semibold">Match 3 Pool</p>
                      <div className="text-2xl font-bold">${prizePool.pool3Match.toLocaleString()}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <span className="text-purple-500 font-bold">3</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </section>

        {/* My Winnings Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="text-primary" /> My Winnings
          </h2>
          
          {isWinningsLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : winnings && winnings.length > 0 ? (
            <div className="space-y-4">
              {winnings.map((win) => (
                <Card key={win.id} className="bg-card border-border/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-primary/10 p-6 flex flex-col justify-center items-center md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-border/50">
                      <Trophy className="w-8 h-8 text-primary mb-2" />
                      <div className="text-xl font-bold text-primary">${win.prizeAmount.toLocaleString()}</div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{win.drawMonth} {win.drawYear} Draw</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="capitalize">{win.matchType.replace('match', 'Match ')}</Badge>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(win.paymentStatus)}
                            <span className="capitalize">{win.paymentStatus}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        {win.paymentStatus === 'pending' && (
                          <Dialog open={activeWinningId === win.id} onOpenChange={(open) => {
                            if (!open) {
                              setActiveWinningId(null);
                              setProofUrl("");
                            } else {
                              setActiveWinningId(win.id);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                                Verify & Claim
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Claim Your Prize</DialogTitle>
                                <DialogDescription>
                                  Please provide a link to proof of your registered handicap or scores to verify this winning.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitProof} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="proofUrl">Link to Proof (Screenshot/Profile)</Label>
                                  <Input 
                                    id="proofUrl" 
                                    placeholder="https://..." 
                                    value={proofUrl}
                                    onChange={(e) => setProofUrl(e.target.value)}
                                    required
                                  />
                                </div>
                                <Button type="submit" className="w-full" disabled={submitProof.isPending}>
                                  {submitProof.isPending ? "Submitting..." : "Submit Proof"}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                        {win.paymentStatus === 'paid' && (
                          <Button variant="ghost" disabled className="opacity-50">
                            Claimed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <Gift className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Winnings Yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Keep logging those scores! The more you play, the better your chances in the monthly draw.
                </p>
                <Link href="/scores">
                  <Button>Log a Score</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
