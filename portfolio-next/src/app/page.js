'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ExperienceSection from '@/components/ExperienceSection';
import SkillsSection from '@/components/SkillsSection';
import ProjectsSection from '@/components/ProjectsSection';
import ApproachSection from '@/components/ApproachSection';
import MetricsSection from '@/components/MetricsSection';
import AutomationSection from '@/components/AutomationSection';
import SaleValidationDashboard from '@/components/SaleValidationDashboard';
import ApiSection from '@/components/ApiSection';
import BugSection from '@/components/BugSection';
import ToolsEducationSection from '@/components/ToolsEducationSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import ResumeModal from '@/components/ResumeModal';

export default function Home() {
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const handleOpenResume = () => setIsResumeOpen(true);
  const handleCloseResume = () => setIsResumeOpen(false);

  return (
    <main>
      <Navbar onOpenResume={handleOpenResume} />
      <HeroSection onOpenResume={handleOpenResume} />
      <AboutSection />
      <ExperienceSection />
      <SkillsSection />
      <ProjectsSection />
      <ApproachSection />
      <MetricsSection />
      <AutomationSection />
      <SaleValidationDashboard />
      <ApiSection />
      <BugSection />
      <ToolsEducationSection />
      <ContactSection onOpenResume={handleOpenResume} />
      <Footer />
      <ResumeModal isOpen={isResumeOpen} onClose={handleCloseResume} />
    </main>
  );
}
