"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorPlay, Globe, Palette, Upload, CheckCircle2, Copy, RefreshCw, ImagePlus, X, Save, Mail, PanelLeft, Smartphone, FileText, Loader2, CircleX } from "lucide-react";

import { uploadLogoAndSave, getPortalConfig, saveBrandingSettings } from "./actions";
import { getCustomDomainStatus } from "./cloudflare-actions";
import { CustomDomainCard } from "./CustomDomainCard";
import Image from "next/image";

export default function PortalConfigPage() {
    const [domain, setDomain] = useState("");
    const defaultDomain = "affiliatemango.com";
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isBrandingPending, startBrandingTransition] = useTransition();
    const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
    const [brandingStatus, setBrandingStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [brandingError, setBrandingError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [domainStatus, setDomainStatus] = useState<string | null>(null);
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
    const [refreshClock, setRefreshClock] = useState(0);

    const [primaryColor, setPrimaryColor] = useState("#f59e0b");
    const [theme, setTheme] = useState("dark");
    const [sidebarHeight, setSidebarHeight] = useState(36);
    const [emailHeight, setEmailHeight] = useState(44);

    useEffect(() => {
        getPortalConfig().then((config) => {
            if (config?.custom_domain) setDomain(config.custom_domain);
            if (config?.logo_url) setLogoUrl(config.logo_url);
            if (config?.primary_color) setPrimaryColor(config.primary_color);
            if (config?.theme) setTheme(config.theme);
            if (config?.logo_sidebar_height) setSidebarHeight(config.logo_sidebar_height);
            if (config?.logo_email_height) setEmailHeight(config.logo_email_height);
        });
    }, []);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    function handleUpload() {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;
        setUploadStatus("idle");
        setErrorMsg("");
        const formData = new FormData();
        formData.append("logo", file);
        startTransition(async () => {
            const res = await uploadLogoAndSave(formData);
            if (res.error) { setUploadStatus("error"); setErrorMsg(res.error); }
            else { setUploadStatus("success"); setLogoUrl(res.url ?? null); setPreviewUrl(null); }
        });
    }

    function handleRemovePreview() {
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleSaveBranding() {
        setBrandingStatus("idle");
        setBrandingError("");
        startBrandingTransition(async () => {
            const res = await saveBrandingSettings(primaryColor, theme, sidebarHeight, emailHeight);
            if (res.error) { setBrandingStatus("error"); setBrandingError(res.error); }
            else { setBrandingStatus("success"); setTimeout(() => setBrandingStatus("idle"), 3000); }
        });
    }

    async function handleRefreshStatus() {
        if (!domain) return;
        setRefreshClock(c => c + 1);
    }

    const activeLogo = previewUrl || logoUrl;

    return (
        <div className="p-2 sm:p-6 space-y-6 w-full max-w-full max-auto font-sans">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg shadow-black/50">
                    <MonitorPlay className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Portal Configuration</h2>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide border-l-2 border-amber-500/50 pl-2 ml-1 mt-1">Manage affiliate dashboard styling &amp; domains</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">

                    {/* Domain Settings UI Injection */}
                    <CustomDomainCard 
                        currentDomain={domain || null} 
                        refreshClock={refreshClock}
                        onDomainChange={(d) => setDomain(d || "")} 
                        onStatusChange={setDomainStatus} 
                        onCheckingChange={setIsRefreshingStatus}
                    />

                    {/* Branding & Logo */}
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden">
                        <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4 text-amber-500" /> Branding &amp; Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Brand Logo</Label>
                                <p className="text-xs text-zinc-500">Appears in emails and the affiliate portal sidebar.</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                                        {previewUrl ? (
                                            <>
                                                <Image src={previewUrl} alt="Preview" fill className="object-contain p-1" unoptimized />
                                                <button onClick={handleRemovePreview} className="absolute top-0.5 right-0.5 bg-zinc-800 rounded-full p-0.5 hover:bg-red-900 transition-colors">
                                                    <X className="w-3 h-3 text-zinc-300" />
                                                </button>
                                            </>
                                        ) : logoUrl ? (
                                            <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" unoptimized />
                                        ) : (
                                            <ImagePlus className="w-6 h-6 text-zinc-600" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            className="hidden" id="logo-upload" onChange={handleFileChange} />
                                        <label htmlFor="logo-upload">
                                            <Button variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs cursor-pointer" asChild>
                                                <span><Upload className="w-3.5 h-3.5 mr-2" /> Choose Image</span>
                                            </Button>
                                        </label>
                                        {previewUrl && (
                                            <Button onClick={handleUpload} disabled={isPending}
                                                className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-xs">
                                                {isPending ? "Uploading..." : "Save Logo"}
                                            </Button>
                                        )}
                                        {uploadStatus === "success" && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>}
                                        {uploadStatus === "error" && <span className="text-xs text-red-400">{errorMsg}</span>}
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-600">PNG, JPG, WebP, SVG. Recommended max 500×200px.</p>
                            </div>

                            <div className="h-px bg-zinc-800/50" />

                            {/* Logo Size Controls */}
                            <div className="space-y-4">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Logo Sizes</Label>
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Sidebar size */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <PanelLeft className="w-3.5 h-3.5 text-zinc-500" />
                                            <span className="text-xs text-zinc-400">Sidebar height</span>
                                            <span className="ml-auto text-xs font-mono text-amber-500">{sidebarHeight}px</span>
                                        </div>
                                        <input
                                            type="range" min={20} max={80} step={2}
                                            value={sidebarHeight}
                                            onChange={(e) => setSidebarHeight(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-full bg-zinc-800 accent-amber-500 cursor-pointer"
                                        />
                                        {activeLogo && (
                                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center">
                                                <div className="bg-white rounded-lg px-2 py-1.5 inline-flex">
                                                    <Image src={activeLogo} alt="Sidebar preview" width={200} height={sidebarHeight}
                                                        style={{ height: sidebarHeight, width: "auto", maxWidth: 160 }}
                                                        className="object-contain" unoptimized />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Email size */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                            <span className="text-xs text-zinc-400">Email height</span>
                                            <span className="ml-auto text-xs font-mono text-amber-500">{emailHeight}px</span>
                                        </div>
                                        <input
                                            type="range" min={24} max={80} step={2}
                                            value={emailHeight}
                                            onChange={(e) => setEmailHeight(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-full bg-zinc-800 accent-amber-500 cursor-pointer"
                                        />
                                        {activeLogo && (
                                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center">
                                                <div className="bg-white rounded-xl px-3 py-2 inline-flex">
                                                    <Image src={activeLogo} alt="Email preview" width={200} height={emailHeight}
                                                        style={{ height: emailHeight, width: "auto", maxWidth: 160 }}
                                                        className="object-contain" unoptimized />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-zinc-800/50" />

                            {/* Colors & Theme */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Primary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer relative">
                                            <div className="w-8 h-8 rounded-md border border-zinc-700 overflow-hidden"
                                                style={{ background: primaryColor }} />
                                            <input type="color" value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                                        </label>
                                        <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                                            maxLength={7}
                                            className="w-24 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs focus-visible:ring-amber-500 h-8" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dashboard Theme</Label>
                                    <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md p-1">
                                        {["dark", "light"].map((t) => (
                                            <button key={t} onClick={() => setTheme(t)}
                                                className={`flex-1 text-center text-xs py-1.5 rounded font-medium transition-all duration-200 ${theme === t ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}>
                                                {t === "dark" ? "Dark" : "Light"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Save */}
                            <div className="flex items-center gap-3 pt-1">
                                <Button onClick={handleSaveBranding} disabled={isBrandingPending}
                                    className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold text-sm">
                                    <Save className="w-3.5 h-3.5 mr-2" />
                                    {isBrandingPending ? "Saving..." : "Save Branding"}
                                </Button>
                                {brandingStatus === "success" && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>}
                                {brandingStatus === "error" && <span className="text-xs text-red-400">{brandingError}</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 w-full font-sans">
                    <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Status</CardTitle>
                            <Button variant="ghost" size="icon" onClick={handleRefreshStatus} disabled={isRefreshingStatus || !domain} className="h-6 w-6 text-zinc-500 hover:text-amber-500">
                                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin text-amber-500' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                {domain && domainStatus === 'active' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : domain && (domainStatus === 'pending_validation' || domainStatus === 'pending') ? (
                                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                ) : (
                                    <CircleX className="w-4 h-4 text-zinc-600" />
                                )}
                                <span className={domain && domainStatus === 'active' ? 'text-zinc-200' : ''}>SSL Certificate Active</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                {domain && domainStatus === 'active' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : domain && (domainStatus === 'pending_validation' || domainStatus === 'pending') ? (
                                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                ) : (
                                    <CircleX className="w-4 h-4 text-zinc-600" />
                                )}
                                <span className={domain && domainStatus === 'active' ? 'text-zinc-200' : ''}>DNS Verified</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                {domain ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <CircleX className="w-4 h-4 text-zinc-600" />
                                )}
                                <span className={domain ? 'text-zinc-200' : ''}>Global Edge CDN Routing</span>
                            </div>

                            <Button 
                                className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 disabled:opacity-50"
                                disabled={!domain || domainStatus !== 'active'}
                                onClick={() => window.open(`https://${domain}`, '_blank')}
                            >
                                Open Portal Preview
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Multi-scenario Email Preview */}
                    {activeLogo && (
                        <Card className="bg-zinc-900 border-zinc-800/80 shadow-xl overflow-hidden">
                            <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30 pb-3">
                                <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Logo Scenarios</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {/* Dark email bg */}
                                <div>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email (dark bg)</p>
                                    <div className="bg-[#09090b] rounded-lg p-4 flex justify-center">
                                        <div className="bg-white rounded-xl px-3 py-2 inline-flex">
                                            <Image src={activeLogo} alt="Email dark" width={200} height={emailHeight}
                                                style={{ height: emailHeight, width: "auto", maxWidth: 160 }} className="object-contain" unoptimized />
                                        </div>
                                    </div>
                                </div>
                                {/* Light email bg */}
                                <div>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email (light bg)</p>
                                    <div className="bg-[#f9fafb] rounded-lg p-4 flex justify-center">
                                        <Image src={activeLogo} alt="Email light" width={200} height={emailHeight}
                                            style={{ height: emailHeight, width: "auto", maxWidth: 160 }} className="object-contain" unoptimized />
                                    </div>
                                </div>
                                {/* Sidebar */}
                                <div>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><PanelLeft className="w-3 h-3" /> Sidebar (dark)</p>
                                    <div className="bg-zinc-950 rounded-lg p-3 flex items-center border border-zinc-800">
                                        <div className="bg-white rounded-xl px-3 py-1.5 inline-flex">
                                            <Image src={activeLogo} alt="Sidebar" width={200} height={sidebarHeight}
                                                style={{ height: sidebarHeight, width: "auto", maxWidth: 160 }} className="object-contain" unoptimized />
                                        </div>
                                    </div>
                                </div>
                                {/* Mobile / favicon-like */}
                                <div>
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> Small / favicon</p>
                                    <div className="bg-zinc-950 rounded-lg p-3 flex items-center gap-3 border border-zinc-800">
                                        <div className="bg-white rounded-lg p-1 inline-flex">
                                            <Image src={activeLogo} alt="Tiny" width={32} height={32}
                                                style={{ height: 24, width: "auto" }} className="object-contain" unoptimized />
                                        </div>
                                        <span className="text-xs text-zinc-500 font-mono">24px</span>
                                        <div className="bg-white rounded-lg p-1 inline-flex">
                                            <Image src={activeLogo} alt="Tiny" width={32} height={32}
                                                style={{ height: 32, width: "auto" }} className="object-contain" unoptimized />
                                        </div>
                                        <span className="text-xs text-zinc-500 font-mono">32px</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* ── Legal Compliance ──────────────────────────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Legal Compliance</span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                            Terms of Service URL <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                        </label>
                        <input
                            placeholder="https://yoursite.com/terms"
                            className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 font-mono"
                        />
                        <p className="text-[11px] font-mono text-zinc-500">
                            If set, affiliates must agree to this before completing registration.
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                            Privacy Policy URL <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                        </label>
                        <input
                            placeholder="https://yoursite.com/privacy"
                            className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 font-mono"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
