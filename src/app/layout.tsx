import { type Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

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
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden", // Hide the default Clerk footer
          footerText: "hidden", // Hide the "Secured by clerk" text
          footerActionText: "hidden", // Hide development mode text
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider defaultTheme="light" storageKey="avichal-theme">
            <QueryProvider>
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
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
