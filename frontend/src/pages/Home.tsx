import { usePrivy } from "@privy-io/react-auth";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { MarketsList } from "../components/MarketsList";
import { AboutSection } from "../components/AboutSection";

export function Home() {
  const { authenticated } = usePrivy();
  
  return (
    <>
      <Header />
      {authenticated ? (
        <MarketsList />
      ) : (
        <>
          <HeroSection />
          <AboutSection />
        </>
      )}
    </>
  );
}
