import { getCurrentUser } from "@/lib/user";
import { AvatarProfile } from "./avatar-profile";
import { StatsSheet } from "../stats-sheet";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-4 md:px-12 py-4 shadow-sm fixed z-50 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-300 bg-clip-text text-transparent">
            ACTIVITY OF WEST 4 TEAM
          </h1>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <AvatarProfile user={user} />
            <StatsSheet />
          </div>
        )}
      </div>
    </nav>
  );
}
