import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import IMClient from "./IMClient";

export default async function IMPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      memoData: true,
      imSections: { orderBy: { order: "asc" } },
    },
  });

  if (!business) notFound();

  const session = await getServerSession();
  const isOwner = session?.user?.email === business.user.email;

  // Serialise for client
  const businessData = {
    id: business.id,
    name: business.name,
    industry: business.industry,
    subIndustry: business.subIndustry,
    location: business.location,
    state: business.state,
    postcode: business.postcode,
    askingPrice: business.askingPrice ? Number(business.askingPrice) : null,
    annualRevenue: business.annualRevenue ? Number(business.annualRevenue) : null,
    annualProfit: business.annualProfit ? Number(business.annualProfit) : null,
    establishedYear: business.establishedYear,
    employees: business.employees,
    description: business.description,
    reasonForSale: business.reasonForSale,
  };

  const sections = business.imSections.map((s) => ({
    id: s.id,
    sectionType: s.sectionType,
    title: s.title,
    content: s.content,
    order: s.order,
    mediaUrls: s.mediaUrls,
    isVisible: s.isVisible,
  }));

  return (
    <IMClient
      business={businessData}
      initialSections={sections}
      isOwner={isOwner}
    />
  );
}
