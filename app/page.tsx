import HomeLanding from '@/app/components/HomeLanding';
import { AuthProvider } from '@/lib/auth/auth-context';
import FeedbackWidget from '@/app/components/FeedbackWidget';
import { AppLanguageProvider } from '@/lib/app-language';

export default function Home() {
  return (
    <AppLanguageProvider>
      <AuthProvider>
        <HomeLanding />
        <FeedbackWidget />
      </AuthProvider>
    </AppLanguageProvider>
  );
}
