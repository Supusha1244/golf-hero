import { useParams, Link } from "wouter";
import { ArrowLeft, Trophy, DollarSign, Users, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { format } from "date-fns";
import { useGetDraw, getGetDrawQueryKey } from "@workspace/api-client-react";

export default function DrawDetail() {
  const params = useParams();
  const drawId = parseInt(params.id || "0", 10);
  
  const { data: draw, isLoading } = useGetDraw(drawId, {
    query: { enabled: !!drawId, queryKey: getGetDrawQueryKey(drawId) }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-48 w-full rounded-2xl mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Draw Not Found</h2>
            <Link href="/draws" className="text-primary hover:underline">Back to Draws</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/draws" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to draws
        </Link>
        
        <div className="bg-card border border-border/50 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none">
            <Trophy className="w-32 h-32 text-primary/10" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/50 text-sm py-1 px-3">
                {draw.month} {draw.year}
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3 capitalize border-border">
                Status: {draw.status}
              </Badge>
              {draw.jackpotRolledOver && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-sm py-1 px-3">
                  Jackpot Rollover
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Draw Results</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1"><DollarSign className="w-4 h-4" /> Total Pool</div>
                <div className="text-2xl font-bold text-white">${draw.totalPool.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1"><Trophy className="w-4 h-4" /> Jackpot</div>
                <div className="text-2xl font-bold text-primary">${draw.jackpotAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1"><Users className="w-4 h-4" /> Entries</div>
                <div className="text-2xl font-bold text-white">{draw.participantCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1"><Calendar className="w-4 h-4" /> Published</div>
                <div className="text-lg font-bold text-white">
                  {draw.publishedAt ? format(new Date(draw.publishedAt), 'MMM d, yyyy') : 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Winning Numbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {draw.winningNumbers ? (
                <div className="flex flex-wrap gap-3 justify-center py-6">
                  {draw.winningNumbers.split(',').map((num, i) => (
                    <div key={i} className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary shadow-[0_0_15px_-3px_rgba(255,215,0,0.3)]">
                      {num.trim()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl border-border">
                  <p>Winning numbers haven't been drawn yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>About this Draw</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/40">
                <span className="text-muted-foreground">Draw Method</span>
                <span className="font-medium capitalize">{draw.drawType}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/40">
                <span className="text-muted-foreground">Match 5 Prize</span>
                <span className="font-medium text-primary">Jackpot</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/40">
                <span className="text-muted-foreground">Match 4 Prize</span>
                <span className="font-medium">Pool Share</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/40">
                <span className="text-muted-foreground">Match 3 Prize</span>
                <span className="font-medium">Pool Share</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
