import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDown, ArrowRight, Check, Copy, Menu, X, Moon, Sun, Package, Trophy, GraduationCap, Briefcase, Plus, Minus } from 'lucide-react';
import { achievements, careerTimeline, companyProjects, expertiseAreas, fullName, genAiProjects, openSourcePackages, personalProjects, socialLinks, techStack } from '../constants';
import { Project, Theme } from '../types';
import portrait from '../assets/abhi.png';
import '../index.css';

const navigation = [
    { label: 'Work', href: '#projects' },
    { label: 'Open source', href: '#open-source' },
    { label: 'Journey', href: '#journey' },
    { label: 'Recognition', href: '#recognition' },
    { label: 'Expertise', href: '#expertise' },
];

const projectGroups = [
    { label: 'Professional work', projects: companyProjects },
    { label: 'Personal projects', projects: personalProjects },
    { label: 'AI experiments', projects: genAiProjects },
];

function WorkItem({ project, index }: { project: Project; index: number }) {
    const content = <>
        <div className={`work-image ${project.background || ''} ${project.route ? 'work-image-experiment' : ''}`}>
            <img src={project.logoUrl} alt={project.name} loading="lazy" />
            <span className="work-number">{String(index + 1).padStart(2, '0')}</span>
            {(project.link || project.route) && <span className="work-arrow"><ArrowUpRight size={22} /></span>}
        </div>
        <div className="work-caption">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <div className="tags">{project.technologies.map(technology => <span key={technology}>{technology}</span>)}</div>
        </div>
    </>;
    return <article className="work-item">
        {project.route ? <Link to={project.route} aria-label={`Open ${project.name}`}>{content}</Link>
            : project.link ? <a href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.name} (opens in new tab)`}>{content}</a>
                : content}
    </article>;
}

export default function PortfolioHome({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeGroup, setActiveGroup] = useState(0);
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
    const npmPackage = openSourcePackages[0];

    const copyInstall = async () => {
        try {
            await navigator.clipboard.writeText('npm install html-to-pdf-headless');
            setCopyState('copied');
        } catch {
            setCopyState('error');
        }
    };

    return <div className="portfolio" data-theme={theme}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
            <div className="page-width header-inner">
                <a className="wordmark" href="#hero" aria-label="Abhinay Sharma home">as<span>.</span></a>
                <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation" id="portfolio-navigation">
                    {navigation.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
                    <a className="mobile-contact" href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
                </nav>
                <div className="header-actions">
                    <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
                        {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
                    </button>
                    <a className="header-contact" href="#contact">Let's talk <ArrowUpRight size={17} /></a>
                    <button className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="portfolio-navigation" title={menuOpen ? 'Close navigation' : 'Open navigation'}>
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>
        </header>

        <main id="main-content">
            <section className="intro" id="hero" aria-labelledby="intro-title">
                <div className="intro-grid" aria-hidden="true" />
                <div className="portrait-field"><img src={portrait} alt="Abhinay Sharma" fetchPriority="high" /></div>
                <div className="page-width intro-content">
                    <p className="eyebrow"><span className="status-dot" /> Software Developer at iLead Analytics</p>
                    <h1 id="intro-title">Abhinay<br />Sharma<span>.</span></h1>
                    <p className="intro-description">Thoughtful interfaces.<br />Dependable backends.<br /><strong>Useful things, built well.</strong></p>
                    <div className="intro-actions">
                        <a className="primary-link" href="#projects">Explore my work <ArrowDown size={18} /></a>
                        <div>
                            <p className="eyebrow intro-social-label">Find me here</p>
                            <div className="intro-socials">
                                {socialLinks.map(social => <a key={social.id} className="icon-button" href={social.url} target={social.id === 'email' ? undefined : '_blank'} rel={social.id === 'email' ? undefined : 'noopener noreferrer'} aria-label={social.name} title={social.name}>
                                    <social.Icon size={20} />
                                </a>)}
                            </div>
                        </div>
                    </div>
                    <div className="intro-footnote"><span>Full-stack development</span><span>Cloud & infrastructure</span><span>AI-assisted workflows</span></div>
                </div>
                <div className="portrait-label"><span>Always building.</span><span>Always learning.</span></div>
            </section>

            <section className="stack-band" aria-label="Technology stack">
                <div className="page-width stack-inner"><span className="eyebrow">My everyday toolkit</span><div>{techStack.map(technology => <span key={technology.id}>{technology.name}</span>)}</div></div>
            </section>

            <section className="section page-width" id="projects" aria-labelledby="work-title">
                <div className="section-heading"><div><p className="eyebrow">01 / Selected work</p><h2 id="work-title">From idea to real life<span>.</span></h2></div><p>Products, platforms, and a few<br />experiments along the way.</p></div>
                <div className="project-tabs" role="tablist" aria-label="Project categories">{projectGroups.map((group, index) => <button key={group.label} type="button" role="tab" id={`project-tab-${index}`} aria-selected={activeGroup === index} aria-controls="project-panel" tabIndex={activeGroup === index ? 0 : -1} onClick={() => setActiveGroup(index)} onKeyDown={event => {
                    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
                        event.preventDefault();
                        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? projectGroups.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + projectGroups.length) % projectGroups.length;
                        setActiveGroup(nextIndex);
                        document.getElementById(`project-tab-${nextIndex}`)?.focus();
                    }
                }}>{group.label}<span>{String(group.projects.length).padStart(2, '0')}</span></button>)}</div>
                <div className="work-grid" id="project-panel" role="tabpanel" aria-labelledby={`project-tab-${activeGroup}`} tabIndex={0}>{projectGroups[activeGroup].projects.map((project, index) => <WorkItem key={project.id} project={project} index={index} />)}</div>
            </section>

            <section className="open-source-band" id="open-source" aria-labelledby="open-source-title">
                <div className="page-width open-source-inner">
                    <div className="open-source-intro"><p className="eyebrow">02 / Giving back</p><h2 id="open-source-title">Built to be<br />shared<span>.</span></h2><p>Small tools can make a real difference. This one's for the developer community.</p><span className="open-source-label"><Package size={17} /> Open-source npm package</span></div>
                    <div className="package-detail">
                        <div className="package-top"><img src={npmPackage.logoUrl} alt="npm" width="70" height="28" /><span>HTML / PDF / DOCX</span></div>
                        <h3>{npmPackage.name}</h3><p>{npmPackage.description}</p>
                        <div className="package-features"><span><Check size={16} /> No headless browser</span><span><Check size={16} /> PDF & Word documents</span><span><Check size={16} /> CSS style inlining</span></div>
                        <div className="install-command"><code>npm install html-to-pdf-headless</code><button className="icon-button" onClick={copyInstall} aria-label={copyState === 'copied' ? 'Install command copied' : 'Copy install command'} title={copyState === 'copied' ? 'Copied' : 'Copy install command'}>{copyState === 'copied' ? <Check size={18} /> : <Copy size={18} />}</button></div>
                        <span className="copy-status" role="status">{copyState === 'copied' ? 'Install command copied.' : copyState === 'error' ? 'Clipboard unavailable. Select the command to copy it.' : ''}</span>
                        <div className="package-links"><a href={npmPackage.link} target="_blank" rel="noopener noreferrer">Package & documentation <ArrowUpRight size={18} /></a><a href="https://github.com/abhinaysharma-devil/html-to-pdf-headless" target="_blank" rel="noopener noreferrer">Source code <ArrowUpRight size={18} /></a></div>
                    </div>
                </div>
            </section>

            <section className="section page-width journey-section" id="journey" aria-labelledby="journey-title">
                <div className="journey-intro"><p className="eyebrow">03 / The journey</p><h2 id="journey-title">Learning.<br />Building.<br />Growing<span>.</span></h2><p>From engineering classrooms to shipping software that people use.</p></div>
                <ol className="timeline">{careerTimeline.map(item => <li key={item.id}>
                    <div className="timeline-marker">{item.current ? <Briefcase size={20} /> : <GraduationCap size={20} />}</div>
                    <div className="timeline-date"><span>{item.period}</span>{item.current && <span className="current-label">Current</span>}</div>
                    <h3>{item.title}</h3><p className="timeline-organization">{item.organization}</p><p>{item.description}</p>
                </li>)}</ol>
            </section>

            <section className="recognition-band" id="recognition" aria-labelledby="recognition-title"><div className="page-width section">
                <div className="section-heading"><div><p className="eyebrow">04 / Recognition</p><h2 id="recognition-title">A little recognition.<br />A lot of gratitude<span>.</span></h2></div><Trophy className="section-symbol" size={46} strokeWidth={1.2} /></div>
                <div className="awards">{achievements.map(award => <a className="award-row" href={award.link} key={award.id} target="_blank" rel="noopener noreferrer" aria-label={`${award.title}, ${award.date}, ${award.organization} (opens on LinkedIn)`}>
                    <span className="award-icon"><Trophy size={24} strokeWidth={1.4} /></span><div><span className="eyebrow">{award.organization}</span><h3>{award.title}</h3></div><span className="award-date">{award.date}</span><ArrowUpRight className="award-arrow" size={24} />
                </a>)}</div>
            </div></section>

            <section className="section page-width" id="expertise" aria-labelledby="expertise-title">
                <div className="section-heading"><div><p className="eyebrow">05 / Core competencies</p><h2 id="expertise-title">The skills behind the work<span>.</span></h2></div><p>Across the stack.<br />Always evolving.</p></div>
                <div className="expertise-list">{expertiseAreas.map((area, index) => <details key={area.id} open={area.id === 'ai-assisted-development'}>
                    <summary><span className="expertise-number">{String(index + 1).padStart(2, '0')}</span><h3>{area.title}</h3><span className="expertise-toggle"><Plus className="expand-icon" size={22} /><Minus className="collapse-icon" size={22} /></span></summary>
                    <div className="expertise-body"><p>{area.description}</p><div className="tags">{area.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div>
                </details>)}</div>
            </section>
        </main>

        <footer className="contact-band" id="contact"><div className="page-width">
            <p className="eyebrow">Have something in mind?</p><div className="contact-heading"><h2>Let's make<br />something matter<span>.</span></h2><a href="mailto:panchalabhinay@gmail.com" className="contact-arrow" aria-label="Email Abhinay" title="Email Abhinay"><ArrowUpRight size={48} strokeWidth={1.3} /></a></div>
            <a className="email-link" href="mailto:panchalabhinay@gmail.com">panchalabhinay@gmail.com <ArrowRight size={20} /></a>
            <div className="footer-bottom"><span>&copy; {new Date().getFullYear()} {fullName}</span><div>{socialLinks.map(social => <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer">{social.name}<ArrowUpRight size={14} /></a>)}</div><a href="#hero">Back to top <ArrowUpRight size={14} /></a></div>
        </div></footer>
    </div>;
}