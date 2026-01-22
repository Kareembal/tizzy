import { useEffect, useRef } from "react";

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            contentRef.current?.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="about-section">
      <video 
        className="about-video" 
        autoPlay 
        muted 
        loop 
        playsInline
        src="/bluesky.webm"
      />
      <div className="about-overlay"></div>
      
      <div ref={contentRef} className="about-content">
        <h2>WHY TIZZY?</h2>
        
        <div className="about-grid">
          <div className="about-card">
            <div className="card-num">01</div>
            <h3>ACCOUNTABILITY</h3>
            <p>
              KOLs and influencers shape narratives in crypto. 
              Tizzy creates skin in the game — bet on whether their 
              reputation will suffer after controversial takes.
            </p>
          </div>
          
          <div className="about-card">
            <div className="card-num">02</div>
            <h3>POWERED BY ETHOS</h3>
            <p>
              We use Ethos Network's onchain credibility scores — 
              built from peer reviews, staked vouches, and real reputation data. 
              No fake metrics.
            </p>
          </div>
          
          <div className="about-card">
            <div className="card-num">03</div>
            <h3>TRUSTLESS RESOLUTION</h3>
            <p>
              Markets resolve based on observable Ethos score changes. 
              Winners get paid automatically. No middlemen, no disputes.
            </p>
          </div>
        </div>
        
        <div className="about-cta">
          <p>THE FUTURE OF REPUTATION IS ONCHAIN</p>
        </div>
      </div>
    </section>
  );
}
