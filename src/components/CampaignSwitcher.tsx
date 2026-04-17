"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setCampaignCookie } from "@/app/(portal)/portal/actions";

interface Profile {
  id: string;
  campaign_id: string;
  name: string;
  campaign?: {
    name: string;
  };
}

export function CampaignSwitcher({ 
  profiles, 
  activeCampaignId 
}: { 
  profiles: Profile[];
  activeCampaignId?: string;
}) {
  const router = useRouter();

  if (!profiles || profiles.length <= 1) {
    return null; // Don't show switcher if they only have 1 campaign
  }

  const activeProfile = profiles.find(p => p.campaign_id === activeCampaignId) || profiles[0];

  const handleSelect = async (campaignId: string) => {
    await setCampaignCookie(campaignId);
    router.refresh(); // Refresh the Server Component tree to fetch the new campaign's data
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="ml-4 h-8 w-[200px] justify-between border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
        >
          {activeProfile?.campaign?.name || "Select Campaign..."}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-zinc-950 border-zinc-800 p-1 rounded-xl shadow-2xl">
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.campaign_id}
            onSelect={() => handleSelect(profile.campaign_id)}
            className="text-xs text-zinc-300 font-medium cursor-pointer hover:bg-zinc-800/50 rounded-lg flex items-center justify-between px-3 py-2"
          >
            <span className="truncate pr-2">{profile.campaign?.name || "Unknown Campaign"}</span>
            {activeProfile.campaign_id === profile.campaign_id && (
              <Check className="h-3.5 w-3.5 text-amber-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
