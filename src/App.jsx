import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calculator, Baby, ArrowLeft, Scale, Calendar, Clock, Info } from 'lucide-react';
import './index.css'

// --- DATASETS ---

const SYRUP_DATA = [
  { drugName: "Amoxicillin 125 mg/5 mL", minDose: 25, maxDose: 50, interval: 8, doseType: 'daily' },
  { drugName: "Amoxicillin 250 mg/5 mL", minDose: 25, maxDose: 50, interval: 8, doseType: 'daily' },
  { drugName: "Paracetamol 125 mg/5 mL", minDose: 10, maxDose: 15, interval: 6, doseType: 'single' },
  { drugName: "Paracetamol 250 mg/5 mL", minDose: 10, maxDose: 15, interval: 6, doseType: 'single' },
  { drugName: "Ibuprofen 100 mg/5 mL", minDose: 5, maxDose: 10, interval: 6, doseType: 'single' },
  { drugName: "Augmentin 228 mg/5 mL", minDose: 25, maxDose: 45, interval: 12, doseType: 'daily' },
  { drugName: "Augmentin 312 mg/5 mL", minDose: 25, maxDose: 45, interval: 8, doseType: 'daily' },
  { drugName: "Augmentin 457 mg/5 mL", minDose: 25, maxDose: 45, interval: 12, doseType: 'daily' },
  { drugName: "Azithromycin 200 mg/5 mL", minDose: 10, maxDose: 10, interval: 24, doseType: 'daily', note: "10mg/kg for 3 days" },
  { drugName: "Bromhexine syrup 4 mg/5 mL", minDose: 0.2, maxDose: 0.3, interval: 8, doseType: 'daily' },
  { drugName: "Cefixime 100 mg/5 mL", minDose: 8, maxDose: 8, interval: 24, doseType: 'daily' },
  { drugName: "Chlorpheniramine syrup 2 mg/5 mL", minDose: 0.1, maxDose: 0.2, interval: 6, doseType: 'single' },
  { drugName: "Chlorphenamine + Paracetamol", minDose: 10, maxDose: 15, interval: 6, doseType: 'single', note: "Based on Paracetamol" },
  { drugName: "Desloratadine 2.5 mg/5 mL", minDose: 0.05, maxDose: 0.125, interval: 24, doseType: 'daily' },
  { drugName: "Dexamethasone 0.5 mg/5 mL", minDose: 0.15, maxDose: 0.6, interval: 24, doseType: 'daily' }, 
  { drugName: "Dextromethorphan 15 mg/5 mL", minDose: 0.2, maxDose: 0.4, interval: 6, doseType: 'single' }, 
  { drugName: "Ketotifen 1 mg/5 mL", minDose: 0.025, maxDose: 0.05, interval: 12, doseType: 'daily' },
  { drugName: "Lactulose 3.35 g/5 mL", minDose: 0.5, maxDose: 1.0, interval: 12, doseType: 'daily', unit: 'g' }, 
  { drugName: "Loratadine 5 mg/5 mL", minDose: 0.2, maxDose: 0.2, interval: 24, doseType: 'daily' },
  { drugName: "Metronidazole 200 mg/5 mL", minDose: 7.5, maxDose: 7.5, interval: 8, doseType: 'single' }, 
  { drugName: "Ondansetron 4 mg/5 mL", minDose: 0.1, maxDose: 0.15, interval: 8, doseType: 'single' },
  { drugName: "Prednisolone 5 mg/5 mL", minDose: 1, maxDose: 2, interval: 24, doseType: 'daily' },
  { drugName: "Tussilet syrup (Dex + Guaifenesin)", minDose: 0.3, maxDose: 1.0, interval: 6, doseType: 'daily', note: "Calc on Dextromethorphan" }
];

// --- UTILS ---

const parseDrugStrength = (str) => {
  const strengthMatch = str.match(/(\d+([.,]\d+)?)\s*(mg|g|IU)/i);
  let mg = strengthMatch ? parseFloat(strengthMatch[1]) : 0;
   
  if (str.includes("228")) mg = 200;
  if (str.includes("312")) mg = 250;
  if (str.includes("457")) mg = 400;

  const volMatch = str.match(/\/(\d+([.,]\d+)?)\s*m[lL]/i);
  const ml = volMatch ? parseFloat(volMatch[1]) : 5;

  return { mg, ml };
};

const calculateDose = (weight, drug) => {
  if (!weight || isNaN(weight)) return null;

  const { mg: concMg, ml: concMl } = parseDrugStrength(drug.drugName);
   
  if (!concMg || !concMl) return null;

  // 1. Determine Single Dose MG Target
  const freq = 24 / drug.interval;
  let targetMinMg = drug.minDose;
  let targetMaxMg = drug.maxDose;

  if (drug.doseType === 'daily') {
    targetMinMg = drug.minDose / freq;
    targetMaxMg = drug.maxDose / freq;
  }

  // 2. FORMULA: ((DoseMg * Weight) * ConcMl) / ConcMg
  const calcVol = (mgPerKg) => {
    return ((mgPerKg * weight) * concMl) / concMg;
  };

  const minVol = calcVol(targetMinMg);
  const maxVol = calcVol(targetMaxMg);

  const format = (n) => n < 10 ? n.toFixed(1) : Math.round(n);
   
  const valString = minVol === maxVol 
    ? `${format(minVol)}` 
    : `${format(minVol)} - ${format(maxVol)}`;

  return {
    val: valString,
    unit: 'ml', 
    freq: freq,
    interval: drug.interval
  };
};

// --- COMPONENTS ---

