'use client';

export default function DebugEnv() {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-xs">
      <h3 className="font-bold mb-2">Environment Variables:</h3>
      <pre className="whitespace-pre-wrap break-all">
        {JSON.stringify({
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
          NODE_ENV: process.env.NODE_ENV,
        }, null, 2)}
      </pre>
    </div>
  );
}