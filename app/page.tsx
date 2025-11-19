"use client";
import { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Sprout, X, Heart, Flower } from 'lucide-react';

const motivations = [
  {
    id: 1,
    text: "Ehi, guarda quanta strada hai già fatto. Non mollare proprio ora! 🌿",
    image: "/giadi-determined.png", 
    color: "bg-emerald-100 border-emerald-200 text-emerald-800"
  },
  {
    id: 2,
    text: "Anche i fiori più belli hanno bisogno di tempo per sbocciare. Respira. 🌸",
    image: "/giadi-calm.png",
    color: "bg-pink-100 border-pink-200 text-pink-800"
  },
  {
    id: 3,
    text: "Sono la tua fan numero uno! Finiamo questo pezzetto e poi pausa? ✨",
    image: "/giadi-happy.png",
    color: "bg-violet-100 border-violet-200 text-violet-800"
  },
  {
    id: 4,
    text: "Il tuo giardino segreto sta crescendo, anche se non lo vedi subito. Fidati.",
    image: "/giadi-calm.png",
    color: "bg-sky-100 border-sky-200 text-sky-800"
  }
];

export default function SecretGarden() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'grow' | 'rest'>('grow');
  
  const [showCompanion, setShowCompanion] = useState(false);
  const [currentMotivation, setCurrentMotivation] = useState(motivations[0]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const summonGiadi = () => {
    const available = motivations.filter(m => m.id !== currentMotivation.id);
    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentMotivation(random);
    setShowCompanion(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-100 via-emerald-50 to-stone-100 font-sans">
      
      <div className="absolute top-0 left-0 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-md p-8 bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 mx-4 transition-all duration-500">
        
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-emerald-900 mb-1 tracking-wide">
            Secret Garden
          </h1>
          <p className="text-emerald-700/50 text-xs font-bold uppercase tracking-[0.2em]">
            {mode === 'grow' ? 'Coltiva la mente' : 'Raccogli le energie'}
          </p>
        </div>

        <div className="flex justify-center mb-12 scale-110">
          <div className="relative">
            <div className="text-7xl font-light text-emerald-900/90 tabular-nums tracking-tighter select-none">
              {formatTime(timeLeft)}
            </div>
            <Sprout className={`absolute -top-4 -right-6 text-emerald-400 w-8 h-8 transition-all duration-1000 ${isActive ? 'animate-bounce' : 'opacity-50'}`} />
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-10">
          <button 
            onClick={() => setIsActive(!isActive)}
            className="group w-20 h-20 flex items-center justify-center bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all active:scale-95"
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
          </button>
          
          <button 
            onClick={() => { setIsActive(false); setTimeLeft(mode === 'grow' ? 25*60 : 5*60); }}
            className="w-20 h-20 flex items-center justify-center bg-white text-emerald-700 border border-emerald-100 rounded-full hover:bg-emerald-50 hover:scale-105 transition-all shadow-sm"
          >
            <RefreshCw size={28} />
          </button>
        </div>

        <div className="flex bg-emerald-900/5 p-1.5 rounded-2xl mb-8">
          <button onClick={() => setMode('grow')} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'grow' ? 'bg-white shadow-sm text-emerald-800' : 'text-emerald-600/60 hover:text-emerald-800'}`}>Focus</button>
          <button onClick={() => setMode('rest')} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'rest' ? 'bg-white shadow-sm text-emerald-800' : 'text-emerald-600/60 hover:text-emerald-800'}`}>Relax</button>
        </div>

        <div className="text-center mt-4">
          <button 
            onClick={summonGiadi}
            className="group relative px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-400 rounded-full text-xs font-medium transition-all active:scale-95 border border-rose-100"
          >
            <span className="flex items-center gap-2 group-hover:text-rose-500 transition-colors">
              <Heart size={12} className="fill-current" /> 
              Giadi, non ce la faccio...
            </span>
          </button>
        </div>
      </div>
      {showCompanion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 duration-300 border border-white/50">
            
            <button 
              onClick={() => setShowCompanion(false)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center pt-4">
              <div className="w-28 h-28 mb-6 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-pink-100 to-rose-50 flex items-center justify-center">
                 <Flower size={48} className="text-rose-300" />
              </div>

              <div className={`p-5 rounded-2xl ${currentMotivation.color} relative w-full`}>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-inherit rotate-45"></div>
                <p className="font-medium relative z-10 font-serif leading-relaxed">
                  "{currentMotivation.text}"
                </p>
              </div>
              
              <button 
                onClick={() => setShowCompanion(false)}
                className="mt-8 text-xs font-bold tracking-widest text-gray-300 hover:text-emerald-600 uppercase transition-colors"
              >
                Torna al giardino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}