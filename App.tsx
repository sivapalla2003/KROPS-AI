
import React, { useState, useRef, useEffect } from 'react';
import Hero3D from './components/Hero3D';
import Diagnosis3D from './components/Diagnosis3D';
import VoiceInput from './components/VoiceInput';
import { Language, LANGUAGE_DISPLAY, DiagnosisResult } from './types';
import { analyzeCrop, generateMedicinePhoto } from './services/geminiService';
import { audioService } from './services/audioService';
import { jsPDF } from 'jspdf';

const CACHE_KEY = 'krops_ai_reports_v5';

// Perfect Neural Leaf Logo - Master agri-tech branding
const PerfectLeafLogo = ({ pulsing = false }) => (
  <div className={`relative ${pulsing ? 'scale-110' : ''} transition-transform duration-700`}>
    <svg width="48" height="48" viewBox="0 0 100 100" className="md:w-[68px] md:h-[68px] drop-shadow-[0_15px_30px_rgba(16,185,129,0.4)]">
      <defs>
        <linearGradient id="leafNeural" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#064e3b', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path 
        d="M50 95 C 50 95, 8 75, 8 35 C 8 15, 30 5, 50 25 C 70 5, 92 15, 92 35 C 92 75, 50 95, 50 95 Z" 
        fill="url(#leafNeural)"
        className={pulsing ? "animate-pulse" : ""}
      />
      <path d="M50 25 L 50 90" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M50 42 Q 68 38 82 32" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M50 62 Q 32 58 18 52" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="25" r="4" fill="#a7f3d0">
         <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

const App: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<Language>(Language.ENGLISH);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [cachedReports, setCachedReports] = useState<DiagnosisResult[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraFocus, setCameraFocus] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) setCachedReports(JSON.parse(saved));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    audioService.toggleAmbient(soundEnabled);
  }, [soundEnabled]);

  const speakResult = () => {
    if (!result) return;
    setIsSpeaking(true);
    const langMap: Record<Language, string> = {
      [Language.ENGLISH]: 'en-US',
      [Language.HINDI]: 'hi-IN',
      [Language.TELUGU]: 'te-IN',
      [Language.TAMIL]: 'ta-IN',
      [Language.MALAYALAM]: 'ml-IN',
      [Language.KANNADA]: 'kn-IN',
      [Language.MARATHI]: 'mr-IN'
    };
    const textToRead = `${result.crop}. ${result.disease}. Medicine: ${result.medicineName}. Instructions: ${result.prescription}.`;
    audioService.announce(textToRead, langMap[selectedLang]);
    setTimeout(() => setIsSpeaking(false), 12000); 
  };

  const handleDiagnosis = async () => {
    if (!isOnline) {
      alert("Field Scan requires AI connectivity.");
      return;
    }
    if (!image) return;

    setLoading(true);
    setResult(null);
    audioService.playFeedback('analyze');
    
    try {
      const diagnosis = await analyzeCrop(image, description, selectedLang);
      const medicinePhoto = await generateMedicinePhoto(diagnosis.medicineName);
      diagnosis.medicineImage = medicinePhoto;

      setResult(diagnosis);
      const updatedCache = [diagnosis, ...cachedReports.slice(0, 4)];
      setCachedReports(updatedCache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));
      audioService.playFeedback('success');
      setTimeout(() => document.getElementById('audit-report')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (error) {
      console.error(error);
      alert("Autonomous Diagnostic Failure.");
    } finally {
      setLoading(false);
    }
  };

  const onImageClick = () => {
    audioService.playFeedback('focus');
    fileInputRef.current?.click();
  };

  const generatePDF = () => {
    if (!result) return;
    audioService.playFeedback('click');
    const doc = new jsPDF();
    doc.setFillColor(6, 78, 59);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text('KROPS AI FIELD AUDIT', 15, 28);
    doc.setFontSize(10);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 160, 25);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.text(`CROP DNA MATCH: ${result.crop}`, 15, 65);
    doc.text(`PATHOLOGY: ${result.disease}`, 15, 80);
    doc.setDrawColor(16, 185, 129);
    doc.line(15, 85, 195, 85);
    doc.setFontSize(12);
    const splitPrescription = doc.splitTextToSize(result.prescription, 120);
    doc.text(splitPrescription, 15, 100);
    if (result.medicineImage) {
      try {
        doc.addImage(result.medicineImage, 'PNG', 145, 110, 50, 50);
        doc.setFontSize(9);
        doc.text(result.medicineName, 145, 165, { maxWidth: 45 });
      } catch (e) { console.error(e); }
    }
    doc.text(`DOSAGE: ${result.dosage}`, 15, 150);
    doc.save(`KropsAI_Report_${result.crop}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 overflow-x-hidden w-full flex flex-col">
      {/* Header */}
      <header className="header-gradient text-white px-4 py-8 md:px-8 md:py-14 shadow-2xl relative z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 md:gap-8 group">
             <PerfectLeafLogo pulsing={loading} />
             <div className="space-y-0.5 md:space-y-1">
               <h1 className="text-3xl md:text-6xl font-black tracking-tighter">KROPS AI</h1>
               <p className="text-[9px] md:text-[12px] font-black text-emerald-400 tracking-[0.3em] md:tracking-[0.5em] uppercase">Vernacular Agriculture 4.0</p>
             </div>
          </div>
          <div className="bg-white/10 px-4 py-2 md:px-8 md:py-4 rounded-2xl md:rounded-3xl backdrop-blur-xl border border-white/10 flex flex-col items-end">
             <p className="text-sm md:text-2xl font-black">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
             <p className="text-[7px] md:text-[9px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">Relay Active</p>
          </div>
        </div>
      </header>

      {/* Global Status Banner */}
      <div className="header-gradient border-t border-white/5 py-6 md:py-10 px-4 md:px-8 shadow-xl relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-10">
           <div className="flex items-center gap-4 md:gap-8">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner shrink-0">
                 <i className="fas fa-microchip text-xl md:text-2xl animate-pulse"></i>
              </div>
              <div className="space-y-0.5 md:space-y-2">
                 <p className="text-white font-black text-lg md:text-2xl tracking-tight">Cloud Agronomist Stream</p>
                 <div className="flex items-center gap-2 md:gap-3">
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <p className="text-[9px] md:text-[11px] text-emerald-400 font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">AI Diagnosis Active</p>
                 </div>
              </div>
           </div>
           <div className="flex gap-4 md:gap-6 w-full md:w-auto">
             <button 
               onClick={speakResult}
               disabled={!result}
               className="flex-1 md:flex-none bg-white text-emerald-950 px-6 md:px-12 py-4 md:py-6 rounded-full font-black text-xs md:text-base uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-5 disabled:opacity-20"
             >
               <i className={`fas ${isSpeaking ? 'fa-stop-circle text-red-500 animate-pulse' : 'fa-microphone-lines text-emerald-600'} text-lg md:text-xl`}></i>
               <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
             </button>
             <button 
               onClick={() => setSoundEnabled(!soundEnabled)}
               className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all shadow-xl border-4 shrink-0 ${soundEnabled ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-200 text-slate-400 border-slate-300'}`}
             >
               <i className={`fas ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} text-lg md:text-2xl`}></i>
             </button>
           </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-24 space-y-24 md:space-y-48 w-full flex-grow">
        
        {/* Intro Section with Growth-Sync Hero */}
        <section className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
           <div className="space-y-6 md:space-y-12 text-center lg:text-left">
              <h2 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                Nurturing <br/><span className="text-emerald-600 italic">the Soil</span> <br/> with Bio-AI.
              </h2>
              <p className="text-lg md:text-2xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Integrated biological modeling and vernacular diagnostics. Scroll to explore cellular data and capture your crop's health.
              </p>
              <div className="pt-2 md:pt-6">
                <select 
                  value={selectedLang} 
                  onChange={(e) => {
                    setSelectedLang(e.target.value as Language);
                    audioService.playFeedback('rustle');
                  }}
                  className="w-full md:w-auto bg-white border-2 md:border-4 border-slate-100 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[40px] font-black text-base md:text-xl text-emerald-900 shadow-xl md:shadow-2xl focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {Object.entries(Language).map(([k,v]) => <option key={k} value={v}>{LANGUAGE_DISPLAY[v as Language]}</option>)}
                </select>
              </div>
           </div>
           <div className="relative h-[300px] md:h-auto">
              <Hero3D />
           </div>
        </section>

        {/* Action Capture Section with Optical Focus UI */}
        <section id="diagnose-area" className="grid lg:grid-cols-2 gap-8 md:gap-16">
           <div 
             onClick={onImageClick}
             onMouseEnter={() => setCameraFocus(true)}
             onMouseLeave={() => setCameraFocus(false)}
             className={`relative h-[400px] md:h-[650px] rounded-[40px] md:rounded-[80px] overflow-hidden border-2 md:border-4 border-dashed transition-all cursor-pointer group shadow-2xl ${image ? 'border-transparent scale-[1.01]' : 'border-emerald-200 bg-white'}`}
           >
              {/* Optical Focus Reticle UI */}
              {!image && cameraFocus && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                   <div className="w-48 h-48 md:w-96 md:h-96 border-2 border-emerald-400/30 rounded-2xl md:rounded-3xl relative animate-pulse">
                      <div className="absolute top-0 left-0 w-8 h-8 md:w-16 md:h-16 border-t-4 md:border-t-8 border-l-4 md:border-l-8 border-emerald-500 rounded-tl-xl md:rounded-tl-3xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 md:w-16 md:h-16 border-t-4 md:border-t-8 border-r-4 md:border-r-8 border-emerald-500 rounded-tr-xl md:rounded-tr-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 md:w-16 md:h-16 border-b-4 md:border-b-8 border-l-4 md:border-l-8 border-emerald-500 rounded-bl-xl md:rounded-bl-3xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 md:w-16 md:h-16 border-b-4 md:border-b-8 border-r-4 md:border-r-8 border-emerald-500 rounded-br-xl md:rounded-br-3xl"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[2px] md:w-12 md:h-[3px] bg-emerald-500"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] md:w-[3px] h-8 md:h-12 bg-emerald-500"></div>
                   </div>
                </div>
              )}

              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if(f) {
                  const r = new FileReader();
                  r.onloadend = () => setImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }} />
              
              {image ? (
                <>
                  <img src={image} className="w-full h-full object-cover transition-transform duration-1000 md:group-hover:scale-110" alt="Specimen" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-6 left-6 md:bottom-16 md:left-16 glass-card px-4 md:px-12 py-3 md:py-6 rounded-2xl md:rounded-[35px] border border-white/40 flex items-center gap-3 md:gap-5 shadow-2xl">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] md:text-base font-black text-emerald-950 uppercase tracking-widest leading-none">Specimen Captured</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 md:space-y-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]">
                   <div className="w-24 h-24 md:w-40 md:h-40 bg-emerald-50 rounded-3xl md:rounded-[45%] flex items-center justify-center shadow-inner border border-emerald-100">
                      <i className="fas fa-camera-retro text-4xl md:text-6xl text-emerald-600"></i>
                   </div>
                   <div className="text-center space-y-2 md:space-y-4 px-6 md:px-10">
                     <p className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">Capture Plant</p>
                     <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.4em]">Tap to start optical focus</p>
                   </div>
                </div>
              )}
           </div>

           <div className="bg-white rounded-[40px] md:rounded-[80px] p-6 md:p-20 shadow-2xl border border-slate-50 flex flex-col space-y-8 md:space-y-12 relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                 <h3 className="text-xl md:text-4xl font-black text-slate-900">Observation Notes</h3>
                 <VoiceInput onTranscription={setDescription} lang={selectedLang} />
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe leaf patches, wilting durations..."
                className="flex-grow w-full p-6 md:p-12 bg-slate-50 rounded-3xl md:rounded-[56px] border-2 md:border-4 border-transparent focus:border-emerald-500 focus:outline-none text-lg md:text-2xl font-medium placeholder:text-slate-300 transition-all resize-none shadow-inner min-h-[150px]"
              />
              <button 
                onClick={handleDiagnosis}
                disabled={loading || !image}
                className={`w-full py-6 md:py-12 rounded-3xl md:rounded-[56px] font-black text-xl md:text-4xl shadow-xl transition-all active:scale-95 ${loading || !image ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-4 md:gap-8">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span className="text-sm md:text-2xl">Consulting DNA Core...</span>
                  </div>
                ) : 'Run Clinical Audit'}
              </button>
           </div>
        </section>

        {/* Result Report Area */}
        {result && (
          <section id="audit-report" className="space-y-16 md:space-y-48 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="text-center space-y-6 md:space-y-10">
               <p className="text-[10px] md:text-sm font-black text-emerald-600 uppercase tracking-[0.4em] md:tracking-[0.8em]">Biological Identity Confirmed</p>
               <h3 className="text-4xl md:text-9xl font-black text-emerald-950 tracking-tighter leading-none px-2">{result.crop}</h3>
               <div className="flex justify-center pt-4 md:pt-10">
                  <div className="infected-pill text-white px-8 md:px-20 py-4 md:py-8 rounded-2xl md:rounded-[40px] font-black text-xl md:text-4xl flex items-center gap-4 md:gap-8 shadow-2xl">
                     <i className="fas fa-bolt-lightning animate-bounce"></i>
                     <span>Pathogen Verified</span>
                  </div>
               </div>
            </div>

            {/* Specimen Evidence & Medicine Verification */}
            <div className="grid lg:grid-cols-2 gap-10 md:gap-20 items-center">
                <div className="relative">
                   <div className="glass-card p-4 md:p-12 rounded-3xl md:rounded-[72px] border-white relative z-10 shadow-2xl">
                      <div className="rounded-2xl md:rounded-[45px] overflow-hidden shadow-xl border-4 md:border-8 border-white/50">
                        <img src={image!} className="w-full h-[300px] md:h-[500px] object-cover" alt="Diagnosed" />
                      </div>
                      <div className="absolute -bottom-4 md:-bottom-10 right-4 md:-right-10 bg-white px-6 md:px-12 py-3 md:py-5 rounded-xl md:rounded-[30px] border-2 md:border-4 border-slate-50 shadow-xl text-[8px] md:text-sm font-black text-emerald-600 uppercase tracking-[0.3em] md:tracking-[0.5em]">
                        Live Specimen: MATCHED
                      </div>
                   </div>
                </div>

                <div className="space-y-8 md:space-y-16">
                   <div className="space-y-2 md:space-y-6">
                      <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-[0.4em] md:tracking-[0.6em]">Retail Pharmacy Guide</p>
                      <h3 className="text-3xl md:text-6xl font-black text-emerald-950 tracking-tight leading-tight">Identify Product</h3>
                   </div>
                   
                   <div className="glass-card p-6 md:p-14 rounded-3xl md:rounded-[72px] border-emerald-100 shadow-2xl relative overflow-hidden">
                    {result.medicineImage ? (
                      <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-center">
                         <div className="w-full md:w-1/2 rounded-2xl md:rounded-[50px] overflow-hidden border-4 md:border-8 border-white bg-white aspect-square flex items-center justify-center relative shadow-lg">
                           <img src={result.medicineImage} alt={result.medicineName} className="w-full h-full object-contain p-6 md:p-10" />
                           <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-emerald-500 text-white w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl border-2 md:border-4 border-white">
                              <i className="fas fa-check text-base md:text-2xl"></i>
                           </div>
                         </div>
                         <div className="w-full md:w-1/2 space-y-4 md:space-y-8 text-center md:text-left">
                            <div className="space-y-1 md:space-y-3">
                               <p className="text-[8px] md:text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] md:tracking-[0.4em]">Active Compound</p>
                               <p className="text-2xl md:text-5xl font-black text-slate-900 leading-[1.1]">{result.medicineName}</p>
                            </div>
                            <div className="h-0.5 md:h-[3px] w-12 md:w-16 bg-emerald-200 mx-auto md:mx-0"></div>
                            <p className="text-slate-500 text-lg md:text-2xl font-medium leading-relaxed italic">
                              "Show this to your agent for chemical matching."
                            </p>
                         </div>
                      </div>
                    ) : (
                      <div className="h-48 md:h-80 w-full flex flex-col items-center justify-center space-y-4 md:space-y-8 opacity-40">
                         <i className="fas fa-image text-5xl md:text-8xl animate-pulse"></i>
                         <p className="font-black uppercase text-[8px] md:text-[10px] tracking-[0.4em] md:tracking-[0.6em]">Generating Retail Visual...</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            {/* Pathology 3D View */}
            <div className="space-y-8 md:space-y-16">
               <div className="text-center">
                  <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-[0.4em] mb-2 md:mb-4">Spectral Imaging</p>
                  <h3 className="text-2xl md:text-6xl font-black text-emerald-950 tracking-tight">Biological Integrity Model</h3>
               </div>
               <Diagnosis3D disease={result.disease} />
            </div>

            {/* Professional Prescription Dashboard */}
            <div className="prescription-container p-8 md:p-32 text-white space-y-16 md:space-y-32 relative overflow-hidden shadow-2xl">
               <div className="flex items-center gap-6 md:gap-10">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[40%] bg-white/10 flex items-center justify-center text-2xl md:text-4xl backdrop-blur-2xl border border-white/20 shadow-xl">
                    <i className="fas fa-flask-vial"></i>
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <p className="text-[8px] md:text-sm font-black tracking-[0.4em] md:tracking-[0.8em] uppercase opacity-50">Treatment Logic</p>
                    <p className="text-xl md:text-3xl font-black text-emerald-400">Field Prescription</p>
                  </div>
               </div>

               <div className="grid lg:grid-cols-2 gap-8 md:gap-20">
                  <div className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[72px] p-8 md:p-20 space-y-6 md:space-y-12 backdrop-blur-xl shadow-inner">
                     <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] md:tracking-[0.6em] opacity-40">Concentration Ratio</p>
                     <p className="text-3xl md:text-7xl font-black leading-none">{result.dosage}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[72px] p-8 md:p-20 space-y-6 md:space-y-12 backdrop-blur-xl shadow-inner">
                     <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] md:tracking-[0.6em] opacity-40">Operational Scale</p>
                     <p className="text-3xl md:text-7xl font-black leading-none">{result.timing}</p>
                  </div>
               </div>

               <div className="bg-emerald-100 rounded-3xl md:rounded-[72px] p-8 md:p-20 text-emerald-950 space-y-8 md:space-y-16 border-4 md:border-8 border-emerald-300 relative overflow-hidden shadow-xl">
                  <div className="flex justify-between items-center relative z-10">
                     <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] md:tracking-[0.8em] opacity-60">Farmer Safety Protocol</p>
                     <i className="fas fa-clipboard-check text-2xl md:text-5xl text-emerald-600"></i>
                  </div>
                  <p className="text-xl md:text-5xl font-black italic leading-tight md:leading-[1.2] relative z-10 tracking-tight">
                    "{result.safety}"
                  </p>
               </div>
            </div>

            {/* Export Actions */}
            <div className="flex flex-col items-center gap-8 md:gap-16 py-20 md:py-40 border-t-2 md:border-t-4 border-slate-200 mt-12 md:mt-24">
               <div className="text-center space-y-3 md:space-y-6 max-w-3xl">
                  <p className="text-[10px] md:text-base font-black text-slate-300 uppercase tracking-[0.6em] md:tracking-[1em]">Audit Conclusion</p>
                  <p className="text-lg md:text-2xl text-slate-400 font-medium leading-relaxed px-4">Download your clinical audit to ensure precise field operations.</p>
               </div>
               <button 
                 onClick={generatePDF}
                 className="w-full md:w-auto bg-emerald-950 text-white px-8 md:px-24 py-6 md:py-12 rounded-full md:rounded-[60px] font-black text-lg md:text-3xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 md:gap-10"
               >
                 <i className="fas fa-file-pdf text-2xl md:text-4xl"></i>
                 <span>Download Audit</span>
               </button>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-emerald-950 text-white py-12 md:py-48 px-6 md:px-12 border-t-[12px] md:border-t-[32px] border-emerald-600 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-32 relative z-10">
           <div className="space-y-8 md:space-y-16 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 md:gap-8">
                 <div className="bg-emerald-600 p-2 md:p-4 rounded-xl md:rounded-3xl shadow-xl"><PerfectLeafLogo pulsing={false} /></div>
                 <span className="text-3xl md:text-6xl font-black tracking-tighter">KROPS AI</span>
              </div>
              <p className="text-emerald-100/40 text-lg md:text-3xl font-medium max-w-xl leading-relaxed italic">
                "Bridging the gap between ancestral wisdom and biological intelligence."
              </p>
           </div>
           <div className="flex flex-col items-center md:items-end justify-center space-y-10 md:space-y-16">
             <div className="flex flex-wrap justify-center md:justify-end gap-6 md:gap-16 text-[10px] md:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-emerald-400">
               <a href="#" className="hover:text-white transition-all pb-1">DNA Core</a>
               <a href="#" className="hover:text-white transition-all pb-1">Relay</a>
               <a href="#" className="hover:text-white transition-all pb-1">Secure</a>
             </div>
             <div className="flex gap-6 md:gap-10">
               {['whatsapp', 'youtube', 'instagram', 'twitter'].map(s => (
                 <div key={s} className="w-12 h-12 md:w-24 md:h-24 rounded-2xl md:rounded-[38%] bg-white/5 border border-white/10 flex items-center justify-center active:bg-emerald-600 transition-all cursor-pointer shadow-xl">
                   <i className={`fab fa-${s} text-lg md:text-3xl`}></i>
                 </div>
               ))}
             </div>
             <p className="text-[7px] md:text-[11px] font-bold text-emerald-400/20 uppercase tracking-[0.4em] md:tracking-[0.8em] text-center">© 2025 KROPS AI | Kerala Agri-Relay</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
