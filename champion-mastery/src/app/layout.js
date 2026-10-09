import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './globals.css';

export const metadata = {
  title: 'Champion Mastery · League Tools',
  description: 'Browse League of Legends champions, roles, stats and abilities. Data from Riot Data Dragon.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="main-container">{children}</main>
        <footer className="legal">
          League Tools isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or
          anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated
          properties are trademarks or registered trademarks of Riot Games, Inc.
        </footer>
      </body>
    </html>
  );
}
