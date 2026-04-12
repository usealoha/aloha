import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  ArrowRight, 
  Sparkles, 
  Leaf, 
  PenTool, 
  Coffee, 
  Users, 
  UserPlus,
  Smile,
  Camera,
  Globe,
  Music2,
  AtSign,
  Anchor,
  Wind,
  Scroll,
  Zap,
  ArrowUpRight,
  Clock,
  Layers,
  Activity,
  ShieldCheck,
  MousePointer2
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/30 selection:text-foreground overflow-x-hidden">
      {/* 00. Studio Navigation */}
      <nav className="h-32 px-12 flex items-center justify-between max-w-[1600px] mx-auto relative z-50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <div className="w-14 h-14 bg-foreground rounded-[20%_40%_30%_50%] flex items-center justify-center text-background transform transition-transform group-hover:rotate-12 duration-500 shadow-tactile">
              <Anchor className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-20 h-1 bg-primary/20 rotate-[-2deg] rounded-full" />
          </div>
          <span className="font-display text-4xl font-black tracking-tight ink-bleed">Aloha.</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-12">
           {["The Composer", "The Timeline", "The Matrix", "The Garden"].map((item, i) => (
              <a key={item} href={`#${item.toLowerCase().replace("the ", "")}`} className="relative text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground transition-all group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
           ))}
        </div>

        <Link href="/auth/signin" className="button-handcrafted ink-bleed py-3 text-sm">
          Initialize Studio
        </Link>
      </nav>

      {/* 01. Hero: The Manifesto of Intention */}
      <header className="px-12 pt-12 pb-40 max-w-[1600px] mx-auto relative border-b border-border/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          
          <div className="lg:col-span-7 space-y-12 relative z-10">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-muted border border-border/50 rounded-sm text-[10px] font-black uppercase tracking-[0.4em] shadow-sm transform -rotate-1 self-start">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              Strategic Growth Engine // v4.2.0
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-display font-black leading-[0.8] tracking-tight ink-bleed">
              Presence <br />
              <span className="relative">
                Orchestrated
                <svg className="absolute -bottom-6 left-0 w-full h-8 text-primary/20 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 10 C 20 0, 40 20, 60 10 C 80 0, 100 20, 100 10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl font-medium text-muted-foreground max-w-2xl leading-tight italic">
              Stop shouting into the void. Aloha helps you plan, automate, and grow your digital sanctuary with calm authority.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-10 pt-4">
              <Link href="/auth/signin" className="button-handcrafted py-8 px-16 text-xl w-full sm:w-auto rounded-none group">
                Begin Your Journey
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 group cursor-default">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center font-black text-[10px]">0{i}</div>
                    ))}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined by 12k+ creators</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            {/* The "Field Notes" Visual Stack */}
            <div className="relative aspect-[1/1] w-full">
               <div className="absolute inset-0 bg-accent rounded-sm border border-border shadow-tactile transform rotate-3" />
               <div className="absolute inset-0 bg-foreground text-background p-12 flex flex-col justify-between transform -rotate-2 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                     <Zap className="w-40 h-40 fill-current" />
                  </div>
                  <div className="space-y-6 relative z-10">
                     <div className="text-[10px] font-mono tracking-[0.5em] opacity-50">SYNC_PROTOCOL_ACTIVE</div>
                     <h3 className="text-5xl font-display font-black leading-[0.9]">Autonomous <br /> Delivery.</h3>
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                     <div className="space-y-2">
                        <div className="flex gap-2">
                           <div className="w-2 h-2 bg-primary" />
                           <div className="w-2 h-2 bg-primary/40" />
                           <div className="w-2 h-2 bg-primary/20" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest">Global Network Link</div>
                     </div>
                     <Smile className="w-12 h-12 text-primary" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* 02. The Composer: Crafting the Narrative (Buffer Principle: Ease of Creation) */}
      <section id="composer" className="py-40 px-12 max-w-[1600px] mx-auto border-b border-border/50 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
            <PenTool className="w-[30vw] h-[30vw]" />
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="relative">
               {/* Tactile UI Mockup */}
               <div className="bg-background border-2 border-foreground rounded-sm p-1 shadow-tactile relative rotate-[-1deg]">
                  <div className="bg-muted p-8 space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                     </div>
                     <div className="space-y-4">
                        <div className="h-4 w-3/4 bg-foreground/10 rounded-full" />
                        <div className="h-4 w-full bg-foreground/10 rounded-full" />
                        <div className="h-4 w-5/6 bg-foreground/10 rounded-full" />
                     </div>
                     <div className="pt-8 flex justify-between items-center">
                        <div className="flex gap-2">
                           <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20" />
                           <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/20" />
                        </div>
                        <div className="px-6 py-2 bg-primary text-background text-[10px] font-black uppercase tracking-widest shadow-md">Magic Refine</div>
                     </div>
                  </div>
               </div>
               {/* Taped-on note */}
               <div className="absolute -bottom-10 -right-10 bg-accent text-accent-foreground p-8 w-64 shadow-2xl rotate-3 space-y-4 border border-accent-foreground/10">
                  <Sparkles className="w-6 h-6" />
                  <p className="text-sm font-bold leading-tight italic">&ldquo;Our AI helps your unique voice bloom, it doesn't replace it.&rdquo;</p>
               </div>
            </div>

            <div className="space-y-10">
               <span className="text-primary font-mono text-sm tracking-[0.5em] uppercase">Phase I // The Composer</span>
               <h2 className="text-6xl md:text-8xl font-display font-black tracking-tighter leading-none">Distraction-Free <br /> <span className="text-secondary italic">Creation.</span></h2>
               <p className="text-xl text-muted-foreground leading-relaxed">
                  A focused writing studio designed for deep work. Multi-platform previews let you see how your story looks in every corner of the world before you hit transmit.
               </p>
               <ul className="space-y-6">
                  {[
                    { icon: Sparkles, text: "Magic Refine AI for tonal alignment" },
                    { icon: Globe, text: "Cross-platform visual synchronization" },
                    { icon: ShieldCheck, text: "Encrypted draft preservation" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-6 group">
                       <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <item.icon className="w-5 h-5 text-primary" />
                       </div>
                       <span className="font-bold text-lg">{item.text}</span>
                    </li>
                  ))}
               </ul>
            </div>
         </div>
      </section>

      {/* 03. The Timeline: Temporal Authority (Buffer Principle: The Queue) */}
      <section id="timeline" className="py-40 bg-muted relative overflow-hidden">
         <div className="max-w-[1600px] mx-auto px-12 grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5 space-y-10">
               <span className="text-secondary font-mono text-sm tracking-[0.5em] uppercase">Phase II // The Timeline</span>
               <h2 className="text-6xl md:text-8xl font-display font-black tracking-tighter leading-none italic text-foreground">Plan the <br /> <span className="text-primary">Presence.</span></h2>
               <p className="text-xl text-muted-foreground leading-relaxed">
                  Don't post and ghost. Aloha's Studio Timeline allows you to map your strategy weeks in advance, ensuring a consistent pulse without the constant pressure.
               </p>
               <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="space-y-2">
                     <div className="text-4xl font-display font-black">99.9%</div>
                     <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Sync Reliability</div>
                  </div>
                  <div className="space-y-2">
                     <div className="text-4xl font-display font-black">24/7</div>
                     <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Autonomous Queue</div>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-7 relative">
               {/* The "Timeline" visual - Layered Cards */}
               <div className="relative space-y-4">
                  {[
                    { label: "Instagram", color: "bg-primary", rot: "-1deg" },
                    { label: "LinkedIn", color: "bg-secondary", rot: "1deg" },
                    { label: "X / Twitter", color: "bg-accent", rot: "-0.5deg" }
                  ].map((card, i) => (
                    <div key={i} className={cn("p-8 bg-background border border-border shadow-tactile flex items-center justify-between group hover:-translate-y-1 transition-all duration-500", i===1 && "ml-12", i===2 && "ml-24")} style={{ transform: `rotate(${card.rot})` }}>
                       <div className="flex items-center gap-6">
                          <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center text-background", card.color)}>
                             <Clock className="w-6 h-6" />
                          </div>
                          <div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Scheduled Transmission</div>
                             <div className="font-bold uppercase tracking-tight text-lg">{card.label} Sync</div>
                          </div>
                       </div>
                       <div className="text-[10px] font-mono font-bold text-primary">09:00 GMT</div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* 04. The Matrix: Recursive Growth (Kit Principle: Automations) */}
      <section id="matrix" className="py-40 px-12 max-w-[1600px] mx-auto border-b border-border/50">
         <div className="flex flex-col lg:flex-row gap-20 items-end mb-32">
            <div className="flex-1 space-y-10">
               <span className="text-accent font-mono text-sm tracking-[0.5em] uppercase">Phase III // The Matrix</span>
               <h2 className="text-6xl md:text-[10rem] font-display font-black tracking-tighter leading-[0.8] ink-bleed">Automate <br /> <span className="text-primary italic">Meaning.</span></h2>
            </div>
            <div className="max-w-md pb-4 text-right">
               <p className="text-xl text-muted-foreground leading-relaxed italic">
                  &ldquo;Nurture your audience while you sleep. Build recursive routines that convert casual observers into genuine community members.&rdquo;
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: "Subscriber Sync", 
                desc: "Welcome every new member with a handcrafted sequence that reflects your true voice.",
                icon: UserPlus,
                action: "Deploy Sequence"
              },
              { 
                title: "Logic Blueprints", 
                desc: "Visual workflow matrix to map complex journeys. Tag, segment, and route with absolute ease.",
                icon: Zap,
                action: "Design Matrix"
              },
              { 
                title: "Engagement Pulse", 
                desc: "Trigger notifications across Slack or Discord when strategic milestones are hit.",
                icon: Activity,
                action: "View Triggers"
              }
            ].map((card, i) => (
              <div key={i} className="p-12 border-2 border-foreground bg-background rounded-sm shadow-tactile space-y-10 hover:-translate-y-2 transition-all duration-500 group">
                 <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center border border-border group-hover:bg-foreground group-hover:text-background transition-colors">
                    <card.icon className="w-8 h-8" />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-display font-black italic">{card.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">{card.desc}</p>
                 </div>
                 <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-primary transition-colors">
                    {card.action}
                    <ArrowUpRight className="w-4 h-4" />
                 </button>
              </div>
            ))}
         </div>
      </section>

      {/* 05. The Garden: Your Digital Sanctuary (Kit Principle: Landing Pages) */}
      <section id="garden" className="py-40 bg-foreground text-background relative overflow-hidden">
         <div className="absolute inset-0 opacity-[0.03] bg-grid" />
         <div className="max-w-[1600px] mx-auto px-12 relative z-10 flex flex-col items-center text-center space-y-20">
            <div className="space-y-8 max-w-3xl">
               <div className="inline-block px-4 py-1.5 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.5em]">Phase IV // The Garden</div>
               <h2 className="text-6xl md:text-9xl font-display font-black leading-[0.9] tracking-tighter italic">Your Central <br /> <span className="text-transparent border-border [-webkit-text-stroke:1px_var(--background)]">Access Point.</span></h2>
               <p className="text-xl md:text-2xl font-medium opacity-70 leading-relaxed italic">
                  One terminal for everything you create. High-fidelity Link-in-Bio profiles that capture leads and integrate with your Matrix.
               </p>
            </div>

            <div className="w-full max-w-lg bg-background text-foreground p-1 shadow-2xl rounded-sm transform rotate-[-1deg]">
               <div className="bg-muted p-12 space-y-10">
                  <div className="w-24 h-24 rounded-full bg-accent mx-auto border-4 border-background shadow-xl" />
                  <div className="space-y-2">
                     <div className="text-2xl font-display font-black">Mission Control.</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-primary">Live Profile Preview</div>
                  </div>
                  <div className="space-y-3">
                     {[1,2,3].map(i => (
                        <div key={i} className="w-full h-14 border border-border bg-background flex items-center justify-center text-[10px] font-black uppercase tracking-widest opacity-50">Transmission Link 0{i}</div>
                     ))}
                  </div>
               </div>
            </div>

            <Link href="/auth/signin" className="button-handcrafted py-8 px-20 text-xl bg-primary text-background border-none hover:bg-primary/90">
               Claim Your URL
               <MousePointer2 className="w-6 h-6 animate-bounce" />
            </Link>
         </div>
      </section>

      {/* 06. Strategic Footer */}
      <footer className="bg-muted py-32 px-12 border-t border-border relative">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start gap-24">
            <div className="space-y-12 max-w-sm">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center text-background shadow-tactile">
                     <Anchor className="w-6 h-6" />
                  </div>
                  <span className="font-display text-3xl font-black italic ink-bleed">Aloha.</span>
               </div>
               <p className="text-lg font-medium leading-relaxed italic text-muted-foreground">
                  &ldquo;Growing an audience shouldn't feel like a war. It should feel like tending to a garden. Intentionally, calmly, and with soul.&rdquo;
               </p>
               <div className="flex gap-6">
                  {[Globe, Camera, Music2].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-background hover:border-primary transition-all duration-500">
                       <Icon className="w-4 h-4 text-muted-foreground group-hover:text-background" />
                    </a>
                  ))}
               </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
               {[
                 { title: "The Studio", links: ["Composer", "Timeline", "Matrix", "Garden"] },
                 { title: "Manifesto", links: ["Philosophy", "Growth", "Sustainability", "Community"] },
                 { title: "Support", links: ["Journal", "Blueprints", "Glossary", "Guestbook"] }
               ].map((group, i) => (
                 <div key={i} className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{group.title}</h4>
                    <ul className="space-y-4">
                       {group.links.map(link => (
                         <li key={link}>
                            <a href="#" className="text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors relative group">
                               {link}
                               <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                         </li>
                       ))}
                    </ul>
                 </div>
               ))}
            </div>
         </div>

         <div className="max-w-[1600px] mx-auto pt-24 mt-24 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
            <div>© 2026 ALOHA STRATEGIC OPERATIONS // ROOTED IN HONESTY</div>
            <div className="flex gap-12">
               <span>LAT: 21.3069° N</span>
               <span>LONG: 157.8583° W</span>
               <span>STUDIO_TRANSMISSION_v4.2</span>
            </div>
         </div>
      </footer >
    </div>
  );
}
