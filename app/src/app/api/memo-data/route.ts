import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const data = await req.json();
    const { businessId, ...memoData } = data;
    
    if (!businessId) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || business.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    // Process decimal fields
    const decimalFields = ['rentPerAnnum', 'revenueCurrent', 'costOfGoodsCurrent', 'grossProfitCurrent', 
      'wagesCurrent', 'rentCurrent', 'ebitdaCurrent', 'revenuePrior', 'ebitdaPrior', 'revenueTwoPrior', 
      'ebitdaTwoPrior', 'ownerSalary', 'ownerPerks', 'adjustedEarnings', 'ffeMktValue', 'stockAtValue', 'askingPrice'];
    
    const intFields = ['established', 'premisesSqm', 'leaseRemainingYrs', 'topCustomerPct', 'daysPerWeek',
      'ftEmployees', 'ptEmployees', 'casualEmployees', 'ownerHoursPerWeek'];
    
    const processedData: any = { ...memoData };
    
    decimalFields.forEach(f => {
      if (processedData[f] !== undefined && processedData[f] !== '') {
        processedData[f] = parseFloat(processedData[f]);
      } else {
        delete processedData[f];
      }
    });
    
    intFields.forEach(f => {
      if (processedData[f] !== undefined && processedData[f] !== '') {
        processedData[f] = parseInt(processedData[f]);
      } else {
        delete processedData[f];
      }
    });
    
    // Handle date
    if (processedData.leaseExpiry && processedData.leaseExpiry !== '') {
      processedData.leaseExpiry = new Date(processedData.leaseExpiry);
    } else {
      delete processedData.leaseExpiry;
    }
    
    // Upsert memo data
    const result = await prisma.infoMemoData.upsert({
      where: { businessId },
      update: { ...processedData, updatedAt: new Date() },
      create: { businessId, ...processedData }
    });
    
    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Memo data save error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
