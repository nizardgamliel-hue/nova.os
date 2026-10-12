import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Proxy is only a fast routing gate. Session validation and authorization stay
// in layouts and route handlers, where Better Auth can safely access Drizzle.
export function proxy(request:NextRequest){if(!getSessionCookie(request)){if(request.nextUrl.pathname.startsWith("/api/"))return NextResponse.json({error:"UNAUTHORIZED"},{status:401});const target=new URL("/login",request.url);target.searchParams.set("next",request.nextUrl.pathname);return NextResponse.redirect(target)}return NextResponse.next()}
export const config={matcher:["/app/:path*","/setup","/onboarding","/invite/:path*","/api/crm/:path*","/api/nova/:path*","/api/organizations/:path*","/api/settings/:path*","/api/members/:path*","/api/invitations/:path*","/api/security/:path*","/api/onboarding/:path*","/api/company-profile/:path*","/api/workspace-config/:path*"]};
