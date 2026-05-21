'use client';

import { useEffect, useRef } from 'react';
import './landing.css';

export default function Home() {
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );

    revealRefs.current.forEach((el) => {
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  const addRef = (el: HTMLElement | null) => {
    if (el) revealRefs.current.push(el);
  };

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">The Circle</div>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="/auth/login" className="btn-nav-ghost">Log in</a>
          <a href="/auth/signup" className="btn-nav-primary">Join free</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="ring ring-1"><div className="ring-dot"></div></div>
          <div className="ring ring-2"><div className="ring-dot"></div></div>
          <div className="ring ring-3"><div className="ring-dot"></div></div>
        </div>
        <div className="hero-inner">
          <div className="hero-label">The infrastructure for African art</div>
          <h1 className="hero-h1">Your art.<br /><em>Your income.</em><br />Your circle.</h1>
          <p className="hero-sub">The platform where artists get booked, get paid, get professional and build communities.</p>
          <div className="hero-ctas">
            <a href="/auth/signup" className="btn btn-primary">Join as an artist</a>
            <a href="#organiser" className="btn btn-secondary">I'm looking for talent</a>
          </div>
          <div className="hero-stats" >
            <div className="stat"><div className="stat-n">500+</div><div className="stat-l">Target artists</div></div>
            <div className="stat"><div className="stat-n">2k+</div><div className="stat-l">Target audiences </div></div>
            <div className="stat"><div className="stat-n">1000+</div><div className="stat-l">Target bookings</div></div>
          </div>
        </div>
      </section>

      {/* TWIN PROBLEMS */}
      <section className="split" id="organiser">
        <div className="split-label">Who it's for</div>
        <h2 className="split-heading">Two problems.<br />One circle.</h2>
        <div className="split-grid">

          {/* Artist card */}
          <div className="split-card split-card-artist">
            <div className="card-corner"></div>
            <div className="card-eyebrow">For Artists</div>
            <h3 className="card-headline">Get Professional<br /> <em>Get Paid!</em></h3>
            <p className="card-body-text">You have the talent. You have the track record. What you need is a professional home: one link that does the selling for you, and a payment system that actually protects you.</p>
            <ul className="card-features">
              <li><span className="check">✓</span> One link replaces your website, Linktree, and Portfolio</li>
              <li><span className="check">✓</span> Priced packages: Define your products and their worth</li>
              <li><span className="check">✓</span> Auto-generated contracts: Protect your payments and work</li>
              <li><span className="check">✓</span> Escrow: your money is safe before you even arrive</li>
              <li><span className="check">✓</span> YouTube, TikTok, Spotify: all in one portfolio</li>
            </ul>
            <a href="/auth/signup" className="btn btn-card-artist">Get my Circle profile →</a>
          </div>

          {/* Organiser card */}
          <div className="split-card split-card-org">
            <div className="card-corner"></div>
            <div className="card-eyebrow">For Organisers</div>
            <h3 className="card-headline">Find <em>vetted</em><br />talent. Fast.</h3>
            <p className="card-body-text">Stop asking around on WhatsApp. Browse artists with real portfolios, real packages, and real reviews from people who have already worked with them.</p>
            <ul className="card-features">
              <li><span className="check">✓</span> Filter by artform, budget, and availability</li>
              <li><span className="check">✓</span> See completed bookings and verified reviews</li>
              <li><span className="check">✓</span> Book with escrow: if they don't show, you're refunded</li>
              <li><span className="check">✓</span> Auto-generated contracts: Protect your payments and bookings</li>
              <li><span className="check">✓</span> From solo artists to full lineups: one platform</li>
            </ul>
            <a href="/auth/signup" className="btn btn-card-org">Find an artist →</a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="section-label">The flow</div>
          <h2 className="section-h">In three steps.</h2>
          <div className="steps">
            <div className="step reveal" ref={addRef}>
              <div className="step-n">01</div>
              <div className="step-title">Build your profile</div>
              <p className="step-desc">Add your details <br/> Connect YouTube, Spotify, TikTok. <br/> Add your packages, prices and upcoming events. <br/> Get one shareable link: thecircle.co/you.</p>
              <div className="step-arrow">→</div>
            </div>
            <div className="step reveal" ref={addRef}>
              <div className="step-n">02</div>
              <div className="step-title">Get booked safely</div>
              <p className="step-desc">A client books your package. You get notified. A contract auto-generates. They pay into escrow before you even show up.</p>
              <div className="step-arrow">→</div>
            </div>
            <div className="step reveal" ref={addRef}>
              <div className="step-n">03</div>
              <div className="step-title">Become a Professional</div>
              <p className="step-desc"> Get access to professional tools, opportunities and resources.</p>
            </div>
            {/* <div className="step reveal" ref={addRef}>
              <div className="step-n">04</div>
              <div className="step-title">Perform. Get paid.</div>
              <p className="step-desc">You perform. Both parties confirm. Your money releases: directly to your mobile money. No more "we'll see tomorrow".</p>
            </div> */}
          </div>
        </div>
      </section>

      {/* PROFILE PREVIEW */}
      <section className="preview">
        <div className="preview-grid">
          <div className="preview-text reveal" ref={addRef}>
            <div className="pill">Build your own website</div>
            <h2 className="preview-h">A profile link<br />that works  as hard<br />as you.</h2>
            <p className="preview-body">When you send someone your Circle link, they see your full professional profile: portfolio, packages, services and products, reviews, and a "Book" button. No friction. Just your art, presented properly.</p>
          </div>
          <div className="profile-mock reveal" ref={addRef}>
            <div className="mock-hero">
              <div className="mock-avatar"></div>
            </div>
            <div className="mock-body">
              <div className="mock-name">Benj</div>
              <div className="mock-sub">thecircle.co/benj &nbsp;·&nbsp; Kampala, UG</div>
              <div className="mock-tags">
                <span className="mock-tag">Poet</span>
                <span className="mock-tag">Spoken Word</span>
                <span className="mock-tag">Dancer</span>
              </div>
              <div className="mock-pkg">
                <span className="mock-pkg-name">30 minute Poetry Set</span>
                <span className="mock-pkg-price">UGX 100,000</span>
              </div>
              <div className="mock-pkg">
                <span className="mock-pkg-name">Corporate Opening Set</span>
                <span className="mock-pkg-price">UGX 350,000</span>
              </div>
              <div className="mock-pkg">
                <span className="mock-pkg-name">Training Students</span>
                <span className="mock-pkg-price">UGX 50,000/hour</span>
              </div>
              <div className="mock-pkg">
                <span className="mock-pkg-name">Open Mic</span>
                <span className="mock-pkg-price">2 free poems</span>
              </div>
              <a href="#signup" className="mock-btn">Book Benj</a>
              <div className="mock-no-auth">No account required to view this profile</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust">
        <div className="trust-inner">
          <h2 className="trust-h reveal" ref={addRef}>Built on trust.<br />Not promises.</h2>
          <p className="trust-sub reveal" ref={addRef}>Every booking on The Circle is protected. Every contract is auto-generated. Every payment is held until you confirm it's done.</p>
          <div className="trust-grid">
            <div className="trust-card reveal" ref={addRef}>
              <div className="trust-icon">🔒</div>
              <div className="trust-title">Escrow payments</div>
              <p className="trust-desc">Money is held by The Circle before the gig. Released only when both parties confirm. If the artist no-shows, you get a full refund.</p>
            </div>
            <div className="trust-card reveal" ref={addRef}>
              <div className="trust-icon">📄</div>
              <div className="trust-title">Auto-generated contracts</div>
              <p className="trust-desc">Every booking generates a pre-filled, legally sound contract. Both parties sign digitally before any money moves. No lawyers needed.</p>
            </div>
            <div className="trust-card reveal" ref={addRef}>
              <div className="trust-icon">⭐</div>
              <div className="trust-title">Verified reviews</div>
              <p className="trust-desc">Reviews are only left after a completed, paid booking. No fake stars. No unverified opinions. Real work, real feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-ring"></div>
        <div className="cta-inner">
          <h2 className="cta-h reveal" ref={addRef}>Your art<br />deserves a<br /><em>proper home.</em></h2>
          <p className="cta-sub reveal" ref={addRef}>Join the first 50 artists on The Circle. Build your profile, set your prices, and start getting booked: safely.</p>
          <div className="hero-ctas reveal" ref={addRef}>
            <a href="/auth/signup" className="btn btn-primary">Join as an artist — it's free</a>
            <a href="/auth/login" className="btn btn-secondary">Log in</a>
          </div>
          <p className="cta-note">Get Professional. Get Paid!</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">The Circle</div>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">For Artists</a>
          <a href="#">For Organisers</a>
          <a href="#">Privacy</a>
        </div>
        <div className="footer-copy">© 2026 The Circle</div>
      </footer>
    </>
  );
}
