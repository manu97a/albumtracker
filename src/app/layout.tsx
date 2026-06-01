// src/app/layout.tsx
import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'Álbum Tracker',
  description: 'Gestiona e intercambia tus cromos del Mundial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Envolvemos toda la app con nuestro proveedor de Google */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
