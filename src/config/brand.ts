/**
 * 🏛️ Master Brand & Identity Configuration
 * Single Source of Truth for the platform name, monogram, kernel, and tagline.
 * Linked directly to MASTER_MANIFEST.md.
 * 
 * To re-brand the entire platform (e.g. to "Cipher OS" or "Sutra OS"), 
 * simply update the values in this object.
 */

export interface BrandConfig {
  /** Full platform display name (e.g. "Sutra OS") */
  name: string;
  /** Short call-sign (e.g. "Sutra") */
  shortName: string;
  /** Primary web domain / enterprise anchor (e.g. "sutraflow.ai") */
  webDomain: string;
  /** Web product brand name (e.g. "SutraFlow") */
  webName: string;
  /** Single letter monogram for icons / avatars (e.g. "S") */
  monogram: string;
  /** Underlying cognitive neural kernel */
  kernelName: string;
  /** Core philosophical tagline */
  tagline: string;
  /** Local hardware processing tier */
  hardwareTier: string;
  /** Air-gap & privacy classification */
  securityBadge: string;
  /** Primary brand icon image URL */
  logoUrl: string;
}

export const BRAND_CONFIG: BrandConfig = {
  name: 'Sutra OS',
  shortName: 'Sutra',
  webDomain: 'sutraflow.ai',
  webName: 'SutraFlow',
  monogram: 'S',
  kernelName: 'Cortex Kernel v2.6',
  tagline: 'The Universal Sovereign Agent OS',
  hardwareTier: 'RTX 4090 24GB',
  securityBadge: 'Air-Gap: Secure',
  logoUrl: './logos/sutra-logo.svg',
};

export default BRAND_CONFIG;
