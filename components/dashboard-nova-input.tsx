"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
export function DashboardNovaInput(){const router=useRouter(),[value,setValue]=useState("");function submit(event:FormEvent){event.preventDefault();const q=value.trim();if(q)router.push(`/app/assistant?q=${encodeURIComponent(q)}`)}return <form className="dashboard-nova-input" onSubmit={submit}><Sparkles/><input aria-label="Ask Nova" value={value} onChange={e=>setValue(e.target.value)} placeholder="Ask Nova about your company…" maxLength={12000}/><button aria-label="Send to Nova"><ArrowUp/></button></form>}
