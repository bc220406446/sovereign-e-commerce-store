"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import StoreLayout from "@/components/store/StoreLayout";
import { ArrowRight, FileText, HelpCircle, Landmark, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { use } from "react";

const FAQS = [
  { q: "How long does delivery take?", a: "Orders are dispatched within 24 hours. Nationwide delivery takes 2-5 working days." },
  { q: "Is delivery really free?", a: "Yes - normal delivery is free on orders of Rs. 10,000 or more. Orders below that carry Rs. 200 normal delivery; express delivery is Rs. 500." },
  { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD), bank transfer (IBFT), and PayFast." },
  { q: "Are your watches authentic?", a: "Absolutely. Every watch ships with an authenticity certificate and manufacturer warranty." },
  { q: "Can I return or exchange a watch?", a: "Yes. You have 14 days from delivery to request a return or exchange." },
  { q: "What does the warranty cover?", a: "Every Sovereign watch carries a 12-month warranty covering movement and manufacturing defects." },
];

const POLICY_CONTENT: Record<string, { intro: string; points: string[] }> = {
  returns: { intro: "We want every Sovereign purchase to feel considered. If your watch is not right for you, contact our team within 14 days of delivery.", points: ["Items must be unworn, undamaged and returned with the original packaging and documents.", "Approved exchanges are subject to availability; refunds are processed after inspection.", "Customised, worn or damaged items may not qualify for return." ] },
  warranty: { intro: "Every Sovereign timepiece is covered by a 12-month warranty for manufacturing and movement defects.", points: ["The warranty excludes accidental damage, cosmetic wear, water damage beyond the stated rating and unauthorised repairs.", "Contact our team before sending a watch for assessment." ] },
  shipping: { intro: "We deliver carefully packed timepieces across Pakistan through trusted courier partners.", points: ["Standard delivery usually takes 2-5 working days after dispatch.", "Free delivery applies when the order reaches the configured minimum amount.", "You receive tracking information when your order leaves our atelier." ] },
  payment: { intro: "Choose the payment method that suits you at checkout. Available methods are shown before your order is confirmed.", points: ["Cash on Delivery is available for eligible locations and orders.", "Bank transfer instructions are provided after selecting IBFT.", "PayFast supports online card and EFT payments where enabled." ] },
  privacy: { intro: "Sovereign respects your privacy and only uses personal information to provide, improve and protect our services.", points: ["We use order details to process delivery, payments, support and warranty requests.", "We do not sell customer data. Information may be shared with essential service providers such as couriers and payment partners.", "You may contact us to request access, correction or deletion of your personal information." ] },
  terms: { intro: "By using the Sovereign website, you agree to use our services lawfully and responsibly.", points: ["Product prices, availability and specifications may change without prior notice.", "Orders are subject to payment verification, stock availability and delivery-area confirmation.", "Website content, branding and imagery belong to Sovereign and may not be reused without permission." ] },
};

export default function CarePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const titleMap: Record<string, string> = {
    faqs: "Frequently Asked Questions",
    returns: "Returns & Exchange Policy",
    warranty: "Warranty Information",
    shipping: "Shipping Policy",
    payment: "Modes of Payment",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  };

  const title = titleMap[slug] || "Customer Care";

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="glass rounded-[2rem] p-8 sm:p-12 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Customer Care</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h1>
          </div>

          {slug === "faqs" ? (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="glass-soft rounded-2xl border-0 px-4">
                  <AccordionTrigger className="text-sm font-semibold text-slate-800 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs leading-relaxed text-slate-600">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="prose text-sm leading-relaxed text-slate-600 space-y-4">
              <p>{POLICY_CONTENT[slug]?.intro || `Our team is available seven days a week to help with ${title.toLowerCase()}.`}</p>
              {POLICY_CONTENT[slug] && <ul className="space-y-2 pl-5">{POLICY_CONTENT[slug].points.map((point) => <li key={point}>{point}</li>)}</ul>}
              <div className="pt-4">
                <Button asChild className="rounded-full">
                  <Link href="/contact">Contact Sovereign <ArrowRight className="size-4 ml-1.5" /></Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
