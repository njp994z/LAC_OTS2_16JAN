import { useLocation } from "wouter";
import { useEffect } from "react";
import { Link } from "wouter";

const NotFound = () => {
  const [location] = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location);
  }, [location]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link href="/settings/controller-outputs/faceplates" className="text-primary underline hover:text-primary/90">
          Return to Faceplates
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
