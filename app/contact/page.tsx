"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StoreLayout from "@/components/store/StoreLayout";
import { Clock4, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TOPICS = ["Order enquiry", "Returns & exchange", "Warranty claim", "Product question", "Partnership", "Other"];

export default function Contact() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      setSubmitting(false);
      toast.success("Message sent! Our team will reply within a few hours.");
      form.reset();
    } catch { setSubmitting(false); toast.error("We could not send your message. Please try again."); }
  };

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            We're here to help
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Contact Sovereign
          </h1>
          <p className="mt-3 text-slate-500">
            Questions about an order, a warranty, or which watch suits your
            wrist? Real humans reply - usually within a few hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* contact cards */}
          <div className="space-y-4">
            {[
              { icon: Phone, title: "Call us", lines: ["+92 300 1234567", "Mon-Sat, 10am-8pm"] },
              { icon: MessageCircle, title: "WhatsApp", lines: ["+92 300 1234567", "Fastest response"] },
              { icon: Mail, title: "Email", lines: ["care@sovereign.pk", "Replies within 4 hours"] },
              { icon: MapPin, title: "Visit", lines: ["Boutique 12, Mall Road", "Lahore, Pakistan"] },
            ].map((c) => (
              <div key={c.title} className="glass flex items-start gap-4 rounded-2xl p-5">
                <span className="glass-chip flex size-11 shrink-0 items-center justify-center rounded-xl text-primary">
                  <c.icon className="size-5" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{c.title}</p>
                  {c.lines.map((l) => (
                    <p key={l} className="text-sm text-slate-500">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* form */}
          <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Send us a message
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Your name *</Label>
                <Input name="name" id="contact-name" required placeholder="Ali Khan" className="rounded-xl bg-white/70" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">Email address *</Label>
                <Input name="email" id="contact-email" type="email" required placeholder="ali@example.com" className="rounded-xl bg-white/70" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Phone number</Label>
                <Input name="phone" id="contact-phone" placeholder="0300 1234567" className="rounded-xl bg-white/70" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-topic">Topic</Label>
                <Select name="topic" value={topic} onValueChange={setTopic}>
                  <SelectTrigger id="contact-topic" className="w-full rounded-xl bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong">
                    {TOPICS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contact-message">Message *</Label>
                <Textarea name="message" id="contact-message" required placeholder="How can we help?" rows={5} className="rounded-xl bg-white/70" />
              </div>
            </div>
            <Button type="submit" size="lg" className="rounded-full" disabled={submitting}>
              {submitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      </div>
    </StoreLayout>
  );
}
