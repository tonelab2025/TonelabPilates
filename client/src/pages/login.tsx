import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      // Call backend API to set authentication cookies
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('adminAuthenticated', 'true');
        return result;
      } else {
        throw new Error("Invalid password");
      }
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard.",
      });
      setLocation("/admin");
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black">
            Tonelab Admin
          </CardTitle>
          <p className="text-gray-600">
            Enter the admin password to access the dashboard
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        {...field}
                        data-testid="input-admin-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg font-semibold transition-colors border-0 cursor-pointer"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
                style={{ 
                  color: 'white',
                  backgroundColor: '#000000',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}