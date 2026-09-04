import StoreLayout from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <StoreLayout>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-28 text-center">
        <h1 className="font-display text-5xl font-semibold text-slate-900">404</h1>
        <p className="text-slate-500">The page you are looking for does not exist or has moved.</p>
        <Button asChild className="rounded-full mt-2">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </StoreLayout>
  );
}
