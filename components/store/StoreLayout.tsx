import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { Background } from "./Background";
import { ReactNode } from "react";

export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Background />
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </>
  );
}

export default StoreLayout;
