"use client"

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Capra<span>Starter</span>
          </h1>
          <p className="hero-sub">
            This project is being prepared for its next chapter.
            Brand kit generation has moved to{" "}
            <a href="https://caprabrand.com" style={{ color: "var(--accent)", textDecoration: "underline" }}>
              CapraBrand
            </a>.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://caprabrand.com" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px" }}>
              Go to CapraBrand
            </a>
            <a href="/login" className="btn btn-ghost" style={{ fontSize: 16, padding: "14px 28px" }}>
              Sign in
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
