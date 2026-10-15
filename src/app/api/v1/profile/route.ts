import { contactLinks, type ContactHandles } from "@/components/site/contact-links";
import { getProfile } from "@/lib/queries";
import { respondWith } from "@/app/api/v1/_shared";

/**
 * GET /api/v1/profile
 *
 * Contact handles are returned raw *and* resolved: the mobile client gets a
 * ready-made `links` object so WhatsApp/Messenger/tel rules live in exactly one
 * place — the same helper the website uses.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return respondWith(
    async () => {
      const profile = await getProfile();
      if (!profile) return null;

      const handles: ContactHandles = {
        email: profile.email,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        facebookUrl: profile.facebookUrl,
        messengerUsername: profile.messengerUsername,
        websiteUrl: profile.websiteUrl,
      };

      return {
        profile: {
          fullName: profile.fullName,
          headline: profile.headline,
          subheadline: profile.subheadline,
          summary: profile.summary,
          location: profile.location,
          email: profile.email,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          linkedinUrl: profile.linkedinUrl,
          githubUrl: profile.githubUrl,
          facebookUrl: profile.facebookUrl,
          messengerUsername: profile.messengerUsername,
          websiteUrl: profile.websiteUrl,
          avatarPath: profile.avatarPath,
          links: contactLinks(handles),
        },
      };
    },
    {
      error: "profile_missing",
      message: "Profile content has not been seeded yet.",
    },
  );
}
