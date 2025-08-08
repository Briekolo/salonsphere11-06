import { use } from 'react';

export default function AccountLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const resolvedParams = use(params);
  
  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {children}
    </div>
  );
}