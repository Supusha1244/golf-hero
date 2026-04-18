import { Link } from "wouter";
import { format } from "date-fns";
import { Trophy, Calendar, Users, Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useListDraws, getListDrawsQueryKey } from "@workspace/api-client-react";

export default function Draws() {
  const { data: draws, isLoading } = useListDraws({}, { query: { queryKey: getListDrawsQueryKey() } });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'published': 
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="bg-card border-b border-border/50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Monthly Draws</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Your performance fuels your chances. Make sure to log at least 5 scores this month to participate in the upcoming draw.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-2xl font-bold mb-6">Draw History</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : draws && draws.length > 0 ? (
          <div className="space-y-4">
            {draws.map((draw) => (
              <Link key={draw.id} href={`/draws/${draw.id}`}>
                <Card className="border-border/50 hover:border-primary/50 transition-all hover:shadow-md hover:bg-card/80 cursor-pointer group">
                  <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center w-20 shrink-0">
                        <div className="text-sm text-muted-foreground uppercase font-semibold">{draw.month}</div>
                        <div className="text-2xl font-bold">{draw.year}</div>
                      </div>
                      
                      <div className="w-px h-12 bg-border hidden md:block"></div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getStatusColor(draw.status)}>
                            {draw.status.charAt(0).toUpperCase() + draw.status.slice(1)}
                          </Badge>
                          {draw.jackpotRolledOver && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                              Rollover
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {draw.participantCount} Entries</span>
                          <span className="flex items-center"><Target className="w-4 h-4 mr-1" /> {draw.drawType}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto gap-8">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Pool</div>
                        <div className="text-xl font-bold text-primary">${draw.totalPool.toLocaleString()}</div>
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border/50">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Draws Yet</h3>
            <p className="text-muted-foreground">The first monthly draw hasn't been scheduled.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
