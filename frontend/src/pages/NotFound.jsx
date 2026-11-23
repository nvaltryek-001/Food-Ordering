import { Link } from "../lib/router.jsx";
import { Empty } from "../components/ui.jsx";

export default function NotFound() {
  return (
    <div className="container narrow">
      <Empty emoji="🥄" title="This page isn't on the menu" action={<Link to="/menu" className="btn btn-primary">Go to the menu</Link>}>
        The link may be old, or the page has moved.
      </Empty>
    </div>
  );
}
