import { useGetDashboardSummary, useGetMyProfile } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, HeartHandshake, CreditCard, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile({ query: { queryKey: ["myProfile"] } });
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({ query: { queryKey: ["dashboardSummary"] } });

  const isLoading = isProfileLoading || isSummaryLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.firstName || 'Golfer'}</h1>
            <p className="text-muted-foreground mt-1">Here's your GolfHero summary</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/scores">
              <Button variant="outline" className="border-primary/50 hover:bg-primary/10">Log Score</Button>
            </Link>
            <Link href="/draws">
              <Button className="bg-primary text-primary-foreground">Monthly Draw</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Impact Card */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <HeartHandshake className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-muted-foreground">Total Contributed</p>
                    <p className="text-2xl font-bold">${summary?.totalContributed || 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[150px]">{summary?.selectedCharity || 'No charity selected'}</span>
                  <Link href="/charities" className="text-primary hover:underline flex items-center">
                    Change <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Scores Card */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-muted-foreground">Scores Entered</p>
                    <p className="text-2xl font-bold">{summary?.totalScoresEntered || 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latest: {summary?.latestScore ? `${summary.latestScore} pts` : 'None'}</span>
                  <Link href="/scores" className="text-blue-500 hover:underline flex items-center">
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Winnings Card */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
                    <Trophy className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-muted-foreground">Total Won</p>
                    <p className="text-2xl font-bold">${summary?.totalWon || 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{summary?.drawsEntered || 0} draws entered</span>
                  <Link href="/prizes" className="text-green-500 hover:underline flex items-center">
                    Prizes <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10">
                    <CreditCard className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-muted-foreground">Subscription</p>
                    <p className="text-lg font-bold capitalize">{summary?.subscriptionStatus || 'Inactive'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{summary?.subscriptionPlan || '-'} plan</span>
                  <Link href="/subscribe" className="text-purple-500 hover:underline flex items-center">
                    Manage <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest interactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Activity feed coming soon...</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle>Next Draw</CardTitle>
              <CardDescription>Get ready for the upcoming monthly draw</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="text-5xl font-bold text-primary mb-2">
                  Jackpot
                </div>
                <p className="text-muted-foreground max-w-xs">Make sure you have at least 5 recent scores entered to participate.</p>
                <Link href="/draws">
                  <Button variant="outline" className="mt-4">View Draw Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
