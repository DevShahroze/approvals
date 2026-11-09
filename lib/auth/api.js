import { connectDB } from "@/lib/db/connect";
import { UserProfile, AutomationSettings } from "@/lib/db/models";
import { requireUser } from "@/lib/auth/verify";

export async function getRequestProfile(request) {
  const user = await requireUser(request);
  await connectDB();
  let profile = await UserProfile.findOne({ firebaseUid: user.uid });
  if (!profile) {
    profile = await UserProfile.create({
      firebaseUid: user.uid,
      email: user.email,
    });
    await AutomationSettings.create({ userId: profile._id });
  }
  return { user, profile };
}
