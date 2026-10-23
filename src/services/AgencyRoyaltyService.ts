/**
 * GenieFlow AI — Agency License & Automated Royalty Management Service
 * 
 * Manages reseller agency licenses, provisions client API keys, tracks per-seat usage,
 * and calculates monthly royalty distributions to the platform founder.
 */

export interface AgencyLicense {
  id: string;
  agencyName: string;
  ownerEmail: string;
  tier: 'operator' | 'franchise';
  upfrontFeePaid: number;
  monthlyPlatformFee: number;
  perSeatRoyaltyRate: number; // $29 / month
  activeClientSeats: number;
  clientApiKeys: string[];
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

export interface RoyaltyInvoice {
  invoiceId: string;
  agencyId: string;
  month: string; // e.g. "2026-10"
  activeSeats: number;
  royaltyRatePerSeat: number;
  platformFee: number;
  totalOwedToFounder: number;
  paymentStatus: 'paid' | 'unpaid' | 'overdue';
}

class AgencyRoyaltyService {
  private static instance: AgencyRoyaltyService;
  private DEFAULT_ROYALTY_RATE = 29.00; // $29 / seat / mo

  private constructor() {}

  public static getInstance(): AgencyRoyaltyService {
    if (!AgencyRoyaltyService.instance) {
      AgencyRoyaltyService.instance = new AgencyRoyaltyService();
    }
    return AgencyRoyaltyService.instance;
  }

  /**
   * Provision a new Agency License upon Stripe checkout completion
   */
  public provisionAgencyLicense(
    agencyName: string,
    ownerEmail: string,
    tier: 'operator' | 'franchise'
  ): AgencyLicense {
    const isFranchise = tier === 'franchise';
    const initialSeats = isFranchise ? 25 : 10;

    const license: AgencyLicense = {
      id: `AGY_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      agencyName,
      ownerEmail,
      tier,
      upfrontFeePaid: isFranchise ? 4997 : 2500,
      monthlyPlatformFee: isFranchise ? 499 : 199,
      perSeatRoyaltyRate: this.DEFAULT_ROYALTY_RATE,
      activeClientSeats: initialSeats,
      clientApiKeys: Array.from({ length: initialSeats }, (_, i) => `GF_KEY_${tier.toUpperCase()}_${i + 1}_${Math.random().toString(36).substring(2, 7)}`),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    console.log(`[AgencyRoyaltyService] Provisioned new agency: ${agencyName} (${tier.toUpperCase()})`);
    return license;
  }

  /**
   * Calculate monthly royalty owed to Founder for an agency
   */
  public calculateMonthlyRoyalty(agency: AgencyLicense, month: string): RoyaltyInvoice {
    const seatRoyaltyTotal = agency.activeClientSeats * agency.perSeatRoyaltyRate;
    const totalOwed = agency.monthlyPlatformFee + seatRoyaltyTotal;

    return {
      invoiceId: `INV_${agency.id}_${month}`,
      agencyId: agency.id,
      month,
      activeSeats: agency.activeClientSeats,
      royaltyRatePerSeat: agency.perSeatRoyaltyRate,
      platformFee: agency.monthlyPlatformFee,
      totalOwedToFounder: totalOwed,
      paymentStatus: 'paid'
    };
  }
}

export const agencyRoyaltyService = AgencyRoyaltyService.getInstance();
