import { useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Calendar, Heart } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetCharity, 
  useGetMyCharitySelection, 
  useUpdateMyCharitySelection,
  getGetCharityQueryKey,
  getGetMyCharitySelectionQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CharityDetail() {
  const params = useParams();
  const charityId = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: charity, isLoading: isCharityLoading } = useGetCharity(charityId, { 
    query: { enabled: !!charityId, queryKey: getGetCharityQueryKey(charityId) } 
  });
  
  const { data: selection, isLoading: isSelectionLoading } = useGetMyCharitySelection({
    query: { queryKey: getGetMyCharitySelectionQueryKey() }
  });

  const updateSelection = useUpdateMyCharitySelection();

  const isSelected = selection?.charityId === charityId;

  const handleSelect = () => {
    updateSelection.mutate({ data: { charityId, contributionPercent: 100 } }, {
      onSuccess: () => {
        toast({ title: "Charity Selected", description: `You are now supporting ${charity?.name}.` });
        queryClient.invalidateQueries({ queryKey: getGetMyCharitySelectionQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to select charity", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isCharityLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Charity Not Found</h2>
            <Link href="/charities">
              <Button variant="outline">Back to Charities</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Header with background image if available */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-muted">
        {charity.imageUrl ? (
          <>
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            <img src={charity.imageUrl} alt={charity.name} className="w-full h-full object-cover" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 z-10"></div>
        )}
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <Link href="/charities" className="inline-flex items-center text-white/80 hover:text-white mb-6 text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to all charities
            </Link>
            <div className="flex flex-wrap gap-2 mb-3">
              {charity.category && (
                <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/50">
                  {charity.category}
                </Badge>
              )}
              {charity.featured && (
                <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/50">
                  Featured Partner
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{charity.name}</h1>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-12">
          
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">About this cause</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {charity.description}
              </div>
            </section>
            
            {charity.upcomingEvent && (
              <section className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Upcoming Event</h3>
                    <p className="font-medium text-foreground mb-1">{charity.upcomingEvent}</p>
                    {charity.upcomingEventDate && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(charity.upcomingEventDate).toLocaleDateString(undefined, { 
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border/50 shadow-lg sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6 pb-6 border-b border-border/50">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Raised via GolfHero</div>
                  <div className="text-4xl font-bold text-primary">${charity.totalReceived.toLocaleString()}</div>
                </div>
                
                <div className="space-y-4">
                  {isSelected ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                      <Heart className="w-8 h-8 text-green-500 mx-auto mb-2 fill-green-500" />
                      <p className="font-semibold text-green-500">You support this cause</p>
                      <p className="text-xs text-green-500/80 mt-1">A portion of your subscription goes here.</p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleSelect}
                      disabled={updateSelection.isPending}
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      {updateSelection.isPending ? "Updating..." : "Support this Cause"}
                    </Button>
                  )}
                  
                  {charity.website && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={charity.website} target="_blank" rel="noopener noreferrer">
                        Visit Website <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
