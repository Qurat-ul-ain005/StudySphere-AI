import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import AIAgents from "../components/AIAgents";
import WorkFlow from "../components/WorkFlow";
import DashboardPreview from "../components/DashboardPreview";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

function Home() {
    return (
        <>
            <Navbar />
            <Hero />
            <Features />
            <About />
            <AIAgents />
            <WorkFlow />
            <DashboardPreview />
            <CTA />
            <Footer />
        </>
    );
}

export default Home;