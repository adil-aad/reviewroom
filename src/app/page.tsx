import Link from "next/link";

export default function HomePage() {
  return (
    <main id="main-content" className="page">
      <section className="intro" aria-labelledby="home-heading">
        <h1 id="home-heading">Give good work a clear next step.</h1>
        <p className="lead">
          A shared place for freelancers and clients to review work, gather
          feedback, and agree on what comes next.
        </p>
        <Link href="/projects" className="button">
          View projects
        </Link>
      </section>

      <section className="workflow" aria-labelledby="workflow-heading">
        <h2 id="workflow-heading">From first look to final approval</h2>
        <ol>
          <li>
            <h3>Share your work</h3>
            <p>Give your client one place to find the latest version.</p>
          </li>
          <li>
            <h3>Collect feedback</h3>
            <p>Keep comments with the work they refer to.</p>
          </li>
          <li>
            <h3>Get a clear decision</h3>
            <p>Know what needs another pass and what is approved.</p>
          </li>
        </ol>
      </section>
    </main>
  );
}
