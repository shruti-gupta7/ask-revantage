import type { Metadata } from "next";
import { PeopleView } from "@/components/people-view";

export const metadata: Metadata = { title: "People Directory", description: "Find the right fictional demo specialist." };
export default function PeoplePage() { return <PeopleView/>; }
