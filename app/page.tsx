"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCcw, HandPlatter, X, Check, Volume2, VolumeX, Mail, Heart } from 'lucide-react';
import StudyGarden from './StudyGarden';

type Phase = 'focus' | 'rest';
type Motivation = { id: string; message: string; image: string; };

const motivations: Motivation[] = [
  { id: 'brother1', message: "Il tuo fratellone crede in te. Ho piena fiducia nel tuo genio!", image: '/giadi-happy.png' },
  { id: 'brother2', message: "Usa la tua testolina, sai fare tutto ciò che vuoi. Devi solo crederci.", image: '/giadi-determined.png' },
  { id: 'happy', message: "Sei fortissima! Non mollare proprio adesso!", image: '/giadi-happy.png' },
  { id: 'determined', message: "Fai una piccola pausa e riprendi. Io sono qui con te.", image: '/giadi-determined.png' },
  { id: 'calm', message: "Respira. Sei capace di cose grandi.", image: '/giadi-calm.png' },
];

export default function Home() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('focus');
  
  const [showMotivation, setShowMotivation] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  
  const [currentMotivation, setCurrentMotivation] = useState(motivations[0]);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/bell.mp3');
      audioRef.current.load();
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            if (audioEnabled && audioRef.current) audioRef.current.play();
            const nextPhase = phase === 'focus' ? 'rest' : 'focus';
            setPhase(nextPhase);
            setMinutes(nextPhase === 'focus' ? 25 : 5);
            setSeconds(0);
            setIsActive(true); 
          } else {
            setMinutes(prevMinutes => prevMinutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(prevSeconds => prevSeconds - 1);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds, phase, audioEnabled]);

  const triggerMotivation = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * motivations.length);
    setCurrentMotivation(motivations[randomIndex]);
    setShowMotivation(true);
  }, []);

  const closeMotivation = useCallback(() => setShowMotivation(false), []);
  const formatTime = (num: number) => num.toString().padStart(2, '0');
  
  const phaseColor = phase === 'focus' ? 'from-rose-400 to-pink-600' : 'from-emerald-400 to-teal-600';
  const buttonColor = phase === 'focus' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600';
  const buttonTextColor = phase === 'focus' ? 'text-rose-600' : 'text-emerald-600';

  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-4 pt-6 text-emerald-900 overflow-x-hidden">
      
      <div className="relative w-full max-w-lg p-8 bg-white/50 backdrop-blur-xl rounded-[3rem] border-2 border-white/60 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 mb-10 mx-auto mt-4">
        
        <button 
          onClick={() => setShowLetter(true)} 
          className="absolute top-8 left-8 text-rose-400 hover:text-rose-600 hover:scale-110 transition-all p-2 bg-white/50 rounded-full shadow-sm animate-pulse"
          title="Messaggio per te"
        >
          <Mail size={24} />
        </button>

        <button 
          onClick={() => setAudioEnabled(!audioEnabled)} 
          className="absolute top-8 right-8 text-emerald-800/50 hover:text-emerald-800 transition-colors p-2 bg-white/30 rounded-full"
          title={audioEnabled ? "Disattiva audio" : "Attiva audio"}
        >
          {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        <span className={`px-8 py-2 mb-6 text-sm md:text-base font-bold tracking-widest uppercase rounded-full bg-gradient-to-r ${phaseColor} text-white shadow-lg border border-white/20`}>
          {phase === 'focus' ? '🔥 Momento Focus' : '☕ Pausa Relax'}
        </span>

        <div className="w-56 h-56 md:w-72 md:h-72 mb-6 rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-gradient-to-br from-pink-100 to-rose-50 relative transform hover:scale-105 transition-transform duration-500">
          <img 
            src={phase === 'focus' ? '/giadi-determined.png' : '/giadi-calm.png'} 
            alt="Giadi Avatar" 
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="text-7xl md:text-8xl font-bold font-mono tracking-tighter text-emerald-950 drop-shadow-sm mb-8">
          {formatTime(minutes)}:{formatTime(seconds)}
        </div>

        <div className="flex gap-6 mb-8">
          <button 
            onClick={() => setIsActive(!isActive)} 
            className={`w-20 h-20 rounded-full text-white ${buttonColor} transition-all shadow-xl active:scale-90 flex items-center justify-center border-4 border-white/30`}
          >
            {isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
          </button>
          <button 
            onClick={() => { setIsActive(false); setMinutes(phase === 'focus' ? 25 : 5); setSeconds(0); }} 
            className={`w-20 h-20 rounded-full bg-white text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shadow-xl active:scale-90 flex items-center justify-center border-4 border-transparent`}
          >
            <RefreshCcw size={32} />
          </button>
        </div>

        <button 
          onClick={triggerMotivation} 
          className={`flex items-center gap-3 text-sm md:text-base font-bold ${buttonTextColor} bg-white/80 px-8 py-4 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all active:scale-95 border border-white`}
        >
          <HandPlatter size={20} /> Non ce la faccio... Aiuto!
        </button>
      </div>

      <div className="w-full max-w-5xl flex justify-center px-0 md:px-4">
        <StudyGarden />
      </div>
      {showMotivation && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          {/* Contenitore allargato a max-w-md e più arrotondato */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative w-full max-w-md text-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 border-4 border-pink-100">
            <button onClick={closeMotivation} className="absolute top-6 right-6 text-gray-300 hover:text-gray-600"><X size={28} /></button>

            <div className="w-48 h-48 md:w-64 md:h-64 mx-auto mb-8 rounded-full overflow-hidden border-[6px] border-pink-200 shadow-2xl transform hover:scale-105 transition-transform duration-300 animate-in zoom-in delay-150">
              <img src={currentMotivation.image} alt="Giadi Motivazione" className="w-full h-full object-cover" />
            </div>
            
            <p className="text-2xl md:text-3xl font-bold text-rose-500 mb-4 font-serif leading-tight drop-shadow-sm">"{currentMotivation.message}"</p>
            
            <p className="text-base md:text-lg text-gray-500 font-bold uppercase tracking-widest mb-10">Giadi 2D e Teo credono in te!</p>
            
            <button onClick={closeMotivation} className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white px-8 py-5 rounded-2xl font-bold shadow-xl hover:shadow-rose-300/50 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg">
              <Check size={24} /> Torno a studiare!
            </button>
          </div>
        </div>
      )}

      {showLetter && (
        <div className="fixed inset-0 bg-rose-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-[#fff9f0] p-8 md:p-12 rounded-[2rem] shadow-2xl relative w-full max-w-md text-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-rose-100">
            <button onClick={() => setShowLetter(false)} className="absolute top-6 right-6 text-rose-300 hover:text-rose-600"><X size={24} /></button>
            <div className="mb-6 flex justify-center">
              <div className="bg-rose-100 p-4 rounded-full">
                <Mail size={40} className="text-rose-500" />
              </div>
            </div>
            <h3 className="text-2xl font-serif font-bold text-rose-800 mb-6">Per la mia sorellina</h3>
            <div className="space-y-4 text-lg text-rose-900/80 font-serif leading-relaxed italic">
              <p>Voglio che ti sia chiara una cosa importantissima.</p>
              <p>Il tuo <span className="font-bold text-rose-600">fratellone</span> ti supporta pienamente.</p>
              <p>Ho fiducia cieca nel tuo <span className="font-bold text-rose-600">genio</span> e nella tua <span className="font-bold text-rose-600">testolina</span>.</p>
              <p>Sei capace di fare tutto ciò che vuoi, devi solo iniziare a crederci tu quanto ci credo io.</p>
            </div>
            <div className="mt-10 flex justify-center">
               <Heart className="text-rose-500 animate-bounce" fill="currentColor" size={32} />
            </div>
            <button onClick={() => setShowLetter(false)} className="mt-8 text-rose-400 text-sm hover:text-rose-600 underline">
              Chiudi messaggio
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} src="/bell.mp3" preload="auto" />
    </div>
  );
}