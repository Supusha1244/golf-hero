import { Link } from "wouter";
import { useUser, UserButton, Show } from "@clerk/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function Navbar() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Show when="signed-in">
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Dashboard
        </Link>
        <Link href="/scores" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Scores
        </Link>
        <Link href="/charities" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Charities
        </Link>
        <Link href="/draws" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Draws
        </Link>
        <Link href="/prizes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Prizes
        </Link>
        {/* We would normally check role here, but we will just add it if they navigate there manually or use a hook */}
      </Show>
      <Show when="signed-out">
        <Link href="/charities" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Our Charities
        </Link>
        <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          How it Works
        </Link>
      </Show>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="GolfHero" className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Golf<span className="text-primary">Hero</span></span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <NavLinks />
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium hidden sm:inline-block">
              Log in
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                Join Movement
              </Button>
            </Link>
          </Show>
          
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 py-6 h-full">
                  <div className="flex items-center gap-2">
                    <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="GolfHero" className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight">Golf<span className="text-primary">Hero</span></span>
                  </div>
                  <nav className="flex flex-col gap-4 mt-6">
                    <Show when="signed-in">
                      <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-lg font-medium">Dashboard</Link>
                      <Link href="/scores" onClick={() => setIsOpen(false)} className="text-lg font-medium">Scores</Link>
                      <Link href="/charities" onClick={() => setIsOpen(false)} className="text-lg font-medium">Charities</Link>
                      <Link href="/draws" onClick={() => setIsOpen(false)} className="text-lg font-medium">Draws</Link>
                      <Link href="/prizes" onClick={() => setIsOpen(false)} className="text-lg font-medium">Prizes</Link>
                    </Show>
                    <Show when="signed-out">
                      <Link href="/charities" onClick={() => setIsOpen(false)} className="text-lg font-medium">Our Charities</Link>
                      <Link href="/sign-in" onClick={() => setIsOpen(false)} className="text-lg font-medium">Log in</Link>
                    </Show>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
