import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Quote,
  Calculator,
  Search,
  FileCheck,
  MessageSquare,
  ListOrdered,
  Image,
  Clock,
  Shield,
  Database,
  Zap,
  ChevronDown,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';

// Publishing partner logos as text (professional presentation)
const journalClients = [
  { name: 'Oxford University Press', abbr: 'OUP' },
  { name: 'Lippincott Williams & Wilkins', abbr: 'LWW' },
  { name: 'PLOS', abbr: 'PLOS' },
  { name: 'Brill', abbr: 'Brill' },
  { name: 'Intellect', abbr: 'Intellect' },
  { name: 'American Chemical Society', abbr: 'ACS' },
  { name: 'American Psychological Association', abbr: 'APA' },
  { name: 'Medknow', abbr: 'Medknow' }
];

const bookClients = [
  { name: 'Taylor & Francis Books', abbr: 'T&F Books' },
  { name: 'Oxford Handbooks Online', abbr: 'OHO Book' },
  { name: 'Oxford University Press Books', abbr: 'OUP Book' }
];

const features = [
  {
    icon: Calculator,
    title: 'Mathematical Content Editing',
    description: 'Professional equation editing with Math Live and Wiris integration for standardized MathML output.',
    items: ['Math Live real-time editing', 'Wiris integration', 'Complex STEM expressions']
  },
  {
    icon: Search,
    title: 'Web Spell Check',
    description: 'Real-time spell validation reduces revision cycles and maintains editorial consistency.',
    items: ['Real-time validation', 'Error highlighting', 'Consistency checks']
  },
  {
    icon: FileCheck,
    title: 'Gray Proof PDF Generation',
    description: 'Instant PDF previews reflecting final layout and formatting for accurate review.',
    items: ['Instant generation', 'Accurate layout reflection', 'Contextual review']
  },
  {
    icon: MessageSquare,
    title: 'Query Answering System',
    description: 'Structured communication connecting authors with editorial teams.',
    items: ['Centralized query tracking', 'Threaded responses', 'Automated notifications']
  },
  {
    icon: ListOrdered,
    title: 'Reference Management',
    description: 'Comprehensive DOI-based reference handling with automatic styling.',
    items: ['DOI auto-fetch', 'APA, CMS, CMS-18 styles', 'Auto renumbering']
  },
  {
    icon: Image,
    title: 'Image Annotation',
    description: 'Visual markup tools for figures, charts, and illustrations.',
    items: ['Inline commenting', 'Graphical markup', 'High-resolution zoom']
  }
];

const workflowFeatures = [
  {
    role: 'Authors',
    description: 'Submit corrections, respond to queries, and approve final proofs within defined timeframes',
    icon: FileText
  },
  {
    role: 'Editors',
    description: 'Manage query workflows, verify corrections, and maintain editorial standards',
    icon: CheckCircle
  },
  {
    role: 'Production Teams',
    description: 'Monitor progress, generate outputs, and coordinate publication schedules',
    icon: Clock
  }
];

