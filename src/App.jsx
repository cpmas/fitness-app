import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine, ZAxis 
} from 'recharts';
import { 
  Activity, Scale, TrendingDown, Target, ChevronLeft, ChevronRight, 
  Calendar, Flame, Zap, BarChart2, Info, CheckCircle2, AlertTriangle, ChevronUp, Calculator,
  Home, Edit3, LineChart as ChartIcon, Settings, LogOut, User, Lock, Mail, Loader2
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, query 
} from 'firebase/firestore';

// Firebase Configuration Setup
const firebaseConfig = {
  apiKey: "AIzaSyAT1aGWanhReREClYIkn_T5iAo-iputReo",
  authDomain: "fitness-app-d08b8.firebaseapp.com",
  projectId: "fitness-app-d08b8",
  storageBucket: "fitness-app-d08b8.firebasestorage.app",
  messagingSenderId: "579758861508",
  appId: "1:579758861508:web:bdeb32121929e51ff1ed91",
  measurementId: "G-773XWW7ZC7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'fitness-correlator';

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-slate-200">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-500 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fitness Correlator</h1>
          <p className="text-slate-400 text-sm mt-1">Data-driven body recomposition</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <div className="flex items-center bg-slate-900/50 rounded-xl border border-slate-700 focus-within:border-blue-500 px-4 py-3 transition-colors">
              <Mail className="w-5 h-5 text-slate-500 mr-3" />
              <input 
                type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="bg-transparent w-full outline-none text-white placeholder-slate-500"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center bg-slate-900/50 rounded-xl border border-slate-700 focus-within:border-blue-500 px-4 py-3 transition-colors">
              <Lock className="w-5 h-5 text-slate-500 mr-3" />
              <input 
                type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="bg-transparent w-full outline-none text-white placeholder-slate-500"
              />
            </div>
          </div>
          
          {error && <div className="text-rose-400 text-xs bg-rose-400/10 p-3 rounded-lg border border-rose-500/20">{error}</div>}
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-700 pt-6">
          <button onClick={handleGuestLogin} disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3.5 rounded-xl transition-all mb-4">
            Continue as Guest
          </button>
          <p className="text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 font-bold hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('entry'); // Default to entry for new users
  
  // Data Entry State
  const [currentDateStr, setCurrentDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    weight: '', bodyFat: '', caloriesIn: '', caloriesOut: '', steps: ''
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Deficit Analysis State
  const [deficitTimeframe, setDeficitTimeframe] = useState(30);

  useEffect(() => {
    // Check for provided platform auth token first
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (err) {
        console.error("Auth Token Error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthResolved(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    // Listen to user's private data collection
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'entries'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setEntries(data);
    }, (error) => {
      console.error("Firestore error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const processedData = useMemo(() => {
    if (!entries.length) return [];
    let sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return sorted.map((entry, index, arr) => {
      // 7-Day Moving Average for Weight
      let weightSum = 0;
      let count = 0;
      for (let i = 0; i < 7; i++) {
        if (arr[index - i] && arr[index - i].weight) {
          weightSum += arr[index - i].weight;
          count++;
        }
      }
      const weightMA = count > 0 ? parseFloat((weightSum / count).toFixed(1)) : entry.weight;
      const netCalories = entry.caloriesIn && entry.caloriesOut ? entry.caloriesIn - entry.caloriesOut : 0;

      return {
        ...entry,
        weightMA,
        netCalories,
        displayDate: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [entries]);

  const scatterData = useMemo(() => {
    const data = [];
    if (processedData.length < 4) return data;
    for (let i = 0; i < processedData.length - 3; i++) {
      const day = processedData[i];
      if (day.steps && day.weightMA && processedData[i+3].weightMA) {
        const weightChange = parseFloat((processedData[i+3].weightMA - day.weightMA).toFixed(2));
        data.push({ x: day.steps, y: weightChange, name: day.displayDate });
      }
    }
    return data;
  }, [processedData]);

  const getInsights = (days) => {
    if (processedData.length < 2) return null;
    const recent = processedData.slice(-days);
    if (recent.length < 2) return null;

    const validIn = recent.filter(d => d.caloriesIn);
    const validOut = recent.filter(d => d.caloriesOut);
    
    const avgIn = validIn.length ? validIn.reduce((sum, d) => sum + d.caloriesIn, 0) / validIn.length : 0;
    const avgOutTracker = validOut.length ? validOut.reduce((sum, d) => sum + d.caloriesOut, 0) / validOut.length : 0;
    
    // Find the first and last actual valid weights in the timeframe
    const validWeights = recent.filter(d => d.weight);
    const startWeight = validWeights.length > 0 ? validWeights[0].weight : 0;
    const endWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1].weight : 0;
    
    const actualLoss = startWeight - endWeight;
    
    // Expected Loss from Tracker (7700 cals = 1 kg)
    const totalTrackerDeficit = recent.reduce((sum, d) => sum + (d.netCalories || 0), 0);
    const expectedLossTracker = (totalTrackerDeficit * -1) / 7700; 

    // True TDEE Calculation
    const totalCaloriesEaten = avgIn * days;
    const fatCaloriesBurned = actualLoss * 7700;
    const trueTDEE = avgIn > 0 ? (totalCaloriesEaten + fatCaloriesBurned) / days : 0;
    const avgLoggedDeficit = avgOutTracker - avgIn;

    return {
      days,
      avgIn: avgIn.toFixed(0),
      avgOutTracker: avgOutTracker.toFixed(0),
      actualLoss: actualLoss.toFixed(2),
      expectedLossTracker: expectedLossTracker.toFixed(2),
      trueTDEE: trueTDEE.toFixed(0),
      trackerDiscrepancy: (trueTDEE - avgOutTracker).toFixed(0), 
      avgDeficit: (trueTDEE - avgIn).toFixed(0),
      avgLoggedDeficit: avgLoggedDeficit.toFixed(0)
    };
  };

  const insights30 = getInsights(30);
  const insights7 = getInsights(7);

  const cumulativeAnalysis = useMemo(() => {
    if (processedData.length === 0) return { chartData: [], summary: null };
    const recentData = processedData.slice(-deficitTimeframe);
    if (recentData.length === 0) return { chartData: [], summary: null };

    // Find the actual start and end weights for the given timeframe
    const validWeights = recentData.filter(d => d.weight);
    const startWeight = validWeights.length > 0 ? validWeights[0].weight : 0;
    const endWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1].weight : 0;

    let cumulativeNet = 0;
    let previousCumulativeNet = 0;

    const chartData = recentData.map(day => {
      // 1-Day Lag: Expected weight for today's morning weigh-in is based on accumulated net from previous days
      const expectedWeight = startWeight + (previousCumulativeNet / 7700);

      if (day.caloriesIn && day.caloriesOut) {
        cumulativeNet += day.netCalories;
      }
      previousCumulativeNet = cumulativeNet;

      return {
        ...day,
        cumulativeNet,
        expectedWeight: parseFloat(expectedWeight.toFixed(2)),
        actualWeight: day.weight || null
      };
    });

    const actualLoss = startWeight - endWeight;
    const expectedLoss = (cumulativeNet * -1) / 7700;
    const diff = expectedLoss - actualLoss;

    return {
      chartData,
      summary: {
        startWeight: startWeight.toFixed(1),
        endWeight: endWeight.toFixed(1),
        cumulativeNet,
        actualLoss: actualLoss.toFixed(2),
        expectedLoss: expectedLoss.toFixed(2),
        discrepancy: Math.abs(diff).toFixed(2),
        isBehind: diff > 0 
      }
    };
  }, [processedData, deficitTimeframe]);

  useEffect(() => {
    const existing = entries.find(e => e.date === currentDateStr);
    if (existing) {
      setFormData(existing);
    } else {
      const priorEntries = entries.filter(e => e.date < currentDateStr).sort((a, b) => new Date(b.date) - new Date(a.date));
      if (priorEntries.length > 0) {
        setFormData({
          weight: priorEntries[0].weight || '',
          bodyFat: priorEntries[0].bodyFat || '',
          caloriesIn: priorEntries[0].caloriesIn || '', 
          caloriesOut: '', 
          steps: ''
        });
      } else {
        setFormData({ weight: '', bodyFat: '', caloriesIn: '', caloriesOut: '', steps: '' });
      }
    }
  }, [currentDateStr, entries]);

  const handleDateChange = (offset) => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + offset);
    setCurrentDateStr(d.toISOString().split('T')[0]);
    setSaveStatus('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveStatus('');
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const newEntry = {
      date: currentDateStr,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
      caloriesIn: formData.caloriesIn ? parseInt(formData.caloriesIn) : null,
      caloriesOut: formData.caloriesOut ? parseInt(formData.caloriesOut) : null,
      steps: formData.steps ? parseInt(formData.steps) : null,
      timestamp: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'entries', currentDateStr);
      await setDoc(docRef, newEntry);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setEntries([]);
  };

  if (!authResolved) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (!user) return <AuthScreen />;

  const MetricCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-slate-400 text-xs font-medium leading-tight">{title}</h3>
        <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-[10px] text-slate-500 mt-1">{subtext}</div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-slate-700 mt-10 text-center animate-in fade-in">
      <div className="bg-slate-700/50 p-4 rounded-full mb-4">
        <Activity className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No Data Yet</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-xs">Log a few days of weight and calories in the Entry tab to start generating insights.</p>
      <button onClick={() => setActiveTab('entry')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition">
        Go to Entry Log
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-24">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-1.5 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">Fitness Correlator</h1>
          </div>
          <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-slate-800 rounded-full transition">
            <User className={`w-5 h-5 ${activeTab === 'settings' ? 'text-blue-400' : 'text-slate-400'}`} />
          </button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        
        {/* --- VIEW: DATA ENTRY --- */}
        {activeTab === 'entry' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl">
              <div className="flex justify-between items-center mb-6 bg-slate-900/50 rounded-xl p-2">
                <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-white">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</span>
                  <input 
                    type="date" 
                    value={currentDateStr}
                    onChange={(e) => setCurrentDateStr(e.target.value)}
                    className="bg-transparent text-lg font-bold text-white outline-none text-center cursor-pointer [color-scheme:dark]"
                  />
                </div>
                <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-white">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Weight (kg)*</label>
                    <input type="number" inputMode="decimal" name="weight" value={formData.weight} onChange={handleInputChange} 
                      className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-slate-600" placeholder="0.0" step="0.1" />
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">Body Fat %</label>
                    <input type="number" inputMode="decimal" name="bodyFat" value={formData.bodyFat} onChange={handleInputChange} 
                      className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-slate-600" placeholder="0.0" step="0.1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <label className="text-[10px] text-orange-400 font-semibold mb-1 block uppercase tracking-wider">Calories In</label>
                    <input type="number" inputMode="numeric" name="caloriesIn" value={formData.caloriesIn} onChange={handleInputChange} 
                      className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-slate-600" placeholder="0" />
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <label className="text-[10px] text-blue-400 font-semibold mb-1 block uppercase tracking-wider">Cals Out (TDEE)</label>
                    <input type="number" inputMode="numeric" name="caloriesOut" value={formData.caloriesOut} onChange={handleInputChange} 
                      className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-slate-600" placeholder="0" />
                  </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <label className="text-[10px] text-green-400 font-semibold mb-1 block uppercase tracking-wider">Steps</label>
                  <input type="number" inputMode="numeric" name="steps" value={formData.steps} onChange={handleInputChange} 
                    className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-slate-600" placeholder="0" />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} 
                  {isSaving ? 'Saving...' : 'Save Day to Cloud'}
                </button>
                {saveStatus && <span className="text-sm text-emerald-400 font-medium text-center animate-pulse">{saveStatus}</span>}
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-4">Smart defaults applied from previous entries.</p>
          </div>
        )}

        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {entries.length === 0 ? <EmptyState /> : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard 
                    title="7-Day Weight Change" 
                    value={`${insights7?.actualLoss > 0 ? '-' : '+'}${Math.abs(insights7?.actualLoss || 0).toFixed(1)} kg`}
                    subtext={`Avg: ${processedData[processedData.length-1]?.weightMA || 0} kg`}
                    icon={Scale} colorClass="text-emerald-400"
                  />
                  <MetricCard 
                    title="Avg Logged Deficit" 
                    value={`${insights30?.avgLoggedDeficit || 0} kcal`}
                    subtext="Based on user logs (30d)"
                    icon={Target} colorClass="text-orange-400"
                  />
                  <MetricCard 
                    title="Current Body Fat" 
                    value={`${processedData[processedData.length-1]?.bodyFat || 0}%`}
                    subtext="Latest entry"
                    icon={Activity} colorClass="text-blue-400"
                  />
                  <MetricCard 
                    title="Avg Steps (30d)" 
                    value={Math.round(processedData.reduce((sum, d) => sum + (d.steps||0), 0) / (processedData.length||1)).toLocaleString()}
                    subtext="Daily average"
                    icon={Zap} colorClass="text-yellow-400"
                  />
                </div>

                {/* GRAPH A: Composition Shift (Hero Graph) */}
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-500" /> Composition Shift
                    </h2>
                  </div>
                  <div className="h-56 -ml-2 mr-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} minTickGap={30} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} orientation="left" domain={['auto', 'auto']} width={40} tickMargin={2} />
                        <YAxis yAxisId="right" stroke="#10b981" fontSize={10} orientation="right" domain={['auto', 'auto']} width={40} tickMargin={2} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="weight" name="Daily Wt (kg)" stroke="#3b82f6" strokeWidth={1.5} dot={{r:1}} connectNulls opacity={0.5}/>
                        <Line yAxisId="right" type="monotone" dataKey="bodyFat" name="Body Fat %" stroke="#10b981" strokeWidth={2.5} dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-emerald-400">What this shows:</strong> Watch for the <span className="text-emerald-400 font-medium">Body Fat %</span> line to trend downwards even if your <span className="text-blue-400 font-medium">Daily Weight</span> fluctuates. A dropping body fat percentage while weight stays stable indicates successful recomposition (building muscle while losing fat).
                    </p>
                  </div>
                </div>

                {/* GRAPH B: Intake vs. Burn Trend */}
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" /> Intake vs. Burn Trend
                    </h2>
                  </div>
                  <div className="h-56 -ml-2 mr-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} minTickGap={30} />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} width={40} tickMargin={2} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="caloriesOut" name="Burned (TDEE)" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                        <Line type="monotone" dataKey="caloriesIn" name="Eaten (Intake)" stroke="#f97316" strokeWidth={2.5} dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-orange-400">What this shows:</strong> Keep your solid <span className="text-orange-400 font-medium">Intake</span> line consistently below your dashed <span className="text-emerald-400 font-medium">Burned</span> line to maintain a calorie deficit. The size of the gap represents your rate of expected weight loss.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- VIEW: DEFICIT (Cumulative Analysis) --- */}
        {activeTab === 'deficit' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {entries.length < 2 ? <EmptyState /> : cumulativeAnalysis.summary && (
              <>
                <div className="flex flex-col gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-400" /> Cumulative Deficit
                  </h2>
                  <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 overflow-x-auto no-scrollbar">
                    {[7, 14, 30, 60].map(days => (
                      <button
                        key={days} onClick={() => setDeficitTimeframe(days)}
                        className={`flex-1 min-w-[70px] px-2 py-1.5 text-xs rounded-md font-medium transition-all ${
                          deficitTimeframe === days ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Accumulated Net</div>
                    <div className="text-lg font-bold text-emerald-400 leading-none">
                      {cumulativeAnalysis.summary.cumulativeNet > 0 ? '+' : ''}{cumulativeAnalysis.summary.cumulativeNet.toLocaleString()} <span className="text-xs font-normal text-slate-500">cal</span>
                    </div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Math Expected</div>
                    <div className="text-lg font-bold text-indigo-400 leading-none">
                      {cumulativeAnalysis.summary.expectedLoss > 0 ? '-' : '+'}{Math.abs(cumulativeAnalysis.summary.expectedLoss).toFixed(2)} <span className="text-xs font-normal text-slate-500">kg</span>
                    </div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-center">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Scale Actual</div>
                    <div className="text-lg font-bold text-blue-400 leading-none">
                      {cumulativeAnalysis.summary.actualLoss > 0 ? '-' : '+'}{Math.abs(cumulativeAnalysis.summary.actualLoss).toFixed(2)} <span className="text-xs font-normal text-slate-500">kg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white mb-1">Math vs Reality Trend</h3>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      <span className="text-indigo-400">Purple line</span> is expected weight (7700cal/kg). 
                      <span className="text-blue-400"> Blue line</span> is actual weight.
                    </p>
                  </div>
                  <div className="h-72 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={cumulativeAnalysis.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={10} tickMargin={5} minTickGap={30} />
                        <YAxis yAxisId="weight" stroke="#94a3b8" fontSize={10} orientation="left" domain={['auto', 'auto']} width={40} tickMargin={2} />
                        <YAxis yAxisId="deficit" stroke="#10b981" fontSize={10} orientation="right" domain={['auto', 'auto']} tickFormatter={(val) => `${val/1000}k`} width={40} tickMargin={2} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                        <Line yAxisId="weight" type="monotone" dataKey="expectedWeight" name="Expected" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line yAxisId="weight" type="monotone" dataKey="actualWeight" name="Actual" stroke="#3b82f6" strokeWidth={2.5} dot={false} connectNulls />
                        <Bar yAxisId="deficit" dataKey="cumulativeNet" name="Accumulated Cals" fill="#10b981" opacity={0.15} radius={[0, 0, 2, 2]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                     <Info className="w-4 h-4 text-blue-400" /> Math vs Reality
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    The <strong className="text-indigo-400">Expected line</strong> projects your weight purely based on the calorie deficit you have logged (7,700 cals = 1kg).
                  </p>
                  <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4 marker:text-slate-500">
                    <li>If your <span className="text-blue-400 font-medium">Actual line</span> is consistently <strong>above</strong> the expected line, you may be eating more than you are tracking, or your tracker is overestimating your burn.</li>
                    <li>If it sits <strong>below</strong> the expected line, you might be burning more energy than your tracker realizes!</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- VIEW: INSIGHTS --- */}
        {activeTab === 'insights' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             {entries.length < 5 ? <EmptyState /> : insights30 && (
              <>
                <div className="bg-gradient-to-br from-blue-900/40 to-slate-800 border border-blue-800/50 p-5 rounded-2xl shadow-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
                      <BarChart2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">True TDEE Engine</h2>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Eating an avg of <strong className="text-orange-400">{insights30.avgIn} cals</strong> and losing <strong className="text-emerald-400">{insights30.actualLoss} kg</strong>, 
                    your actual TDEE is <strong className="text-blue-400 text-lg">{insights30.trueTDEE} cals</strong>.
                  </p>
                  
                  {insights30.trackerDiscrepancy < -200 ? (
                    <div className="mt-3 flex gap-2 items-start text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">Your tracker claims {insights30.avgOutTracker} cals. It is <strong>overestimating by ~{Math.abs(insights30.trackerDiscrepancy)} cals</strong>.</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2 items-start text-slate-300 bg-slate-700/50 p-3 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">Your tracker ({insights30.avgOutTracker} cals) is highly accurate compared to actual math.</p>
                    </div>
                  )}
                </div>
              </>
             )}
          </div>
        )}

        {/* --- VIEW: SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-900/50 border-b border-slate-700 flex flex-col items-center">
                <div className="bg-slate-700 p-4 rounded-full mb-3">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-lg font-bold text-white">{user.isAnonymous ? 'Guest User' : user.email}</h2>
                <p className="text-xs text-slate-500 font-mono mt-1 break-all px-4 text-center">ID: {user.uid}</p>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl mb-4 border border-slate-700/50">
                  <span className="text-sm text-slate-300 font-medium">Total Entries</span>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">{entries.length} logs</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-3.5 rounded-xl font-bold transition-all border border-rose-500/20"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-6">All data is securely synced to Firebase Cloud Storage.</p>
          </div>
        )}

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe pt-2 px-2 z-50">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {[
            { id: 'dashboard', icon: ChartIcon, label: 'Dash' },
            { id: 'deficit', icon: Calculator, label: 'Deficit' },
            { id: 'entry', icon: Edit3, label: 'Log' },
            { id: 'insights', icon: Info, label: 'Insights' }
          ].map((tab) => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-2' : 'stroke-[1.5]'}`} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}