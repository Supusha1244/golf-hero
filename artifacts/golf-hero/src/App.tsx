import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Scores from "./pages/Scores";
import Charities from "./pages/Charities";
import CharityDetail from "./pages/CharityDetail";
import Draws from "./pages/Draws";
import DrawDetail from "./pages/DrawDetail";
import Prizes from "./pages/Prizes";
import Subscribe from "./pages/Subscribe";
import AdminLayout from "./pages/admin/Layout";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(43, 96%, 56%)",
    colorBackground: "hsl(222, 47%, 7%)",
    colorInputBackground: "hsl(217, 32%, 17%)",
    colorText: "hsl(210, 40%, 98%)",
    colorTextSecondary: "hsl(215, 20.2%, 65.1%)",
    colorInputText: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(217, 32%, 17%)",
    borderRadius: "0.5rem",
    fontFamily: "Inter, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "rounded-2xl w-full overflow-hidden border border-border shadow-xl bg-card",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(210, 40%, 98%)" },
    headerSubtitle: { color: "hsl(215, 20.2%, 65.1%)" },
    socialButtonsBlockButtonText: { color: "hsl(210, 40%, 98%)" },
    formFieldLabel: { color: "hsl(210, 40%, 98%)" },
    footerActionLink: { color: "hsl(43, 96%, 56%)" },
    footerActionText: { color: "hsl(215, 20.2%, 65.1%)" },
    dividerText: { color: "hsl(215, 20.2%, 65.1%)" },
    identityPreviewEditButton: { color: "hsl(43, 96%, 56%)" },
    formFieldSuccessText: { color: "hsl(142, 70%, 50%)" },
    alertText: { color: "hsl(0, 62.8%, 30.6%)" },
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your account",
          },
        },
        signUp: {
          start: {
            title: "Join GolfHero",
            subtitle: "Play golf. Do good.",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Public/Mixed Routes */}
            <Route path="/charities" component={Charities} />
            <Route path="/charities/:id" component={CharityDetail} />
            
            {/* Protected Routes */}
            <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
            <Route path="/scores"><ProtectedRoute component={Scores} /></Route>
            <Route path="/draws"><ProtectedRoute component={Draws} /></Route>
            <Route path="/draws/:id"><ProtectedRoute component={DrawDetail} /></Route>
            <Route path="/prizes"><ProtectedRoute component={Prizes} /></Route>
            <Route path="/subscribe"><ProtectedRoute component={Subscribe} /></Route>
            <Route path="/admin/*"><ProtectedRoute component={AdminLayout} /></Route>
            
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
