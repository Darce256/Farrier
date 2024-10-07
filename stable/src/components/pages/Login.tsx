import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { useAuth } from "@/components/Contexts/AuthProvider"; // Import useAuth

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, user } = useAuth(); // Also get the user object

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user?.isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/horses");
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <LiaHorseHeadSolid className="h-12 w-12 text-primary" />
            <span className="ml-2 text-3xl font-bold text-primary">
              Farrier
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your horse management
            dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="horse.lover@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit">
              Log in
            </Button>
            <div className="text-center text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
