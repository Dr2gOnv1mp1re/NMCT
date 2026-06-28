"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <SignUp forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
}
