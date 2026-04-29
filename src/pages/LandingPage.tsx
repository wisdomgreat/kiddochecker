import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Shield, 
  ShieldCheck,
  ArrowRight,
  Lock,
  Check,
  Mail,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LandingNavigation from '@/components/layout/LandingNavigation';
import LandingFooter from '@/components/layout/LandingFooter';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      <LandingNavigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 border-b">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded text-primary text-xs font-bold uppercase tracking-wider">
              Safety Redefined
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Secure Childcare <br />
              <span className="text-primary">Management</span> Simplified.
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Experience the next generation of child safety with contactless check-ins, real-time alerts, and comprehensive staff management.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/parent-registration">
                <Button size="lg" className="h-12 px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-12 px-8">
                  Login to Portal
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-6">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Used by 2,000+ childcare providers nationwide
              </p>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <div className="bg-muted aspect-video rounded-lg border shadow-sm overflow-hidden p-8 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <ShieldCheck className="h-16 w-16 text-primary opacity-20" />
                <p className="text-muted-foreground text-sm font-medium">Interactive Demo Interface</p>
              </div>
            </div>
            {/* Simple status card */}
            <div className="absolute -bottom-4 -left-4 bg-card border p-4 rounded shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded border bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">System Status</p>
                <p className="text-sm font-bold">100% Operational</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="bg-muted/30 py-8 border-b">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
          <p className="w-full text-center text-muted-foreground font-bold uppercase tracking-widest text-[10px] mb-2 lg:mb-0 lg:w-auto lg:mr-8">Powered By</p>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground opacity-60 grayscale"><Shield className="h-4 w-4" /> SUPABASE</div>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground opacity-60 grayscale"><Lock className="h-4 w-4" /> STRIPE</div>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground opacity-60 grayscale"><Mail className="h-4 w-4" /> RESEND</div>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground opacity-60 grayscale"><Check className="h-4 w-4" /> COPPA COMPLIANT</div>
        </div>
      </div>

      {/* Features Overview */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Comprehensive Safety Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Modern management features built for speed, transparency, and most importantly, child protection.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={QrCode}
              title="Secure Check-in"
              desc="Parents utilize secure QR codes for touchless entries. Enhanced safety through identity verification."
            />
            <FeatureCard 
              icon={Clock}
              title="Live Monitoring"
              desc="Instant presence tracking for all children. View real-time logs and attendance status from any device."
            />
            <FeatureCard 
              icon={Users}
              title="Resource Planning"
              desc="Smart classroom allocation ensuring proper teacher-to-student ratios and medical note alerts."
            />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-muted/50 border-y">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              Enterprise Data Protection <br />
              <span className="text-primary">Standard Security Measures.</span>
            </h2>
            <div className="space-y-6">
              {[
                { t: 'End-to-End Encryption', d: 'Your institutional data is protected in transit and at rest using AES-256 standards.' },
                { t: 'Compliance Oriented', d: 'Designed to meet rigorous privacy standards including COPPA and SOC 2 requirements.' },
                { t: 'Restricted Access', d: 'Granular permissions ensure only authorized staff can access sensitive records.' }
              ].map(f => (
                <div key={f.t} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary mt-1">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{f.t}</h4>
                    <p className="text-sm text-muted-foreground">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border rounded p-8 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-border" />
            </div>
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-24 bg-primary/5 rounded border border-dashed flex flex-col items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-primary opacity-30" />
              <span className="text-[10px] text-primary/50 font-bold uppercase tracking-widest">Secure Environment</span>
            </div>
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-10">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Ready to modernize your operations?</h2>
          <p className="text-lg text-muted-foreground">Start protecting your community today with our intuitive safety platform.</p>
          <Link to="/parent-registration" className="inline-block">
            <Button size="lg" className="h-14 px-12 text-lg">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => {
  return (
    <Card className="border shadow-sm p-8 hover:bg-muted/30 transition-colors">
      <CardContent className="p-0 space-y-6">
        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LandingPage;

