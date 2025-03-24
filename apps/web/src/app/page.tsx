'use client'

import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
import Link from 'next/link'
import Image from 'next/image'
import { Dashboard } from '@/routes'
import { 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Code, 
  Globe, 
  HeartHandshake, 
  LineChart, 
  Kanban, 
  Users2, 
  Zap, 
  Star 
} from 'lucide-react'

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Hero Section - Enhanced with visual effects */}
            <section className="relative overflow-hidden border-b border-border/40">
                {/* Background elements */}
                <div className="absolute inset-0 bg-grid-small-black/[0.2] -z-10" />
                <div className="absolute inset-0 flex items-center justify-center -z-10">
                    <div className="w-full h-full max-w-7xl mx-auto">
                        <div className="absolute right-0 top-1/4 w-56 h-56 bg-primary/20 rounded-full blur-3xl" />
                        <div className="absolute left-20 bottom-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
                    </div>
                </div>
                
                <div className="flex flex-col items-center justify-center px-4 py-28 md:py-36 max-w-7xl mx-auto">
                    <div className="mb-2">
                        <Badge variant="outline" className="px-4 py-1 backdrop-blur-sm bg-background/60 border-primary/20">
                            ✨ New features available
                        </Badge>
                    </div>
                    
                    <h1 className="text-center mb-5 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground">
                        Project Management{' '}<br className="sm:hidden" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Refined & Simplified
                        </span>
                    </h1>
                    
                    <p className="text-muted-foreground mb-8 max-w-3xl text-center text-lg sm:text-xl md:text-2xl">
                        Streamline your team&apos;s workflow with our intuitive
                        project and ticket management system.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="rounded-full px-8 group">
                            <Link href={Dashboard()} className="flex items-center gap-2">
                                Get Started
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild className="rounded-full px-8">
                            <a href="#features">Learn More</a>
                        </Button>
                    </div>
                    
                    <div className="relative mt-16 w-full max-w-5xl">
                        <div className="overflow-hidden rounded-xl border shadow-xl relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                            <Image
                                src="/public/placeholder.svg"
                                alt="Dashboard Preview"
                                width={1200}
                                height={700}
                                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                        </div>
                        
                        {/* Floating badges */}
                        <div className="absolute -right-4 top-1/4 bg-background rounded-lg shadow-lg border p-2 hidden md:flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium">Real-time updates</span>
                        </div>
                        
                        <div className="absolute -left-4 bottom-1/4 bg-background rounded-lg shadow-lg border p-2 hidden md:flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Track progress</span>
                        </div>
                    </div>
                    
                    {/* Stats row */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                        {[
                            { label: "Teams", value: "2,500+" },
                            { label: "Projects", value: "40,000+" },
                            { label: "Tasks Completed", value: "1M+" },
                            { label: "Satisfaction", value: "99.8%" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-4">
                                <div className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Features Section - With modern cards and icons */}
            <section id="features" className="px-4 py-24 bg-gradient-to-b from-background to-secondary/10">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 px-3 py-1 text-sm">
                            <Star className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                            Powerful Features
                        </Badge>
                        <h2 className="mb-4 text-3xl md:text-4xl font-bold">
                            Everything you need to manage projects
                        </h2>
                        <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
                            Our platform combines powerful tools with an intuitive interface
                            to make project management accessible to everyone.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Project Management",
                                description: "Create and manage projects with customizable workflows and priorities.",
                                icon: <Kanban className="h-7 w-7 text-blue-500" />
                            },
                            {
                                title: "Ticket Tracking",
                                description: "Efficiently track tickets from creation to completion with detailed history.",
                                icon: <LineChart className="h-7 w-7 text-indigo-500" />
                            },
                            {
                                title: "Team Collaboration",
                                description: "Collaborate seamlessly with your team through comments and assignments.",
                                icon: <Users2 className="h-7 w-7 text-violet-500" />
                            },
                            {
                                title: "Real-time Updates",
                                description: "Stay informed with instant notifications about project changes and activities.",
                                icon: <Zap className="h-7 w-7 text-amber-500" />
                            },
                            {
                                title: "Developer API",
                                description: "Integrate with your favorite tools and extend functionality with our API.",
                                icon: <Code className="h-7 w-7 text-emerald-500" />
                            },
                            {
                                title: "Global Access",
                                description: "Access your projects from anywhere with secure cloud-based storage.",
                                icon: <Globe className="h-7 w-7 text-sky-500" />
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="bg-card flex flex-col rounded-xl border p-6 transition-all duration-700 hover:shadow-md hover:-translate-y-1"
                            >
                                <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                                    {feature.icon}
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Testimonial Section - New section */}
            <section className="py-24 px-4 bg-secondary/20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 px-3 py-1">
                            <HeartHandshake className="h-3.5 w-3.5 mr-1 text-red-500" />
                            Testimonials
                        </Badge>
                        <h2 className="mb-4 text-3xl md:text-4xl font-bold">
                            Trusted by teams worldwide
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            See what our customers are saying about how our platform
                            has transformed their project management experience.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "This platform has completely transformed how our team collaborates on projects. The intuitive interface makes it easy for everyone to stay on track.",
                                author: "Sarah Johnson",
                                role: "Product Manager, TechCorp",
                                avatar: "SJ"
                            },
                            {
                                quote: "The ability to customize workflows to match our exact process has been a game changer. We've increased productivity by over 30% since adopting this tool.",
                                author: "Michael Chen",
                                role: "CTO, StartupX",
                                avatar: "MC"
                            },
                            {
                                quote: "The reporting features provide invaluable insights into our team's performance. It's helped us identify bottlenecks and optimize our development process.",
                                author: "Jessica Rivera",
                                role: "Scrum Master, EnterpriseY",
                                avatar: "JR"
                            }
                        ].map((testimonial, i) => (
                            <div 
                                key={i} 
                                className="bg-background rounded-xl p-6 shadow-sm border relative"
                            >
                                <div className="absolute -top-3 -left-1 text-5xl text-primary/20">"</div>
                                <div className="mb-6 pt-6">
                                    <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-medium">{testimonial.author}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* CTA Section - Enhanced with gradient and better positioning */}
            <section className="px-4 py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/30 dark:via-background dark:to-purple-950/30 -z-10" />
                <div className="absolute inset-0 bg-grid-small-black/[0.03] -z-10" />
                
                <div className="mx-auto max-w-4xl text-center relative">
                    <Badge variant="outline" className="mb-4 px-3 py-1">
                        <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                        Get Started Today
                    </Badge>
                    <h2 className="mb-4 text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
                        Ready to boost your team&apos;s productivity?
                    </h2>
                    <p className="text-muted-foreground mb-10 text-lg mx-auto max-w-2xl">
                        Join thousands of teams already using our platform to deliver
                        projects on time and exceed expectations.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild size="lg" className="rounded-full px-8 group">
                            <Link href="/auth/login" className="flex items-center gap-2">
                                Sign Up Now
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild className="rounded-full px-8">
                            <Link href="#">Schedule Demo</Link>
                        </Button>
                    </div>
                </div>
            </section>
            
            {/* Footer - Enhanced with better layout and branding */}
            <footer className="mt-auto border-t px-4 py-12">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-5">
                                <div className="gradient-icon mr-3 p-2 rounded-lg bg-primary/10">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-6 w-6"
                                    >
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#4F46E5" />
                                                <stop offset="100%" stopColor="#0EA5E9" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                                    </svg>
                                </div>
                                <span className="text-xl font-semibold">Jira Clone</span>
                            </div>
                            <p className="text-muted-foreground mb-4">
                                Project management for modern teams.
                            </p>
                            <div className="flex gap-4">
                                {['twitter', 'github', 'linkedin'].map((social) => (
                                    <a 
                                        key={social} 
                                        href="#" 
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={social}
                                    >
                                        <div className="h-8 w-8 rounded-full border flex items-center justify-center">
                                            {social === 'twitter' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-1-4.8 4-8 8-5.5 1.6 1 3 2.5 3.8 4.3C22.5 7 22 4 22 4z"></path></svg>
                                            )}
                                            {social === 'github' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                                            )}
                                            {social === 'linkedin' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2">
                                {['Features', 'Pricing', 'Integrations', 'Changelog', 'Documentation'].map((item) => (
                                    <li key={item}>
                                        <Link 
                                            href="#"
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                {['About', 'Blog', 'Careers', 'Press', 'Partners'].map((item) => (
                                    <li key={item}>
                                        <Link 
                                            href="#"
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                {['Terms', 'Privacy', 'Cookies', 'Licenses', 'Contact'].map((item) => (
                                    <li key={item}>
                                        <Link 
                                            href="#"
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Jira Clone. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground mt-4 md:mt-0">
                            Made with ❤️ using React & Next.js
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
