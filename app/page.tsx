import HomeLanding from '@/app/components/HomeLanding';
import { AppLanguageProvider } from '@/lib/app-language';

export default function Home() {
  return (
    <AppLanguageProvider>
      <HomeLanding />
    </AppLanguageProvider>
  );
}
