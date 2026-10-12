import { ProfileClient } from "@/components/profile/profile-client";

export const metadata = { title: "Profile — AniFrame", description: "Local profile, watchlist summary, and playback preferences." };

export default function ProfilePage() {
  return <ProfileClient />;
}
