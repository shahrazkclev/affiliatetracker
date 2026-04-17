"use server";

import { cookies } from "next/headers";

export async function setCampaignCookie(campaignId: string) {
    const cookieStore = await cookies();
    cookieStore.set("active_campaign_id", campaignId, { 
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    });
}
