 import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
              footer: "hidden", // Hide Clerk footer
              footerText: "hidden", // Hide "Secured by clerk" text
              footerActionText: "hidden", // Hide development mode text
              cardContent: "pb-4", // Add padding bottom to make room for custom text
            },
            layout: {
              socialButtonsPlacement: "bottom",
            }
          }}
        />
        {/* Custom branding - better styled and positioned */}
        <div className="text-center mt-6 mb-2 text-xs text-gray-400 relative z-10">
          <p className="border-t border-gray-200 pt-4">Join Avichal Mind</p>
        </div>
      </div>
    </div>
  );
}
