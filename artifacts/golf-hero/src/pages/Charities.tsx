import { useState } from "react";
import { Link } from "wouter";
import { Search, Heart, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useListCharities, getListCharitiesQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Charities() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data: charities, isLoading } = useListCharities(
    { search: debouncedSearch || undefined }, 
    { query: { queryKey: getListCharitiesQueryKey({ search: debouncedSearch || undefined }) } }
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Header Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Make an Impact</h1>
          <p className="text-lg text-muted-foreground">
            A portion of every subscription goes directly to the charity of your choice. Explore our partner causes below.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10">
          <h2 className="text-2xl font-bold">Partner Charities</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search charities..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden border-border/50">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : charities && charities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charities.map(charity => (
              <Card key={charity.id} className="overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-colors flex flex-col">
                <div className="h-48 bg-muted relative overflow-hidden">
                  {charity.imageUrl ? (
                    <img src={charity.imageUrl} alt={charity.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <Heart className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  {charity.featured && (
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                  {charity.category && (
                    <Badge variant="secondary" className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm">
                      {charity.category}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{charity.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    ${charity.totalReceived.toLocaleString()} Raised
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {charity.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/40">
                  <Link href={`/charities/${charity.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border/50">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No charities found</h3>
            <p className="text-muted-foreground">Try adjusting your search query.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

