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
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-6 text-emerald-900 overflow-x-hidden">
      
      <div className="relative w-full max-w-lg p-6 md:p-10 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/60 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 mb-10 mx-auto mt-2">
        
        <div className="w-full flex justify-between items-center mb-6">
          <button 
            onClick={() => setShowLetter(true)} 
            className="text-rose-400 hover:text-rose-600 hover:scale-110 transition-all p-3 bg-white/60 rounded-full shadow-sm active:scale-95"
          >
            <Mail size={22} />
          </button>

          <button 
            onClick={() => setAudioEnabled(!audioEnabled)} 
            className="text-emerald-800/50 hover:text-emerald-800 transition-colors p-3 bg-white/60 rounded-full shadow-sm active:scale-95"
          >
            {audioEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
        </div>

        <span className={`px-6 py-2 mb-8 text-xs md:text-sm font-bold tracking-widest uppercase rounded-full bg-gradient-to-r ${phaseColor} text-white shadow-lg border border-white/20`}>
          {phase === 'focus' ? '🔥 Momento Focus' : '☕ Pausa Relax'}
        </span>

        <div className="w-48 h-48 md:w-64 md:h-64 mb-8 rounded-full overflow-hidden border-[6px] border-white shadow-2xl bg-gradient-to-br from-pink-100 to-rose-50 relative transform hover:scale-105 transition-transform duration-500">
          <img 
            src={phase === 'focus' ? '/giadi-determined.png' : '/giadi-calm.png'} 
            alt="Giadi Avatar" 
            className="w-full h-full object-cover" 
          />
        </div>

        <div className="text-6xl md:text-8xl font-bold font-mono tracking-tighter text-emerald-950 drop-shadow-sm mb-8">
          {formatTime(minutes)}:{formatTime(seconds)}
        </div>

        <div className="flex gap-6 mb-8">
          <button 
            onClick={() => setIsActive(!isActive)} 
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full text-white ${buttonColor} transition-all shadow-xl active:scale-90 flex items-center justify-center border-4 border-white/30`}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={() => { setIsActive(false); setMinutes(phase === 'focus' ? 25 : 5); setSeconds(0); }} 
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shadow-xl active:scale-90 flex items-center justify-center border-4 border-transparent`}
          >
            <RefreshCcw size={28} />
          </button>
        </div>

        <button 
          onClick={triggerMotivation} 
          className={`w-full md:w-auto flex justify-center items-center gap-2 text-sm md:text-base font-bold ${buttonTextColor} bg-white/80 px-8 py-4 rounded-2xl shadow-lg hover:bg-white hover:scale-105 transition-all active:scale-95 border border-white`}
        >
          <HandPlatter size={20} /> Non ce la faccio... Aiuto!
        </button>
      </div>

      <div className="w-full max-w-5xl flex justify-center px-0 md:px-4">
        <StudyGarden />
      </div>

      {showMotivation && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative w-full max-w-md text-center animate-in zoom-in-95 border-4 border-pink-100">
            <button onClick={closeMotivation} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-[5px] border-pink-200 shadow-lg">
              <img src={currentMotivation.image} alt="Giadi Motivazione" className="w-full h-full object-cover" />
            </div>
            <p className="text-xl font-bold text-rose-500 mb-2 font-serif leading-snug">"{currentMotivation.message}"</p>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Giadi 2D e Teo credono in te!</p>
            <button onClick={closeMotivation} className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:shadow-rose-300/50 active:scale-95 flex items-center justify-center gap-2">
              <Check size={20} /> Torno a studiare!
            </button>
          </div>
        </div>
      )}

      {showLetter && (
        <div className="fixed inset-0 bg-rose-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-[#fff9f0] p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative w-full max-w-md text-center animate-in zoom-in-95 border border-rose-100">
            <button onClick={() => setShowLetter(false)} className="absolute top-5 right-5 text-rose-300 hover:text-rose-600 bg-rose-50 p-2 rounded-full"><X size={20} /></button>
            <div className="mb-6 flex justify-center">
              <div className="bg-rose-100 p-4 rounded-full">
                <Mail size={32} className="text-rose-500" />
              </div>
            </div>
            <h3 className="text-2xl font-serif font-bold text-rose-800 mb-6">Per la mia sorellina</h3>
            <div className="space-y-4 text-base md:text-lg text-rose-900/80 font-serif leading-relaxed italic">
              <p>Voglio che ti sia chiara una cosa importantissima.</p>
              <p>Il tuo <span className="font-bold text-rose-600">fratellone</span> ti supporta pienamente.</p>
              <p>Ho fiducia cieca nel tuo <span className="font-bold text-rose-600">genio</span> e nella tua <span className="font-bold text-rose-600">testolina</span>.</p>
              <p>Sei capace di fare tutto ciò che vuoi, devi solo iniziare a crederci tu quanto ci credo io.</p>
            </div>
            <div className="mt-8 flex justify-center">
               <Heart className="text-rose-500 animate-bounce" fill="currentColor" size={28} />
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} src="/bell.mp3" preload="auto" />
    </div>
  );
}