/** A ~50-line History API router: <Link>, navigate(), useRoute() and path matching. */
import { createContext, useContext, useEffect, useState } from "react";

const RouteCtx = createContext({ path: "/", query: new URLSearchParams() });

export function navigate(to, { replace = false } = {}) {
  if (to === location.pathname + location.search) return;
  history[replace ? "replaceState" : "pushState"]({}, "", to);
  dispatchEvent(new Event("fs:navigate"));
}

export function RouterProvider({ children }) {
  const read = () => ({ path: location.pathname, query: new URLSearchParams(location.search) });
  const [route, setRoute] = useState(read);
  useEffect(() => {
    let section = location.pathname.split("/")[1];
    const update = () => {
      setRoute(read());
      // Only reset scroll when moving to a different page (not when opening /menu/:dish).
      const next = location.pathname.split("/")[1];
      if (next !== section) window.scrollTo({ top: 0, behavior: "instant" });
      section = next;
    };
    addEventListener("popstate", update);
    addEventListener("fs:navigate", update);
    // Children's effects run before ours, so a redirect may already have happened.
    setRoute((r) => (r.path === location.pathname && r.query.toString() === location.search.slice(1) ? r : read()));
    return () => {
      removeEventListener("popstate", update);
      removeEventListener("fs:navigate", update);
    };
  }, []);
  return <RouteCtx.Provider value={route}>{children}</RouteCtx.Provider>;
}

export const useRoute = () => useContext(RouteCtx);

/** match("/orders/:id", "/orders/abc") → { id: "abc" } | null */
export function match(pattern, path) {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
  const m = re.exec(path);
  if (!m) return null;
  return Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
}

export function Link({ to, children, onClick, className, activeClass, exact, ...rest }) {
  const { path } = useRoute();
  const active = exact ? path === to : path === to || path.startsWith(to + "/");
  const cls = [className, activeClass && active ? activeClass : ""].filter(Boolean).join(" ");
  return (
    <a
      href={to}
      className={cls || undefined}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
