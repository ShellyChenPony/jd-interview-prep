import HomeLanding from '@/app/components/HomeLanding';
import FeedbackWidget from '@/app/components/FeedbackWidget';
import { AppLanguageProvider } from '@/lib/app-language';

export default function Home() {
  return (
    <AppLanguageProvider>
      <HomeLanding />
      <FeedbackWidget />
    </AppLanguageProvider>
  );
}
