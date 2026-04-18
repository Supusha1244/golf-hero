import { Link, Route, Switch, useLocation } from "wouter";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { LayoutDashboard, Users, Trophy, Heart, Menu, LogOut } from "lucide-react";
import { useClerk } from "@clerk/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Admin views (we'll implement them in the same file or distinct ones, putting placeholders for now)
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminDraws from "./AdminDraws";
import AdminCharities from "./AdminCharities";
import AdminWinners from "./AdminWinners";

export default function AdminLayout() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  
  const { data: profile, isLoading } = useGetMyProfile({ 
    query: { queryKey: getGetMyProfileQueryKey() } 
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (profile?.role !== 'admin') {
    // Non-admins shouldn't be here
    window.location.href = import.meta.env.BASE_URL + "dashboard";
    return null;
  }

  const NavItems = () => (
    <>
      <Link href="/admin/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/admin/dashboard' || location === '/admin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        <LayoutDashboard className="w-5 h-5" /> Dashboard
      </Link>
      <Link href="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith('/admin/users') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        <Users className="w-5 h-5" /> Users
      </Link>
      <Link href="/admin/draws" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith('/admin/draws') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        <Trophy className="w-5 h-5" /> Draws
      </Link>
      <Link href="/admin/winners" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith('/admin/winners') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        <Trophy className="w-5 h-5" /> Winners
      </Link>
      <Link href="/admin/charities" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith('/admin/charities') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
        <Heart className="w-5 h-5" /> Charities
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-6 h-6" />
          <span className="font-bold">Admin</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] p-0 flex flex-col">
            <div className="p-6 border-b border-border">
              <span className="font-bold text-xl">GolfHero Admin</span>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              <NavItems />
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => signOut()}>
                <LogOut className="w-5 h-5 mr-2" /> Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-border bg-card/50">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight">Admin<span className="text-primary">Panel</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItems />
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full justify-start mb-2">
              Exit Admin
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="w-5 h-5 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/draws" component={AdminDraws} />
          <Route path="/admin/charities" component={AdminCharities} />
          <Route path="/admin/winners" component={AdminWinners} />
          <Route path="/admin/*">
            <div className="p-8">Admin route not implemented yet</div>
          </Route>
        </Switch>
      </div>
    </div>
  );
}
