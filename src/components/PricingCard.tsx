'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface PricingCardProps {
    title: string;
    price: string;
    interval?: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
    formAction: string | ((formData: FormData) => void);
    planValue: string;
    index: number;
}

const listVariant: any = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariant: any = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function PricingCard({
    title,
    price,
    interval = '/mo',
    features,
    isPopular = false,
    buttonText,
    formAction,
    planValue,
    index,
}: PricingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100, damping: 20 }}
            className={`flex flex-col relative transition-shadow duration-500 rounded-2xl p-8 overflow-hidden group
                ${isPopular 
                    ? "bg-zinc-950/80 border-zinc-800 shadow-[0_0_40px_-15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_-10px_rgba(249,115,22,0.4)]" 
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:shadow-2xl"
                } border backdrop-blur-sm`
            }
        >
            {/* Glowing gradient background for popular card */}
            {isPopular && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            )}

            {isPopular && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute top-0 right-0 bg-gradient-to-l from-brand-orange to-orange-400 text-white text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1.5"
                >
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                </motion.div>
            )}
            
            <div className="flex-1 relative z-10">
                <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
                <div className="flex items-end gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                    <span className="text-sm text-zinc-500 font-medium mb-1.5">{interval}</span>
                </div>
                
                <motion.ul 
                    variants={listVariant}
                    initial="hidden"
                    animate="show"
                    className="space-y-4 mb-8"
                >
                    {features.map((feature, i) => (
                        <motion.li key={i} variants={itemVariant} className="flex items-start text-sm text-zinc-300 gap-3">
                            <span className="mt-0.5 flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                            </span> 
                            <span className="leading-relaxed">{feature}</span>
                        </motion.li>
                    ))}
                </motion.ul>
            </div>
            
            <form action={formAction as any} className="w-full mt-auto relative z-10">
                <input type="hidden" name="plan" value={planValue} />
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2
                        ${isPopular 
                            ? "bg-gradient-to-r from-brand-orange to-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] border-t border-white/20" 
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-zinc-600 shadow-sm"
                        }`
                    }
                >
                    {buttonText}
                </motion.button>
            </form>
        </motion.div>
    );
}