const Header = ({ title, onBack }) => (
  <div className="bg-teal-600 text-white p-4 shadow-md flex items-center gap-3 shrink-0">
    {onBack && (
      <button 
        onClick={onBack}
        className="p-1 hover:bg-teal-700 rounded-full transition-colors"
      >
        <ArrowLeft size={24} />
      </button>
    )}
    <h1 className="text-xl font-bold flex-1 pr-8">{title}</h1>
  </div>
);

const GlobalInput = ({ weight, setWeight, age, setAge }) => {
  const [mode, setMode] = useState('weight');

  const handleAgeChange = (val) => {
    setAge(val);
    if (val) {
      const estWeight = (parseFloat(val) + 4) * 2;
      setWeight(estWeight.toFixed(1));
    } else {
      setWeight('');
    }
  };

  return (
    <div className="bg-white p-4 border-b border-slate-200 shrink-0 z-10 shadow-sm">
      <div className="flex gap-2 mb-3">
        <button 
          onClick={() => setMode('weight')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === 'weight' ? 'bg-teal-100 text-teal-700' : 'bg-slate-50 text-slate-500'}`}
        >
          <Scale size={16} /> By Weight (kg)
        </button>
        <button 
          onClick={() => setMode('age')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${mode === 'age' ? 'bg-teal-100 text-teal-700' : 'bg-slate-50 text-slate-500'}`}
        >
          <Calendar size={16} /> By Age (yr)
        </button>
      </div>

      <div className="relative">
        {mode === 'weight' ? (
          <>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter Weight..."
              className="w-full p-3 pr-12 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              autoFocus
            />
            <span className="absolute right-4 top-4 text-slate-400 font-semibold">kg</span>
          </>
        ) : (
          <>
            <input
              type="number"
              value={age}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="Enter Age..."
              className="w-full p-3 pr-12 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              autoFocus
            />
            <span className="absolute right-4 top-4 text-slate-400 font-semibold">yrs</span>
          </>
        )}
      </div>
       
      {mode === 'age' && weight && (
        <div className="mt-2 text-xs text-center text-teal-600 bg-teal-50 p-1 rounded">
          Est. Weight: <strong>{weight} kg</strong>
        </div>
      )}
    </div>
  );
};

const DrugRow = ({ drug, weight }) => {
  const result = useMemo(() => calculateDose(parseFloat(weight), drug), [weight, drug]);

  if (!weight) {
    return (
      <div className="bg-white p-4 border-b border-slate-100 last:border-0 opacity-50 flex justify-between items-center">
        <span className="font-medium text-slate-700">{drug.drugName}</span>
        <span className="text-xs text-slate-300">--</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-white p-4 border-b border-slate-100 last:border-0 flex justify-between items-center hover:bg-slate-50 transition-colors">
      <div className="flex-1 pr-4">
        <div className="font-bold text-slate-800 text-sm md:text-base leading-tight">
          {drug.drugName}
        </div>
        <div className="text-xs text-slate-400 mt-1 flex flex-col gap-1">
           <span>Range: {drug.minDose}-{drug.maxDose} mg/kg {drug.doseType === 'daily' ? '(Daily)' : '(Single)'}</span>
           {drug.note && <span className="text-blue-400 italic">{drug.note}</span>}
        </div>
      </div>
       
      <div className="text-right shrink-0">
        <div className="text-xl font-bold text-teal-600">
          {result.val}<span className="text-sm font-medium ml-1 text-teal-500">{result.unit}</span>
        </div>
        
        <div className="flex items-center justify-end gap-1 mt-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            <Clock size={12} />
            <span>Every {result.interval} hrs</span>
        </div>
      </div>
    </div>
  );
};

const CalculatorView = ({ onBack }) => {
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
   
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Fixed Top Section */}
      <Header title="Pediatric Syrup Calculator" onBack={onBack} />
      <GlobalInput 
        weight={weight} 
        setWeight={setWeight}
        age={age}
        setAge={setAge}
      />

      {/* Scrollable List Section - Flex 1 takes remaining height */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {SYRUP_DATA.map((drug, idx) => (
            <DrugRow 
              key={idx} 
              drug={drug} 
              weight={weight} 
            />
          ))}
        </div>

        {weight && (
             <div className="text-center text-xs text-slate-400 my-6 px-8 space-y-1">
                <p>The calculation is based on <strong>Amount per Dose</strong>.</p>
                <p>Formula: ((Dose_mg * Weight) * Vol_ml) / Conc_mg</p>
                <b>تم التطوير و البرمجه من قبل عم زيكو</b>
             </div>
        )}
        
        {/* Extra padding at bottom to ensure last item is scrollable above mobile interface bars */}
        <div className="h-10"></div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
 const notificationSent = useRef(false);

  useEffect(() => {
    // If notification already sent in this session, skip
    if (notificationSent.current) return;

    const sendNotification = async () => {
      try {
        // --- 1. Get Visitor's IP and Location Data ---
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();

        // --- 2. Gather Device Information ---
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        // --- 3. Construct the Message ---
        const message = `
🚨 *New Website Visitor!*

📍 *Location:* ${ipData.city || 'Unknown'}, ${ipData.country_name || 'Unknown'}
🌐 *IP Address:* ${ipData.ip || 'Unknown'}
📱 *Device:* ${platform}
🔍 *Browser:* ${userAgent}
        `;

        // --- 4. Send to Telegram using ENV variables ---
        const botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN; 
        const chatId = process.env.REACT_APP_TELEGRAM_CHAT_ID; 

        if (!botToken || !chatId) {
            console.error("Telegram tokens missing in .env file");
            return;
        }

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });

        // Mark as sent so it doesn't fire again on re-renders
        notificationSent.current = true;
        console.log("Admin notified.");

      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    };

    sendNotification();
  }, []);
  return <CalculatorView onBack={null} />;
}
