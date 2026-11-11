import { useEffect, useState } from 'react';

export type Route = 'new' | 'tasks' | 'ais' | 'catalog' | 'settings' | 'welcome';

const ROUTES: Route[] = ['new', 'tasks', 'ais', 'catalog', 'settings', 'welcome'];

function read(): Route {
  const r = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Route;
  return ROUTES.includes(r) ? r : 'new';
}

export function go(route: Route) {
  window.location.hash = `/${route === 'new' ? '' : route}`;
  window.scrollTo({ top: 0 });
}

/** Hash routing keeps GitHub Pages happy: every URL serves index.html. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
