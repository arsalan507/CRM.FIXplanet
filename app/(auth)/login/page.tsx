"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const supabase = useMemo(() => {
    if (typeof window !== "undefined") {
      return createClient();
    }
    return null;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);

    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if user exists in staff table
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("*")
          .eq("auth_user_id", data.user.id)
          .single();

        if (staffError || !staffData) {
          toast({
            title: "Access denied",
            description: "You are not registered as a staff member. Please contact the administrator.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (!staffData.is_active) {
          toast({
            title: "Account disabled",
            description: "Your account has been disabled. Please contact the administrator.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Login successful
        toast({
          title: "Welcome back!",
          description: `Logged in as ${staffData.full_name}`,
        });

        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const { data: staffData } = await supabase
          .from("staff")
          .select("*")
          .eq("auth_user_id", data.user.id)
          .single();

        toast({
          title: "Welcome back!",
          description: `Logged in as ${staffData?.full_name}`,
        });

        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Fixplanet CRM
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            iPhone & Apple Device Repair Management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-black"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-center space-y-2 pb-4">
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a verification code to
                </p>
                <p className="font-medium">{email}</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setStep("credentials")}
                  className="text-sm"
                >
                  Change email
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="border-black text-center text-2xl tracking-widest"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign in"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
