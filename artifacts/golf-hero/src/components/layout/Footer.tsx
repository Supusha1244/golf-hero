import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="GolfHero" className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight">Golf<span className="text-primary">Hero</span></span>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Where sport and charity intersect. Every round played puts money toward causes that matter.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="/charities" className="hover:text-primary transition-colors">Our Charities</Link></li>
              <li><Link href="/draws" className="hover:text-primary transition-colors">Monthly Draws</Link></li>
              <li><Link href="/prizes" className="hover:text-primary transition-colors">Prize Pool</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Join the Movement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe today and make every swing count for something bigger.
            </p>
            <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Get Started
            </Link>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GolfHero. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