const benefits = [
  { icon: Database, title: 'XML-Native', description: 'Core architecture supports structured editorial production' },
  { icon: Shield, title: 'Quality Assurance', description: 'Automated validation reduces human error' },
  { icon: Zap, title: 'Multi-Client', description: 'Single platform supports multiple publisher clients' },
  { icon: BookOpen, title: 'Publishing Focused', description: 'Built specifically for academic publishing workflows' }
];

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className={`text-xl font-bold transition-colors ${
                isScrolled ? 'text-gray-900' : 'text-gray-900'
              }`}>
                IMPACT
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('publishing')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Publishing
              </button>
              <button onClick={() => scrollToSection('workflow')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Workflow
              </button>
              <button onClick={() => scrollToSection('why-impact')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Why IMPACT
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Contact
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-600/20">
                Request Demo
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-gray-600 py-2">Features</button>
              <button onClick={() => scrollToSection('publishing')} className="block w-full text-left text-gray-600 py-2">Publishing</button>
              <button onClick={() => scrollToSection('workflow')} className="block w-full text-left text-gray-600 py-2">Workflow</button>
              <button onClick={() => scrollToSection('why-impact')} className="block w-full text-left text-gray-600 py-2">Why IMPACT</button>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium mt-4">
                Request Demo
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/30 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>Enterprise Online Proofing System</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Professional Online Proofing for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Academic Publishing
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-6 font-light">
              Streamlined editorial workflows for journal and book publishers
            </p>

            {/* Description */}
            <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
              IMPACT is a purpose-built online proofing system designed for the demands of academic publishing. 
              It enables efficient collaboration between authors, editors, and production teams while maintaining 
              the precision required for scholarly content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-blue-600/25 flex items-center space-x-2">
                <span>Request a Demo</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="bg-white border-2 border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center space-x-2"
              >
                <span>Explore Features</span>
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: '10+', label: 'Publishing Partners' },
              { number: 'XML', label: 'Native Workflows' },
              { number: '24/7', label: 'Platform Access' },
              { number: '99.9%', label: 'Uptime SLA' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What IMPACT Does Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What IMPACT Does</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              IMPACT provides a centralized platform for managing the proofing stage of academic publications. 
              The system supports XML-based editorial workflows and handles complex content including mathematical 
              notation, multi-format references, and structured queries.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">XML-Based Workflows</h3>
                  <p className="text-gray-600 text-sm">Native support for structured editorial production with validated XML output.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Client Support</h3>
                  <p className="text-gray-600 text-sm">Manage high-volume output across multiple publisher clients with isolated workflows.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quality Control</h3>
                  <p className="text-gray-600 text-sm">Consistent quality control and streamlined production processes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Publishing Segments Section */}
      <section id="publishing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Publishing Segments</h2>
            <p className="text-lg text-gray-600">Supporting both journal and book publishing workflows</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Journal Publishing */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Journal Publishing</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                IMPACT supports journal publishers managing continuous publication workflows. 
                The system handles article proofing with features designed for rapid turnaround 
                times and multi-stage editorial review.
              </p>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Publishing partners include:</p>
                <div className="flex flex-wrap gap-2">
                  {journalClients.map((client, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-medium text-blue-700"
                      title={client.name}
                    >
                      {client.abbr}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Book Publishing */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
              <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Book Publishing</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                For book publishers, IMPACT manages chapter-based workflows and complex reference 
                structures typical of academic monographs and edited collections.
              </p>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Publishing partners include:</p>
                <div className="flex flex-wrap gap-2">
                  {bookClients.map((client, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700"
                      title={client.name}
                    >
                      {client.abbr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Feature Highlights</h2>
            <p className="text-lg text-gray-600">Comprehensive tools for academic content proofing</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all group"
              >
                <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-6 transition-colors">
                  <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration & Workflow */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Collaboration & Workflow</h2>
            <p className="text-lg text-gray-600">Coordinated multi-party editorial workflows</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {workflowFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.role}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Workflow Features */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Version Control</h4>
                  <p className="text-blue-100 text-sm">Complete change history with timestamps</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Real-Time Updates</h4>
                  <p className="text-blue-100 text-sm">Immediate synchronization across users</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Access Management</h4>
                  <p className="text-blue-100 text-sm">Role-based permissions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Time Tracking</h4>
                  <p className="text-blue-100 text-sm">Deadline management and alerts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why IMPACT */}
      <section id="why-impact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why IMPACT</h2>
            <p className="text-lg text-gray-600">Built specifically for academic publishing</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-16 bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200">
            <div className="max-w-4xl mx-auto text-center">
              <Quote className="w-12 h-12 text-blue-200 mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl text-gray-700 font-light italic mb-6 leading-relaxed">
                "IMPACT has streamlined our proofing workflow significantly. The XML-native architecture 
                and reference management tools have reduced our production time while maintaining 
                the quality standards our authors expect."
              </blockquote>
              <div className="text-gray-500">
                <p className="font-semibold text-gray-900">Production Manager</p>
                <p>Academic Publishing Partner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Streamline Your Proofing Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Contact us to discuss how IMPACT can support your editorial production requirements. 
            Our team works with publishing operations of varying scales and can provide workflow 
            consultation based on your specific content types and volume.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="group bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl flex items-center space-x-2">
              <span>Request a Demo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center space-x-2">
              <span>Contact Sales</span>
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">I</span>
                </div>
                <span className="text-xl font-bold text-white">IMPACT</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                Professional online proofing system designed for academic publishing workflows. 
                Supporting journal and book publishers with XML-based editorial production.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('workflow')} className="hover:text-white transition-colors">Workflow</button></li>
                <li><button onClick={() => scrollToSection('why-impact')} className="hover:text-white transition-colors">Why IMPACT</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Request Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2026 IMPACT Online Proofing System. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
