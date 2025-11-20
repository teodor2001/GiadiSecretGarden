"use client";
import { useState, useEffect } from 'react';
import { Plus, BookOpen, Check, X, Upload, Loader2, Sparkles, Send, Trash2, Trophy, KeyRound } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type Flashcard = { id: number; question: string; answer: string; known: boolean; };
type Topic = { id: number; title: string; cards: Flashcard[]; };
type Evaluation = { isCorrect: boolean; feedback: string; };

export default function StudyGarden() {
  const [secretKey, setSecretKey] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const [userAnswer, setUserAnswer] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [cardsAnswered, setCardsAnswered] = useState(0);
  const [showPerfectRun, setShowPerfectRun] = useState(false);

  const handleLogin = async () => {
    if (!secretKey.trim()) return;
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('gardens')
        .select('data')
        .eq('secret_key', secretKey.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        alert("Errore di connessione al giardino.");
      } else if (data) {
        setTopics(data.data);
        setIsLoggedIn(true);
        localStorage.setItem("giadi-garden-key", secretKey.trim());
      } else {
        if (confirm("Nessun giardino trovato con questa chiave. Vuoi crearne uno nuovo?")) {
          const { error: insertError } = await supabase
            .from('gardens')
            .insert([{ secret_key: secretKey.trim(), data: [] }]);
          
          if (!insertError) {
            setTopics([]);
            setIsLoggedIn(true);
            localStorage.setItem("giadi-garden-key", secretKey.trim());
          } else {
            alert("Impossibile creare il giardino.");
          }
        }
      }
    } catch (e) {
      alert("Qualcosa è andato storto.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem("giadi-garden-key");
    if (savedKey) {
      setSecretKey(savedKey);
      const fetchAuto = async () => {
        setIsLoadingData(true);
        const { data } = await supabase.from('gardens').select('data').eq('secret_key', savedKey).single();
        if (data) {
           setTopics(data.data);
           setIsLoggedIn(true);
        }
        setIsLoadingData(false);
      };
      fetchAuto();
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !secretKey) return;
    const saveData = async () => {
      setIsSaving(true);
      await supabase
        .from('gardens')
        .update({ data: topics, updated_at: new Date() })
        .eq('secret_key', secretKey);
      setIsSaving(false);
    };
    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [topics, isLoggedIn, secretKey]);

  const addTopic = () => {
    if (!newTopicName.trim()) return;
    setTopics([...topics, { id: Date.now(), title: newTopicName, cards: [] }]);
    setNewTopicName("");
  };

  const deleteTopic = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    if (confirm("Sei sicura di voler eliminare questa materia?")) {
      const updatedTopics = topics.filter(t => t.id !== id);
      setTopics(updatedTopics);
      if (activeTopic?.id === id) setActiveTopic(null);
    }
  };

  const addCardToTopic = () => {
    if (!activeTopic || !newQuestion.trim() || !newAnswer.trim()) return;
    const newCard = { id: Date.now(), question: newQuestion, answer: newAnswer, known: false };
    const updatedTopics = topics.map(t => t.id === activeTopic.id ? { ...t, cards: [...t.cards, newCard] } : t);
    setTopics(updatedTopics);
    setActiveTopic({ ...activeTopic, cards: [...activeTopic.cards, newCard] });
    setNewQuestion(""); setNewAnswer(""); setIsAddingCard(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeTopic) return;
    const file = e.target.files[0];
    setIsGenerating(true);
    setShowUpload(false);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (data.flashcards) {
        const newCards = data.flashcards.map((c: any) => ({
          id: Date.now() + Math.random(),
          question: c.question,
          answer: c.answer,
          known: false
        }));
        const updatedTopics = topics.map(t => {
          if (t.id === activeTopic.id) return { ...t, cards: [...t.cards, ...newCards] };
          return t;
        });
        setTopics(updatedTopics);
        setActiveTopic({ ...activeTopic, cards: [...activeTopic.cards, ...newCards] });
      }
    } catch (error) {
      alert("Errore generazione AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startStudySession = () => {
    setStudyMode(true);
    setCurrentCardIndex(0);
    setEvaluation(null);
    setUserAnswer("");
    setSessionMistakes(0);
    setCardsAnswered(0);
    setShowPerfectRun(false);
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    setIsChecking(true);
    try {
      const currentCard = activeTopic!.cards[currentCardIndex];
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentCard.question,
          userAnswer: userAnswer,
          correctAnswer: currentCard.answer
        })
      });
      const data = await res.json();
      setEvaluation(data);
      
      if (data.isCorrect) {
        const updatedCards = [...activeTopic!.cards];
        updatedCards[currentCardIndex].known = true;
        
        const updatedTopics = topics.map(t => t.id === activeTopic!.id ? { ...t, cards: updatedCards } : t);
        setTopics(updatedTopics);
        setActiveTopic({ ...activeTopic!, cards: updatedCards });

        const allKnown = updatedCards.every(c => c.known);
        if (allKnown) {
           setTimeout(() => setShowPerfectRun(true), 2000); 
        }
      } else {
        setSessionMistakes(prev => prev + 1);
      }
    } catch (error) {
      alert("Errore verifica. Riprova, Giadi si è distratta un attimo!");
    } finally {
      setIsChecking(false);
    }
  };

  const nextCard = () => {
    const nextIndex = (currentCardIndex + 1) % activeTopic!.cards.length;
    setCurrentCardIndex(nextIndex);
    setEvaluation(null);
    setUserAnswer("");
  };

  const getPlantStage = (topic: Topic) => {
    if (topic.cards.length === 0) return <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-stone-100 border-2 border-stone-200 flex items-center justify-center text-stone-300 text-[10px] md:text-xs">Vaso</div>;
    const knownCount = topic.cards.filter(c => c.known).length;
    const percentage = (knownCount / topic.cards.length) * 100;
    
    if (percentage === 100) return <span className="text-5xl md:text-6xl animate-bounce block filter drop-shadow-md">🦋</span>;
    if (percentage > 50) return <span className="text-5xl md:text-6xl block filter drop-shadow-md">🌸</span>;
    if (percentage > 20) return <span className="text-5xl md:text-6xl block filter drop-shadow-md">🌱</span>;
    if (percentage > 0) return <span className="text-5xl md:text-6xl block filter drop-shadow-md">🌰</span>;
    
    return <div className="w-3 h-3 rounded-full bg-stone-400"></div>;
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full mt-8 p-8 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-2xl mb-24 mx-auto text-center max-w-md animate-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-serif text-emerald-900 mb-6">Benvenuta nel Giardino 🌿</h2>
        <p className="text-gray-600 mb-8">Inserisci la parola magica per aprire il tuo spazio.</p>
        <div className="relative mb-6">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
          <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="Chiave Segreta" className="w-full py-4 pl-12 pr-4 rounded-2xl border-2 border-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-base" />
        </div>
        <button onClick={handleLogin} disabled={isLoadingData} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-emerald-600 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoadingData ? <Loader2 className="animate-spin" /> : "Entra"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 md:mt-8 p-6 md:p-10 bg-white/60 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] border border-white/60 shadow-2xl mb-24 mx-auto relative">
      
      <div className="flex flex-col-reverse md:flex-row justify-between items-center mb-8 gap-4">
         <h2 className="text-2xl md:text-3xl font-serif text-emerald-900 text-center flex items-center justify-center gap-3">
           <span className="text-3xl md:text-4xl">🦋</span> 
           Il Giardino dello Studio
         </h2>
         <div className="flex items-center justify-center bg-white/40 px-4 py-2 rounded-full">
            {isSaving ? (
               <span className="text-xs text-emerald-600 flex items-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin" /> Salvataggio...</span>
            ) : (
               <span className="text-xs text-emerald-500 flex items-center gap-1 font-bold"><Check size={12} /> Salvato</span>
            )}
         </div>
      </div>

      {!activeTopic ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {topics.map(topic => (
            <div key={topic.id} onClick={() => setActiveTopic(topic)} className="aspect-auto sm:aspect-square bg-white/70 rounded-3xl p-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 cursor-pointer hover:bg-white hover:scale-[1.02] md:hover:scale-105 transition-all border border-white/50 shadow-lg group h-28 sm:h-auto relative">
              <button onClick={(e) => deleteTopic(e, topic.id)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-10"><Trash2 size={18} /></button>
              <div className="transform group-hover:-translate-y-1 transition-transform duration-500 shrink-0">{getPlantStage(topic)}</div>
              <div className="text-left sm:text-center min-w-0 flex-1">
                <span className="block text-base md:text-lg font-bold text-emerald-800 leading-tight mb-1 truncate">{topic.title}</span>
                <span className="text-xs md:text-sm text-emerald-600/70 font-medium">{topic.cards.filter(c => c.known).length}/{topic.cards.length} apprese</span>
              </div>
            </div>
          ))}
          <div className="aspect-auto sm:aspect-square border-4 border-dashed border-white/60 bg-white/30 rounded-3xl flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-4 p-4 sm:p-6 hover:bg-white/50 transition-all group h-28 sm:h-auto">
             <div className="w-full flex-1 sm:flex-none text-center">
                <h4 className="text-sm sm:text-base font-bold text-emerald-800/70 mb-2 uppercase tracking-wide hidden sm:block">Aggiungi materia</h4>
                <input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTopic()} placeholder="Es. Diritto Privato..." className="w-full text-left sm:text-center bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-emerald-900 placeholder-emerald-700/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-sm md:text-base" />
             </div>
             <button onClick={addTopic} disabled={!newTopicName.trim()} className="bg-emerald-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"><Plus size={24} className="md:w-8 md:h-8" /></button>
          </div>
        </div>
      ) : !studyMode ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6 md:mb-8">
             <button onClick={() => setActiveTopic(null)} className="px-4 py-2 bg-white/50 rounded-full text-xs md:text-sm font-bold text-emerald-700 hover:bg-white transition-colors">← Indietro</button>
             <h3 className="text-xl md:text-2xl font-bold text-emerald-900 truncate max-w-[60%]">{activeTopic.title}</h3>
             <div className="w-16"></div>
          </div>
          
          {isGenerating && (
            <div className="mb-6 p-6 bg-indigo-50/90 rounded-3xl border border-indigo-100 flex flex-col items-center justify-center gap-3 animate-pulse shadow-inner">
                <Loader2 size={32} className="md:w-10 md:h-10 animate-spin text-indigo-500" />
                <span className="text-base md:text-lg text-indigo-800 font-bold text-center">L'IA sta studiando i tuoi appunti...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
             <button onClick={startStudySession} disabled={activeTopic.cards.length === 0} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200/50 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95">
               <BookOpen size={24} className="md:w-7 md:h-7" /> Ripassa Ora
             </button>
             <div className="flex gap-3 flex-1">
                <button onClick={() => setShowUpload(!showUpload)} disabled={isGenerating} className="flex-1 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200 rounded-2xl font-bold hover:from-indigo-200 hover:to-purple-200 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 py-4 text-sm md:text-base"><Sparkles size={20} className="md:w-6 md:h-6" /> <span className="">AI Magic</span></button>
                <button onClick={() => setIsAddingCard(true)} className="flex-none w-16 md:w-20 bg-white text-emerald-600 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-50 flex items-center justify-center shadow-sm active:scale-95"><Plus size={28} className="md:w-8 md:h-8" /></button>
             </div>
          </div>

          {showUpload && !isGenerating && (
            <div className="mb-8 p-6 bg-white/80 rounded-[2rem] border border-indigo-100 shadow-xl animate-in zoom-in-95">
              <p className="text-sm md:text-base text-indigo-800 mb-4 font-bold text-center">Carica appunti (PDF) 🔮</p>
              <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 border-4 border-dashed border-indigo-300 rounded-2xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-500 transition-all group">
                <Upload size={32} className="md:w-10 md:h-10 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm text-indigo-500 font-medium">Clicca per selezionare file</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 max-h-80 md:max-h-96 overflow-y-auto pr-2 scrollbar-thin">
            {activeTopic.cards.map((card) => (
              <div key={card.id} className="p-4 md:p-5 bg-white/80 rounded-2xl border border-emerald-50 text-emerald-900 flex justify-between items-center shadow-sm hover:bg-white transition-colors">
                <span className="font-medium truncate max-w-[80%] text-sm md:text-base">{card.question}</span>
                {card.known ? <Check size={20} className="md:w-6 md:h-6 text-emerald-500" /> : <span className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-emerald-200"></span>}
              </div>
            ))}
          </div>

          {isAddingCard && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95">
                <h4 className="text-xl font-bold text-emerald-900 mb-6">Nuova Carta</h4>
                <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Domanda..." className="w-full mb-4 text-base p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} placeholder="Risposta..." className="w-full mb-6 text-base p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[120px]" />
                <div className="flex gap-4 justify-end">
                  <button onClick={() => setIsAddingCard(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 text-base">Annulla</button>
                  <button onClick={addCardToTopic} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 text-base">Salva</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : showPerfectRun ? (
        <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-500">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-[6px] border-yellow-400 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300 bg-white">
                <img src="/giadi-smug.png" alt="Giadi Smug" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-yellow-600 mb-4 font-serif drop-shadow-sm text-center">TE L'AVEVO DETTO! 😏</h2>
            <p className="text-lg md:text-xl text-gray-700 font-medium mb-8">Materia Completata al 100%!</p>
            <div className="bg-yellow-50 border-4 border-yellow-200 p-6 md:p-8 rounded-[2rem] mb-10 max-w-lg shadow-sm transform -rotate-1 hover:rotate-0 transition-transform">
                <p className="text-xl md:text-2xl font-black text-yellow-700 leading-tight italic text-center">
                    "Teo te l'ha sempre detto che sei un genio, testolina! Hai imparato tutto!"
                </p>
            </div>
            <button onClick={() => {setStudyMode(false); setShowPerfectRun(false);}} className="px-10 py-5 bg-yellow-400 text-yellow-900 rounded-2xl font-bold shadow-xl hover:bg-yellow-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-xl">
                <Trophy size={28} /> Torna al Giardino
            </button>
        </div>
      ) : (
        <div className="text-center animate-in zoom-in-95 duration-300 max-w-3xl mx-auto">
           <div className="flex justify-between items-center mb-8 md:mb-10">
             <button onClick={() => setStudyMode(false)} className="px-4 py-2 bg-white/50 rounded-full text-sm font-bold text-emerald-700 hover:bg-white transition-colors">← Esci</button>
             <span className="text-xs md:text-sm font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-4 py-2 rounded-lg">Carta {currentCardIndex + 1} / {activeTopic!.cards.length}</span>
             <div className="w-20"></div>
           </div>

           <div className="bg-white rounded-[2.5rem] border-4 border-emerald-50 shadow-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
             <span className="text-emerald-400 text-xs md:text-sm font-black uppercase mb-6 tracking-[0.2em] block">Domanda</span>
             <p className="text-xl md:text-3xl font-serif text-gray-800 leading-relaxed">{activeTopic!.cards[currentCardIndex].question}</p>
           </div>

           {!evaluation ? (
             <div className="animate-in slide-in-from-bottom-4">
               <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Scrivi qui la tua risposta..." className="w-full p-6 rounded-[2rem] border-4 border-emerald-100 focus:border-emerald-400 focus:ring-0 text-lg md:text-xl min-h-[150px] resize-none bg-white/80 shadow-inner text-gray-700 mb-6 placeholder-emerald-900/20" />
               <button onClick={checkAnswer} disabled={isChecking || !userAnswer.trim()} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                 {isChecking ? <Loader2 className="animate-spin" /> : <Send />}
                 {isChecking ? "Giadi sta controllando..." : "Controlla Risposta"}
               </button>
             </div>
           ) : (
             <div className={`animate-in zoom-in-95 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-4 ${evaluation.isCorrect ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
               <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                 <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 shadow-lg shrink-0 ${evaluation.isCorrect ? 'border-green-300' : 'border-orange-300'}`}>
                    <img src={evaluation.isCorrect ? '/giadi-happy.png' : '/giadi-determined.png'} alt="Giadi Reaction" className="w-full h-full object-cover" />
                 </div>
                 <div className="text-left flex-1">
                   <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${evaluation.isCorrect ? 'text-green-600' : 'text-orange-600'}`}>{evaluation.isCorrect ? "Bravissima! 🎉" : "Quasi..."}</h3>
                   <p className="text-lg text-gray-700 leading-relaxed font-medium">{evaluation.feedback}</p>
                 </div>
               </div>
               {!evaluation.isCorrect && (
                 <div className="bg-white/60 rounded-2xl p-6 mb-8 text-left border border-orange-100">
                   <span className="text-orange-400 text-xs font-bold uppercase mb-2 block">La risposta del libro era:</span>
                   <p className="text-gray-800 italic">{activeTopic!.cards[currentCardIndex].answer}</p>
                 </div>
               )}
               <button onClick={nextCard} className={`w-full py-5 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-white ${evaluation.isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
                 {evaluation.isCorrect ? "Prossima Carta →" : "Ho capito, andiamo avanti"}
               </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}