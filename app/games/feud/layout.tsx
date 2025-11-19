import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Family Feud | TRIVAI',
  description: 'Play Family Feud style trivia game',
};

export default function FeudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
