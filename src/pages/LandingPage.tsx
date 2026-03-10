
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Shield, 
  Smartphone, 
  QrCode, 
  Calendar,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Zap,
  Lock,
  Heart,
  Check
} from 'lucide-react';
import LandingNavigation from '@/components/layout/LandingNavigation';
import LandingFooter from '@/components/layout/LandingFooter';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavigation />

      {/* ━━━ HERO SECTION ━━━ */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl mb-8">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-indigo-700 text-sm font-black uppercase tracking-wider">The Future of Child Safety</span>
            </div>
            
            <h1 className="text-6xl xl:text-7xl font-black text-slate-900 leading-[1.05] mb-8">
              Protect Every <br />
              <span className="text-indigo-600 italic">Child, </span> 
              Every Day.
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-medium">
              Transform your childcare center with a contactless, secure, and delightful check-in experience. Built for peace of mind.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/parent-registration">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 flex items-center transition-all hover:scale-105 active:scale-95">
                  Start Monitoring Free
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="h-16 px-8 rounded-2xl font-black text-lg text-slate-900 border-2 border-slate-100 hover:border-indigo-600 transition-all">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black">
                  +2k
                </div>
              </div>
              <p className="text-sm text-slate-500 font-bold">
                Trusted by 2,000+ childcare providers
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] rounded-full" />
            <img 
              src="/artifacts/kiddochecker_hero_3d_illustration_1773112260444.png" 
              alt="KiddoChecker Interface" 
              className="relative z-10 w-full drop-shadow-2xl rounded-[3rem]"
            />
            {/* Floating Achievement Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl z-20 border border-slate-50 flex items-center gap-4 animate-bounce-slow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                <ShieldCheck className="text-white h-7 w-7" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-black uppercase">Safety Status</p>
                <p className="text-slate-900 font-black">100% Secured</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ TRUST BAR ━━━ */}
      <div className="bg-slate-50/50 py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <p className="w-full text-center text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-4 md:mb-0">Securely Integrated With</p>
          <div className="flex items-center gap-2 text-xl font-black text-slate-900"><Shield className="h-6 w-6 text-indigo-600" /> SUPABASE</div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-900"><Lock className="h-6 w-6 text-indigo-600" /> STRIPE</div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-900"><Zap className="h-6 w-6 text-indigo-600" /> RESEND</div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-900"><Check className="h-6 w-6 text-indigo-600" /> COPPA</div>
        </div>
      </div>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything you need, nothing you don't.</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Simple but powerful tools designed to keep your kids safe and your staff organized.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={QrCode}
              color="indigo"
              title="Touchless Check-in"
              desc="Parents scan a single QR code on a kiosk. No shared screens, no germs, no lines."
            />
            <FeatureCard 
              icon={Clock}
              color="emerald"
              title="Real-time Feed"
              desc="Instantly see who's in or out. Track every interaction and notification with precision."
            />
            <FeatureCard 
              icon={Users}
              color="orange"
              title="Smart Classrooms"
              desc="Automatic age-based grouping. Teachers see only the kids assigned to them."
            />
          </div>
        </div>
      </section>

      {/* ━━━ SECONDARY HERO (SECURITY) ━━━ */}
      <section id="security" className="py-24 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[150px]" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8">
              Bank-grade security. <br />
              <span className="text-indigo-400">Total peace of mind.</span>
            </h2>
            <ul className="space-y-6">
              {[
                { t: '256-bit AES Encryption', d: 'Your data is encrypted at rest and in transit.' },
                { t: 'SOC 2 Type II Ready', d: 'Built following the highest industry standards.' },
                { t: 'Family Privacy First', d: 'Only authorized staff see sensitive medical notes.' }
              ].map(f => (
                <li key={f.t} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{f.t}</h4>
                    <p className="text-slate-400">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-700 rounded-full w-3/4" />
              <div className="h-4 bg-slate-700 rounded-full w-1/2" />
              <div className="h-20 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center border-dashed">
                <Shield className="h-10 w-10 text-indigo-500 opacity-50" />
              </div>
              <div className="h-4 bg-slate-700 rounded-full w-2/3" />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-10 leading-[1.1]">Join the safest <br /> network today.</h2>
          <p className="text-2xl text-slate-500 mb-14 font-medium">No credit card. No contracts. Just safety.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/parent-registration">
              <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xl shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1">
                Let's Go
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-10 hover:shadow-2xl hover:shadow-indigo-100 transition-all group border-t-4 border-transparent hover:border-indigo-600">
      <CardContent className="p-0">
        <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform", colors[color])}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
};

export default LandingPage;
