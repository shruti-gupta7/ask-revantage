import type { Metadata } from "next";
import { AdminView } from "@/components/admin-view";

export const metadata: Metadata = { title: "Admin Dashboard", description: "Review Ask Revantage source and integration readiness." };
export default function AdminPage() { return <AdminView/>; }
