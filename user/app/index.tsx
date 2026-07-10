import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    // Return null — the splash screen already covers this gap;
    // no need for a separate visible loading state here.
    return null;
  }

  if (!user) {
    return <Redirect href="/auth/welcome" />;
  }

  return <Redirect href="/(tabs)/Home" />;
}
