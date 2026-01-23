import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import expLogo from "@/assets/exp-logo.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/simulator");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiRequest("POST", "/api/login", credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/simulator");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      return apiRequest("POST", "/api/register", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
      setLocation("/simulator");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegisterMode) {
      registerMutation.mutate({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
    } else {
      loginMutation.mutate({ email, password });
    }
  };
  
  const isPending = loginMutation.isPending || registerMutation.isPending;
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <Card className="w-full max-w-md p-8 relative z-10">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          data-testid="button-back-to-landing"
          className="absolute top-4 left-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <h1 className="text-2xl font-semibold text-foreground">
              Lithium Americas
            </h1>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {isRegisterMode ? "Create an account to get started" : "Sign in to access the operator training simulator"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" data-testid="label-email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              data-testid="input-email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" data-testid="label-password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              data-testid="input-password"
            />
          </div>
          
          {isRegisterMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" data-testid="label-firstName">First Name (optional)</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  data-testid="input-firstName"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" data-testid="label-lastName">Last Name (optional)</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  data-testid="input-lastName"
                />
              </div>
            </div>
          )}
          
          <Button 
            type="submit"
            className="w-full gap-2"
            disabled={isPending}
            data-testid="button-submit-form"
          >
            {isPending ? (
              "Processing..."
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </Button>
        </form>
        
        {!isRegisterMode && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              className="text-sm text-muted-foreground"
              data-testid="link-reset-password"
              onClick={() => {
                toast({
                  title: "Password reset",
                  description: "Please contact your administrator to reset your password.",
                });
              }}
            >
              Forgot password?
            </Button>
          </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"}
          </p>
          <Button
            variant="ghost"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            data-testid="button-toggle-mode"
          >
            {isRegisterMode ? "Sign In" : "Create Account"}
          </Button>
        </div>
      </Card>
      
      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}
