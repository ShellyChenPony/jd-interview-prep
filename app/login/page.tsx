import LoginScreen from '@/app/components/LoginScreen';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AppLanguageProvider } from '@/lib/app-language';

export default function LoginPage() {
  return (
    <AppLanguageProvider>
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    </AppLanguageProvider>
  );
}
