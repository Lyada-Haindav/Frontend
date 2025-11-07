import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, FormInput, Zap, Shield, CheckCircle2, BarChart3, Share2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) navigate("/dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/30 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/30 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-indigo-300/20 to-blue-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <nav className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10 shadow-sm">
        <div className="container mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl shadow-blue-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FormInput className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                FormFlow AI
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Smart Form Builder</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hover:bg-blue-50 dark:hover:bg-blue-950/50">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 hover:border-purple-500/30 transition-all duration-300 shadow-lg shadow-blue-500/10">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">AI-Powered Form Builder</span>
          </div>
          
          <h2 className="text-6xl md:text-8xl font-black leading-[1.1] animate-slide-up tracking-tight">
            Build{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl">
                Smart Forms
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10C50 2 100 2 150 6C200 10 250 10 298 6" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#9333EA" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />
            <span className="text-slate-900 dark:text-white">in Seconds</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto animate-slide-up leading-relaxed font-medium" style={{ animationDelay: "0.1s" }}>
            Create beautiful, dynamic multi-step forms with AI assistance, voice input, and real-time validation. <span className="text-blue-600 font-semibold">No coding required.</span>
          </p>

          <div className="flex flex-wrap gap-5 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 text-lg px-8 py-6 h-auto">
              <Sparkles className="w-5 h-5" />
              Start Building Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/templates")} className="hover:scale-105 transition-all duration-300 text-lg px-8 py-6 h-auto border-2 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20">
              Browse Templates
            </Button>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-6 justify-center text-sm pt-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Free to get started</span>
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Unlimited forms</span>
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Free forever</span>
            </span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="group p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-blue-100 dark:border-blue-900/30 shadow-xl hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-3 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">AI Form Generation</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Describe your form in plain text or voice, and watch AI create it instantly with smart field types.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-purple-100 dark:border-purple-900/30 shadow-xl hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-3 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <FormInput className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Multi-Step Forms</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Create complex multi-step forms with progress tracking, validation, and beautiful UI components.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-indigo-100 dark:border-indigo-900/30 shadow-xl hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-3 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Shield className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Voice Input</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Every field supports voice input for faster, hands-free data entry with speech-to-text AI.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-emerald-100 dark:border-emerald-900/30 shadow-xl hover:shadow-2xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-3 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.7s" }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <BarChart3 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Real-time Analytics</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              View submissions in real-time, export to CSV or JSON, and analyze responses instantly.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-pink-100 dark:border-pink-900/30 shadow-xl hover:shadow-2xl hover:border-pink-300 dark:hover:border-pink-700 hover:-translate-y-3 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.8s" }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Share2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Easy Sharing</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Share forms via link or QR code. Publish publicly or keep private with access control.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-amber-100 dark:border-amber-900/30 shadow-xl hover:shadow-2xl hover:border-amber-300 dark:hover:border-amber-700 hover:-translate-y-3 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.9s" }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Sparkles className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Smart Templates</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Start with pre-built templates for surveys, registrations, feedback forms, and more.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 max-w-5xl mx-auto text-center space-y-8 p-16 rounded-[3rem] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl shadow-blue-500/40 animate-slide-up relative overflow-hidden" style={{ animationDelay: "1s" }}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Ready to build amazing forms?
            </h3>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who are already creating beautiful forms with FormFlow AI
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="mt-8 gap-3 bg-white text-blue-700 hover:bg-blue-50 shadow-2xl hover:shadow-white/30 hover:scale-110 transition-all duration-300 text-lg px-10 py-7 h-auto font-bold"
            >
              <Sparkles className="w-6 h-6" />
              Get Started Now - It's Free
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl mt-32 relative z-10 shadow-sm">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FormInput className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-700 via-purple-600 to-pink-600 bg-clip-text text-transparent">FormFlow AI</span>
                <p className="text-xs text-muted-foreground">Smart Form Builder</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              © 2024 FormFlow AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;