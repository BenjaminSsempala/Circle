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
        <div className="nav-logo">Engero</div>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="/discover">Explore artists</a>
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
          <h1 className="hero-h1">Your story.<br />Your art.<br /><em>Your income.</em></h1>
          <p className="hero-sub">The Home for African Artists  <br /> Where Your Stories become opportunities.</p>
          <div className="hero-ctas">
            <a href="/auth/signup?type=artist" className="btn btn-primary">Join as an artist</a>
            <a href="/discover" className="btn btn-secondary">Find an artist</a>
          </div>
          <div className="hero-stats" >
            <div className="stat"><div className="stat-n">500+</div><div className="stat-l">Target artists</div></div>
            <div className="stat"><div className="stat-n">2k+</div><div className="stat-l">Target audiences </div></div>
            <div className="stat"><div className="stat-n">1000+</div><div className="stat-l">Target bookings</div></div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR — bridging line + cards */}
      <section className="split" id="organiser">
        <div className="split-label">Who it&apos;s for</div>
        <h2 className="split-heading">Two sides of the same story.</h2>
        <div className="split-grid">

          {/* Artist card */}
          <div className="split-card split-card-artist">
            <div className="card-corner"></div>
            <div className="card-eyebrow">For Artists</div>
            <h3 className="card-headline">Grow your Community.<br /><em>Get Paid.</em></h3>
            <p className="card-body-text">You make the Art. What you need is a professional home: one link that does the selling for you, and a payment proceedure that actually protects you.</p>
            <ul className="card-features">
              <li><span className="check">✓</span> <span>One link replaces your website, Linktree, and Portfolio</span></li>
              <li><span className="check">✓</span> <span><strong>Package your work:</strong> turn performances, workshops, and commissions into clear, priced offerings</span></li>
              <li><span className="check">✓</span> <span><strong>Get booked with confidence:</strong> a proper agreement is in place before you arrive</span></li>
              <li><span className="check">✓</span> <span>Auto-generated contracts: protect your work and your terms</span></li>
              <li><span className="check">✓</span> <span><strong>Get paid your way:</strong> no escrow, no middleman. Payment happens directly between you and your client, on the terms you both signed</span></li>
            </ul>
            <a href="/auth/signup" className="btn btn-card-artist">Get my Engero profile →</a>
          </div>

          {/* Organiser card */}
          <div className="split-card split-card-org">
            <div className="card-corner"></div>
            <div className="card-eyebrow">For Audiences and Organisers</div>
            <h3 className="card-headline">Connect with <em>Your</em><br />Artists.</h3>
            <p className="card-body-text">Stop asking around on WhatsApp. Browse artists with real portfolios, real packages, and real reviews from people who have already worked with them.</p>
            <ul className="card-features">
              <li><span className="check">✓</span> <span>Filter by artform, budget, and availability</span></li>
              <li><span className="check">✓</span> <span><strong>Discover with confidence:</strong> real portfolios, real packages, real reviews, no more asking around on WhatsApp</span></li>
              <li><span className="check">✓</span> <span>See completed bookings and verified reviews</span></li>
              <li><span className="check">✓</span> <span><strong>Book with a clear agreement:</strong> know exactly what&apos;s agreed, upfront, before any money moves</span></li>
              <li><span className="check">✓</span> <span>From solo artists to full lineups: one platform</span></li>
            </ul>
            <a href="/discover" className="btn btn-card-org">Browse artists now →</a>
          </div>
        </div>
      </section>

      {/* THE JOURNEY — horizontal snake */}
      <section className="journey" id="how">
        <div className="journey-inner">
          <div className="section-label">The journey</div>
          <h2 className="section-h">Every artist starts with a story.</h2>

          {/* Circular orbit layout — desktop */}
          <div className="journey-orbit-wrap">
            <div className="journey-orbit">
              {/* Ring + directional ticks */}
              <svg className="journey-orbit-svg" viewBox="0 0 680 680" aria-hidden="true">
                <circle cx="340" cy="340" r="248" fill="none" stroke="#c8d8d0" strokeWidth="2" strokeDasharray="7 7" />
                {/* Clockwise arrowheads at ~120° intervals */}
                <polygon points="588,303 596,320 580,318" fill="#a0b8b0" />
                <polygon points="182,528 168,520 183,512" fill="#a0b8b0" />
                <polygon points="498,528 512,520 497,512" fill="#a0b8b0" />
              </svg>

              {/* 6 nodes at 60° intervals starting from top */}
              {([
                { n:'01', title:'Build your identity',  desc:'Your story, your portfolio, your packages.', pct:[50,  3.3] },
                { n:'02', title:'Share your craft',      desc:'Showcase the work you\'re proud of.',        pct:[86.7,25]   },
                { n:'03', title:'Get discovered',        desc:'Be found by those looking for you.',         pct:[86.7,75]   },
                { n:'04', title:'Get booked',            desc:'A proper agreement before you arrive.',      pct:[50,  96.7] },
                { n:'05', title:'Get paid',              desc:'On terms you both agreed to upfront.',       pct:[13.3,75]   },
                { n:'06', title:'Grow your circle',      desc:'Build community with every booking.',        pct:[13.3,25]   },
              ] as { n: string; title: string; desc: string; pct: [number, number] }[]).map(({ n, title, desc, pct }) => (
                <div
                  key={n}
                  className="journey-node"
                  style={{ left: `${pct[0]}%`, top: `${pct[1]}%` }}
                >
                  <div className="jn-num">{n}</div>
                  <div className="jn-title">{title}</div>
                  <p className="jn-desc">{desc}</p>
                </div>
              ))}

              {/* Centre pulse */}
              <div className="journey-center" aria-hidden="true">
                <div className="journey-center-ring" />
              </div>
            </div>
          </div>

          {/* Mobile fallback: 2-col grid */}
          <div className="journey-mobile-grid">
            {[
              { n:'01', title:'Build your identity',  desc:'Create a professional home for your work: your story, your portfolio, your packages.' },
              { n:'02', title:'Share your craft',      desc:"Showcase performances, projects, and the work you're proud of."                      },
              { n:'03', title:'Get discovered',        desc:'Be found by audiences, organisers, and collaborators looking for exactly what you do.' },
              { n:'04', title:'Get booked',            desc:'Turn interest into a confirmed booking, backed by a proper agreement.'                 },
              { n:'05', title:'Get paid',              desc:'Earn from your creativity, on terms you both agreed to upfront.'                      },
              { n:'06', title:'Grow your circle',      desc:'Build a community around your work that grows with every booking.'                    },
            ].map(({ n, title, desc }) => (
              <div key={n} className="jm-step">
                <div className="jn-num">{n}</div>
                <div className="jn-title">{title}</div>
                <p className="jn-desc" style={{ fontSize: '13px', marginTop: '4px' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* PROFILE PREVIEW */}
      <section className="preview">
        <div className="preview-grid">
          <div className="preview-text reveal" ref={addRef}>
            <div className="pill">Build your own website</div>
            <h2 className="preview-h">A profile link<br />that works  as hard<br />as you.</h2>
            <p className="preview-body">When you send someone your Engero link, they see your full professional profile: portfolio, packages, services and products, reviews, and a &ldquo;Book&rdquo; button. No friction. Just your art, presented properly.</p>
          </div>
          <div className="profile-mock reveal" ref={addRef}>
            <div className="mock-hero">
              <div className="mock-avatar"></div>
            </div>
            <div className="mock-body">
              <div className="mock-name">Benj</div>
              <div className="mock-sub">engero.art/benj &nbsp;·&nbsp; Kampala, UG</div>
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
          <p className="trust-sub reveal" ref={addRef}>Every booking on Engero comes with a real agreement. Every contract is auto-generated. Every booking is tracked from request to completion.</p>
          <div className="trust-grid">
            <div className="trust-card reveal" ref={addRef}>
              <div className="trust-icon">📋</div>
              <div className="trust-title">Clear agreements</div>
              <p className="trust-desc">Every booking generates a proper agreement covering price, date, and terms. Print, sign, and you&apos;re both protected by what&apos;s in writing.</p>
            </div>
            <div className="trust-card reveal" ref={addRef}>
              <div className="trust-icon">📄</div>
              <div className="trust-title">Auto-generated contracts</div>
              <p className="trust-desc">Every booking generates a pre-filled, legally sound agreement. Both parties sign before the gig. No lawyers needed.</p>
            </div>
            <div className="trust-card reveal" ref={addRef}>
              <div className="trust-icon">⭐</div>
              <div className="trust-title">Verified reviews</div>
              <p className="trust-desc">Reviews are only left after a completed, paid booking. No fake stars. No unverified opinions. Real work, real feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOR AUDIENCES */}
      <section className="discover-nudge">
        <div className="discover-nudge-inner reveal" ref={addRef}>
          <div className="discover-nudge-text">
            <div className="pill" style={{ marginBottom: '12px' }}>Live on the platform</div>
            <h2 className="discover-nudge-h">Looking for<br />an artist?</h2>
            <p className="discover-nudge-sub">Find poets, musicians, dancers, storytellers, and creatives for corporate events, personal celebrations, schools, weddings, festivals, workshops, and community gatherings.</p>
            <p className="discover-nudge-closing">Browse real portfolios. Book with a proper agreement in place.</p>
            <a href="/discover" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-block' }}>Browse artists now →</a>
          </div>
          <div className="discover-nudge-cards">
            <div className="nudge-card nudge-card-1">
              <div className="nudge-avatar"></div>
              <div className="nudge-info">
                <div className="nudge-name">Kampala Poets</div>
                <div className="nudge-tag">Spoken Word · Poetry</div>
              </div>
              <div className="nudge-price">From UGX 100k</div>
            </div>
            <div className="nudge-card nudge-card-2">
              <div className="nudge-avatar"></div>
              <div className="nudge-info">
                <div className="nudge-name">Visual Artists</div>
                <div className="nudge-tag">Illustration · Design</div>
              </div>
              <div className="nudge-price">From UGX 150k</div>
            </div>
            <div className="nudge-card nudge-card-3">
              <div className="nudge-avatar"></div>
              <div className="nudge-info">
                <div className="nudge-name">Live Musicians</div>
                <div className="nudge-tag">Performance · Events</div>
              </div>
              <div className="nudge-price">From UGX 200k</div>
            </div>
            <a href="/discover" className="nudge-see-all">See all artists →</a>
          </div>
        </div>
      </section>

      {/* CIRCLE + OPPORTUNITIES — merged side by side */}
      <section className="circle-opp">
        <div className="circle-opp-rings" aria-hidden="true">
          <div className="acr acr-1" />
          <div className="acr acr-2" />
          <div className="acr acr-3" />
        </div>
        <div className="circle-opp-grid reveal" ref={addRef}>

          {/* Left (dominant): Every artist deserves a circle */}
          <div className="circle-opp-main">
            <h2 className="artist-circle-h">Every artist deserves a circle.</h2>
            <p className="artist-circle-body">Art grows in community. Build circles around your work, your cause, your audience, your collaborators.</p>
            <p className="artist-circle-body">Supporters can follow your journey, attend your events, and become part of your story.</p>
            <p className="artist-circle-closing">This becomes Your Circle</p>
          </div>

          {/* Divider */}
          <div className="circle-opp-divider" aria-hidden="true" />

          {/* Right (de-emphasised): Beyond bookings */}
          <div className="circle-opp-aside">
            <div className="opp-kicker">Beyond bookings</div>
            <h3 className="opp-aside-h">Your next opportunity is coming.</h3>
            <p className="opp-aside-body">Grants, festivals, open calls, residencies, and fellowships — so opportunity finds you, not the other way around.</p>
            <div className="opp-chips opp-chips-sm">
              <span className="opp-chip">Grants</span>
              <span className="opp-chip">Open Calls</span>
              <span className="opp-chip">Festivals</span>
              <span className="opp-chip">Residencies</span>
              <span className="opp-chip">Fellowships</span>
            </div>
            <p className="opp-soon">More on this soon.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-ring"></div>
        <div className="cta-inner">
          <h2 className="cta-h reveal" ref={addRef}>Your art<br />deserves a<br /><em>proper home.</em></h2>
          <p className="cta-sub reveal" ref={addRef}>Join the first 50 artists on Engero. Build your profile, set your prices, and start getting booked: safely.</p>
          <div className="hero-ctas reveal" ref={addRef}>
            <a href="/auth/signup" className="btn btn-primary">Join as an artist; it&apos;s free</a>
            <a href="/auth/login" className="btn btn-secondary">Log in</a>
          </div>
          <p className="cta-note">Build your Professional Identity! Grow your Community. Get Paid!</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">Engero</div>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">For Artists</a>
          <a href="#">For Organisers</a>
          <a href="#">Privacy</a>
        </div>
        <div className="footer-copy">© 2026 Engero</div>
      </footer>
    </>
  );
}
