// File: frontend/components/layout/Footer.tsx
'use client'; // Although this component is simple, marking as client if it might have interactions later.
              // For a purely static footer, 'use client' might not be strictly necessary.

import Link from 'next/link';
import { Github } from 'lucide-react'; // Example icon

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/95 py-8 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto space-y-2 px-4 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} drinkyouroj. All rights reserved.
        </p>
        <p>
          Built with ❤️ by{' '}
          <Link
            href="https://github.com/drinkyouroj" // Replace with your GitHub profile
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Justin Hearn / drinkYourOJ
          </Link>
        </p>
        <div className="mt-2 flex items-center justify-center">
          <Link
            href="https://github.com/drinkyouroj/tubeinsight" // Replace with your project's GitHub repo
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View project on GitHub"
            className="text-muted-foreground hover:text-foreground"
          >
            <Github className="h-5 w-5" />
          </Link>
        </div>
        {/* You can add other footer links or information here */}
        {/* For example:
        <div className="mt-2 space-x-4">
          <Link href="/privacy-policy" legacyBehavior><a className="hover:underline">Privacy Policy</a></Link>
          <Link href="/terms-of-service" legacyBehavior><a className="hover:underline">Terms of Service</a></Link>
        </div>
        */}
      </div>
    </footer>
  );
}
