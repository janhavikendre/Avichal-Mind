import { type Metadata } from 'next';
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Avichal Mind - AI Mental Wellness for India',
  description: 'Private, AI-assisted mental wellness guidance tailored for Indian users. Get compassionate support through voice and text conversations.',
  keywords: 'mental health, AI therapy, wellness, India, counseling, mindfulness',
  authors: [{ name: 'Avichal Mind Team' }],
  openGraph: {
    title: 'Avichal Mind - AI Mental Wellness for India',
    description: 'Private, AI-assisted mental wellness guidance tailored for Indian users.',
    url: 'https://avichalmind.com',
    siteName: 'Avichal Mind',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avichal Mind - AI Mental Wellness for India',
    description: 'Private, AI-assisted mental wellness guidance tailored for Indian users.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <QueryProvider>
            <header className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Avichal Mind
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium px-6 py-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                      Get Started
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-10 h-10",
                        userButtonTrigger: "focus:shadow-none"
                      }
                    }}
                  />
                </SignedIn>
              </div>
            </header>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
