import { Suspense } from "react";
import ProfileClientComponent from "@/app/components/profile/ProfileClientComponent";

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#20DDBB]"></div>
    </div>}>
      <ProfileClientComponent />
    </Suspense>
  );
}