import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Catalog } from './pages/Catalog';
import { MyAIs } from './pages/MyAIs';
import { NewTask } from './pages/NewTask';
import { SettingsPage } from './pages/Settings';
import { Tasks } from './pages/Tasks';
import { Welcome } from './pages/Welcome';
import { useRoute } from './router';
import { useStore, type Theme } from './store';

function useTheme(theme: Theme) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

export default function App() {
  const route = useRoute();
  const theme = useStore((s) => s.settings.theme);
  const needsSetup = useStore((s) => s.accounts.length === 0);
  useTheme(theme);

  let page;
  if (route === 'welcome' || (needsSetup && route === 'new')) page = <Welcome />;
  else if (route === 'tasks') page = <Tasks />;
  else if (route === 'ais') page = <MyAIs />;
  else if (route === 'catalog') page = <Catalog />;
  else if (route === 'settings') page = <SettingsPage />;
  else page = <NewTask />;

  return (
    <Layout route={route}>
      <ErrorBoundary key={route}>{page}</ErrorBoundary>
    </Layout>
  );
}
