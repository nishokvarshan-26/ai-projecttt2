import type { Metadata } from "next";
import { TwinDetailClient } from "./twin-detail-client";

export async function generateMetadata({
  params,
}: PageProps<"/digital-twin/[lakeId]">): Promise<Metadata> {
  const { lakeId } = await params;
  return { title: `Digital Twin — ${lakeId}` };
}

export default async function DigitalTwinDetailPage({
  params,
}: PageProps<"/digital-twin/[lakeId]">) {
  const { lakeId } = await params;
  return <TwinDetailClient lakeId={lakeId} />;
}
