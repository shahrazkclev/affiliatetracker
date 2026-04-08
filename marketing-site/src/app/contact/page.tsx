"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, MessageSquare, User, AtSign } from "lucide-react";
import { submitContactForm } from "../actions/contact";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successStatus, setSuccessStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessStatus("idle");

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    if (result.success) {
      setSuccessStatus("success");
      (e.target as HTMLFormElement).reset();
    } else {
      setSuccessStatus("error");
      setErrorMessage(result.error || "An unexpected error occurred.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen py-24 relative overflow-hidden">
      {/* Abstract Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20 text-xs font-semibold uppercase tracking-widest mb-2">
            <Mail className="w-3 h-3" />
            Get in touch
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Let's talk about <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Affiliates</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Have questions about integrations, need custom enterprise limits, or just want to chat about referential growth? We're here.
          </p>
        </div>

        <div className="border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-3xl rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {successStatus === "success" ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-center py-16 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center ring-1 ring-emerald-500/30 mb-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                <p className="text-zinc-400 max-w-md">
                  Thanks for reaching out! We've received your transmission and will get back to you via your priority portal as soon as possible.
                </p>
                <button 
                  onClick={() => setSuccessStatus("idle")}
                  className="mt-6 text-sm font-medium text-amber-500 hover:text-amber-400 underline underline-offset-4"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit} 
                className="space-y-6 relative z-10"
              >
                {successStatus === "error" && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-zinc-300 ml-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-zinc-500" />
                      </div>
                      <input 
                        type="text" 
                        id="name"
                        name="name"
                        required
                        className="block w-full pl-11 bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                        placeholder="Johnny Mango"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <AtSign className="w-4 h-4 text-zinc-500" />
                      </div>
                      <input 
                        type="email" 
                        id="email"
                        name="email"
                        required
                        className="block w-full pl-11 bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                        placeholder="johnny@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-zinc-300 ml-1">How can we help?</label>
                  <div className="relative">
                    <div className="absolute top-4 left-0 pl-4 pointer-events-none">
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                    </div>
                    <textarea 
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="block w-full pl-11 bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors resize-none"
                      placeholder="Tell us about what you're building..."
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Dispatch Transmission
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
