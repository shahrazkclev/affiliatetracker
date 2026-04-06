import { CheckCircle2, Circle, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface SetupProps {
  hasCampaign: boolean;
  hasAffiliate: boolean;
  hasClicks: boolean;
  hasStripe: boolean;
}

export function AdminSetupChecklist({ hasCampaign, hasAffiliate, hasClicks, hasStripe }: SetupProps) {
  const steps = [
    {
      title: "Create your first campaign",
      description: "Define commission rules and set up your default program.",
      completed: hasCampaign,
      href: "/admin/campaigns",
      actionLabel: "View Campaigns"
    },
    {
      title: "Add your first affiliate",
      description: "Manually invite or share your portal link to onboard partners.",
      completed: hasAffiliate,
      href: "/admin/affiliates",
      actionLabel: "Manage Affiliates"
    },
    {
      title: "Install tracking snippet",
      description: "Add the JS snippet to your storefront to capture affiliate clicks.",
      completed: hasClicks, // if we have clicks, we know it's installed
      href: "/admin/settings",
      actionLabel: "Get Snippet"
    },
    {
      title: "Configure Stripe Webhook",
      description: "Connect your Stripe account to automatically calculate commissions on successful checkouts.",
      completed: hasStripe,
      href: "/admin/settings",
      actionLabel: "Connect Stripe"
    }
  ];

  // We can automatically mark Stripe as completed if revenue exists, but let's just use the props.
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  if (completedSteps === steps.length) {
    return null; // Hide when fully completed
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-100">Setup Guide</CardTitle>
            <CardDescription className="text-zinc-400 mt-1">
              Complete these essential steps to launch your affiliate program.
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-zinc-100">{completedSteps}</span>
            <span className="text-zinc-500 text-sm">/{steps.length}</span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2 bg-zinc-950 mt-4 [&>div]:bg-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, idx) => (
            <Link key={idx} href={step.href}>
              <div className={`p-4 rounded-lg border transition-all duration-300 h-full flex flex-col justify-between ${
                step.completed 
                  ? "bg-zinc-950/50 border-zinc-800/50 opacity-60" 
                  : "bg-zinc-950 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 shadow-inner group/step cursor-pointer"
              }`}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-600 shrink-0 group-hover/step:text-amber-500 transition-colors" />
                    )}
                    <h3 className={`font-medium ${step.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 pl-8 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <div className="pl-8 mt-4 flex items-center text-xs font-medium text-amber-500 opacity-0 group-hover/step:opacity-100 transition-opacity translate-x-[-10px] group-hover/step:translate-x-0 duration-300">
                    {step.actionLabel} <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
