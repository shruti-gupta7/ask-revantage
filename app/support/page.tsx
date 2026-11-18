import { redirect } from "next/navigation";

/**
 * Backward-compatible route for repositories that previously linked to
 * /support. The active destination is now the People Directory.
 */
export default function LegacySupportPage() {
  redirect("/people");
}
