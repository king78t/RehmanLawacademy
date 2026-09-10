// Central Brand Configuration for RehmanLawAcademy
// All components, pages, footers, and widgets read from this centralized configuration.

export interface BrandSocialItem {
  platform: string;
  displayLabel: string;
  handleOrName: string;
  url: string;
  audience?: string;
  buttonText: string;
}

export interface BrandConfig {
  brandName: string;
  tagline: string;
  subTagline: string;
  copyright: string;
  founder: {
    name: string;
    designation: string;
    fullTitle: string;
    bio: string;
    imageUrl: string;
  };
  whatsapp: {
    display: string;
    rawNumber: string;
    url: string;
  };
  email: {
    address: string;
    mailto: string;
  };
  socials: {
    facebook: BrandSocialItem;
    instagram: BrandSocialItem;
    tiktok: BrandSocialItem;
  };
}

const STORAGE_KEY = "rehman_law_brand_custom_settings";

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brandName: "RehmanLawAcademy",
  tagline: "Prepare Smart. Practice More. Succeed in LAT & Law GAT.",
  subTagline: "A dedicated academic preparation platform designed to help Pakistani law students excel in LAT, Law GAT, LLB examinations, and core legal subjects.",
  copyright: "© RehmanLawAcademy. All Rights Reserved.",
  founder: {
    name: "Adv. AbdulRehman Yaseen",
    designation: "High Court Advocate",
    fullTitle: "Adv. AbdulRehman Yaseen — High Court Advocate",
    bio: "Adv. AbdulRehman Yaseen is a practicing High Court Advocate and committed legal mentor in Pakistan. With extensive courtroom insight and deep commitment to legal education, he founded RehmanLawAcademy to provide Pakistani law aspirants with structured test preparation, high-yield legal MCQs, and conceptual mastery for LAT, Law GAT, and LLB degree programs.",
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=800",
  },
  whatsapp: {
    display: "+92 312 8891288",
    rawNumber: "923128891288",
    url: "https://wa.me/923128891288",
  },
  email: {
    address: "rehmanyaseen898@gmail.com",
    mailto: "mailto:rehmanyaseen898@gmail.com",
  },
  socials: {
    facebook: {
      platform: "Facebook",
      displayLabel: "Facebook Page",
      handleOrName: "Facebook",
      url: "https://www.facebook.com/share/1HZMPchiZr/",
      audience: "9,498 Likes",
      buttonText: "Visit Facebook",
    },
    instagram: {
      platform: "Instagram",
      displayLabel: "@abdulrehmanyaseenadv",
      handleOrName: "Instagram",
      url: "https://www.instagram.com/abdulrehmanyaseenadv",
      audience: "16,460 Followers",
      buttonText: "Follow on Instagram",
    },
    tiktok: {
      platform: "TikTok",
      displayLabel: "@abdulrehmanyaseenadv",
      handleOrName: "TikTok",
      url: "https://www.tiktok.com/@abdulrehmanyaseenadv",
      buttonText: "Follow on TikTok",
    },
  },
};

/**
 * Returns the active brand configuration.
 * Allows custom override from localStorage (e.g. founder photograph replaced via Admin Panel)
 */
export function getBrandConfig(): BrandConfig {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      return {
        ...DEFAULT_BRAND_CONFIG,
        ...parsed,
        founder: {
          ...DEFAULT_BRAND_CONFIG.founder,
          ...(parsed.founder || {}),
        },
        whatsapp: {
          ...DEFAULT_BRAND_CONFIG.whatsapp,
          ...(parsed.whatsapp || {}),
        },
        email: {
          ...DEFAULT_BRAND_CONFIG.email,
          ...(parsed.email || {}),
        },
        socials: {
          facebook: {
            ...DEFAULT_BRAND_CONFIG.socials.facebook,
            ...(parsed.socials?.facebook || {}),
          },
          instagram: {
            ...DEFAULT_BRAND_CONFIG.socials.instagram,
            ...(parsed.socials?.instagram || {}),
          },
          tiktok: {
            ...DEFAULT_BRAND_CONFIG.socials.tiktok,
            ...(parsed.socials?.tiktok || {}),
          },
        },
      };
    }
  } catch (e) {
    // Fallback to static default
  }
  return DEFAULT_BRAND_CONFIG;
}

/**
 * Updates the stored brand config from the Admin Panel
 */
export function saveBrandConfig(updated: Partial<BrandConfig>): BrandConfig {
  try {
    const current = getBrandConfig();
    const merged = { ...current, ...updated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    return DEFAULT_BRAND_CONFIG;
  }
}

/**
 * Reset brand config to official values
 */
export function resetBrandConfig(): BrandConfig {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_BRAND_CONFIG;
}

/**
 * Builds the official pre-filled WhatsApp enrollment URL for paid courses:
 * "Assalam-o-Alaikum, I want to enroll in [Course Name]. Please send me the payment details."
 */
export function getCourseWhatsAppUrl(courseName: string): string {
  const config = getBrandConfig();
  const rawNum = config.whatsapp.rawNumber.replace(/[^0-9]/g, "");
  const message = `Assalam-o-Alaikum, I want to enroll in ${courseName}. Please send me the payment details.`;
  return `https://wa.me/${rawNum}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a general inquiry WhatsApp URL with an optional custom prefill message.
 */
export function getGeneralWhatsAppUrl(message?: string): string {
  const config = getBrandConfig();
  const rawNum = config.whatsapp.rawNumber.replace(/[^0-9]/g, "");
  if (!message) {
    return `https://wa.me/${rawNum}`;
  }
  return `https://wa.me/${rawNum}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a mailto link with optional subject
 */
export function getEmailMailto(subject?: string): string {
  const config = getBrandConfig();
  if (!subject) return `mailto:${config.email.address}`;
  return `mailto:${config.email.address}?subject=${encodeURIComponent(subject)}`;
}
