import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts';
import {
  LayoutDashboard, Map, FileSpreadsheet, History, Settings, LogOut,
  Upload, Download, Save, Search, Filter, Plus, Trash2, Lock, User as UserIcon,
  ChevronRight, ShieldCheck, AlertCircle, FileJson, FileText, Database, Menu, X, ChevronDown,
  TrendingUp, Calendar, ArrowLeft, Briefcase, Eraser, CheckCircle, BarChart2, Layers, AlertTriangle, LockKeyhole, CircleDashed,
  FileImage, FileType, Check, PieChart as PieChartIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Types ---

type UserRole = 'admin' | 'manager' | 'viewer';
type RecordStatus = 'pending' | 'confirmed';
type TableMode = 'input' | 'admin';

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface MaterialRecord {
  id: string;
  region: string;
  comarca: string;
  category: string;
  materialName: string;
  unit: string;
  historicalDemand: number;
  predictedDemand: number; // Base value (Semestral by default logic)
  requestedQty: number;    // Qtd. Solicitada
  approvedQty: number;     // Qtd. Atendida (New column for Admin)
  status: RecordStatus;    // Tracks if item has valid input
  lastUpdated: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// --- Utilities ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const nowISO = () => new Date().toISOString();

// --- Components ---

const Card = ({ children, className = "", id = "" }: { children?: React.ReactNode; className?: string; id?: string }) => (
  <div id={id} className={`bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', icon: Icon, className = "", disabled = false, title = "" }: any) => {
  const base = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 shadow-md",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20 shadow-md",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 shadow-md",
    outline: "border border-slate-600 text-slate-300 hover:bg-slate-800"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`} title={title}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const PinPad = ({ target, onUnlock, onCancel }: { target: string; onUnlock: () => void; onCancel: () => void }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleNum = (num: number) => {
    if (pin.length < 4) setPin(prev => prev + num);
    setError("");
  };

  const handleVerify = () => {
    if (pin === "1234") {
      onUnlock();
    } else {
      setError("PIN Incorreto. Tente 1234.");
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
      <Card className="w-80 p-6 bg-slate-900 border-slate-600 shadow-2xl shadow-black">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">Acesso Restrito</h3>
          <p className="text-slate-400 text-sm mt-2">Informe o PIN da comarca <br/><span className="text-blue-400 font-mono font-bold text-lg">{target}</span></p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-blue-500 scale-110' : 'bg-slate-700'}`} />
          ))}
        </div>

        {error && <div className="text-red-400 text-xs text-center mb-4 bg-red-900/20 py-2 rounded animate-pulse">{error}</div>}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleNum(num)} className="h-14 bg-slate-800 hover:bg-slate-700 rounded-xl text-xl font-bold text-white transition-colors border border-slate-700 hover:border-slate-500 shadow-lg">
              {num}
            </button>
          ))}
          <button onClick={() => setPin(prev => prev.slice(0, -1))} className="h-14 bg-slate-800 hover:bg-red-900/30 text-red-400 rounded-xl flex items-center justify-center border border-slate-700 hover:border-red-800/50">
             <Trash2 size={20} />
          </button>
          <button onClick={() => handleNum(0)} className="h-14 bg-slate-800 hover:bg-slate-700 rounded-xl text-xl font-bold text-white border border-slate-700 hover:border-slate-500">0</button>
          <button onClick={handleVerify} className="h-14 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-blue-900/50 shadow-lg">
            <ChevronRight size={28} />
          </button>
        </div>
        <button onClick={onCancel} className="w-full mt-6 text-slate-500 hover:text-slate-300 text-sm py-2">Cancelar Acesso</button>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <Card className="p-5 relative overflow-hidden transition-transform hover:scale-[1.02] border-t-4 border-t-transparent hover:border-t-white/10">
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl ${color}`} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2">{title}</p>
        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20 text-white shadow-inner`}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

const DashboardView = ({ data }: { data: MaterialRecord[] }) => {
  const [timePeriod, setTimePeriod] = useState<'trimestre' | 'semestre' | 'anual'>('anual');
  
  const totalRequested = data.reduce((acc, curr) => acc + (Number(curr.requestedQty) || 0), 0);
  const totalApproved = data.reduce((acc, curr) => acc + (Number(curr.approvedQty) || 0), 0);
  const fulfillmentRate = totalRequested > 0 ? (totalApproved / totalRequested) * 100 : 0;
  
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    data.forEach(d => {
      cats[d.category] = (cats[d.category] || 0) + Number(d.requestedQty);
    });
    return Object.keys(cats).map(k => ({ name: k, value: cats[k] }));
  }, [data]);

  // Dynamic Data based on Time Period
  const historyData = useMemo(() => {
     const fullData = [
      { name: 'Jan', current: 4000, previous: 2400 },
      { name: 'Fev', current: 3000, previous: 1398 },
      { name: 'Mar', current: 2000, previous: 9800 },
      { name: 'Abr', current: 2780, previous: 3908 },
      { name: 'Mai', current: 1890, previous: 4800 },
      { name: 'Jun', current: 2390, previous: 3800 },
      { name: 'Jul', current: 3490, previous: 4300 },
      { name: 'Ago', current: 4000, previous: 3200 },
      { name: 'Set', current: 3200, previous: 3800 },
      { name: 'Out', current: 4100, previous: 4200 },
      { name: 'Nov', current: 3800, previous: 4000 },
      { name: 'Dez', current: 4500, previous: 4800 },
    ];

    if (timePeriod === 'trimestre') return fullData.slice(9, 12); // Last 3 months (Oct-Dec sample)
    if (timePeriod === 'semestre') return fullData.slice(6, 12); // Last 6 months
    return fullData; // Anual
  }, [timePeriod]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // Customized label for Area Chart
  const renderCustomizedLabel = (props: any) => {
    const { x, y, value, index } = props;
    return (
      <text x={x} y={y} dy={-10} fill="#cbd5e1" fontSize={10} textAnchor="middle" fontWeight="bold">
        {value}
      </text>
    );
  };

  // Customized label for Pie Chart
  const RADIAN = Math.PI / 180;
  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
     // Only show text inside if slice is big enough
     if (percent < 0.1) return null;
     
     return (
       <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
         {`${(percent * 100).toFixed(0)}%`}
       </text>
     );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Itens Solicitados" value={totalRequested.toLocaleString()} subtext="Total de demandas criadas" icon={History} color="bg-blue-500" />
        <StatCard title="Itens Atendidos" value={totalApproved.toLocaleString()} subtext="Aprovados após validação" icon={ShieldCheck} color="bg-emerald-500" />
        <StatCard title="Taxa de Atendimento" value={`${fulfillmentRate.toFixed(1)}%`} subtext="Atendido vs Solicitado" icon={LayoutDashboard} color="bg-purple-500" />
        <StatCard title="Regiões Ativas" value={new Set(data.map(d => d.comarca)).size} subtext="Comarcas com movimentação" icon={Map} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <div className="w-1 h-6 bg-blue-500 rounded-full"/>
               Comparativo Histórico
             </h3>
             
             {/* Time Filters */}
             <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 shadow-inner">
                {['trimestre', 'semestre', 'anual'].map((period) => (
                   <button
                      key={period}
                      onClick={() => setTimePeriod(period as any)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all duration-200 ${timePeriod === period ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                   >
                      {period}
                   </button>
                ))}
             </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                   itemStyle={{ padding: 0 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Area 
                   type="monotone" 
                   dataKey="current" 
                   name="Atual" 
                   stroke="#3b82f6" 
                   strokeWidth={3} 
                   fillOpacity={1} 
                   fill="url(#colorCur)"
                   activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                >
                   <LabelList dataKey="current" content={renderCustomizedLabel} />
                </Area>
                <Area 
                   type="monotone" 
                   dataKey="previous" 
                   name="Anterior" 
                   stroke="#64748b" 
                   strokeWidth={3} 
                   strokeDasharray="5 5" 
                   fillOpacity={1} 
                   fill="url(#colorPrev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-purple-500 rounded-full"/>
            Consumo por Categoria
          </h3>
          <div className="h-80 relative">
            {/* Center Text for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-4xl font-bold text-white">{totalRequested > 1000 ? `${(totalRequested/1000).toFixed(1)}k` : totalRequested}</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Itens</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                   formatter={(value: number) => [value.toLocaleString(), 'Qtd.']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SmartTable = ({ 
    data, 
    onUpdate, 
    selectedRegion,
    mode = 'input'
}: { 
    data: MaterialRecord[], 
    onUpdate: (id: string, field: string, val: any) => void, 
    selectedRegion?: string | null,
    mode?: TableMode
}) => {
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState("Todos");
  const [period, setPeriod] = useState<'semestral' | 'anual'>('semestral');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const categories = ["Todos", ...Array.from(new Set(data.map(d => d.category)))];

  const filtered = data.filter(d => {
    // If a region is strictly selected (via Map drilldown), only show that region
    if (selectedRegion && d.comarca !== selectedRegion) return false;

    const matchesText = 
      d.materialName.toLowerCase().includes(filter.toLowerCase()) || 
      d.comarca.toLowerCase().includes(filter.toLowerCase());
    const matchesCat = catFilter === "Todos" || d.category === catFilter;
    return matchesText && matchesCat;
  });

  // Progress Calculation
  const totalItems = filtered.length;
  const filledItems = filtered.filter(i => i.status === 'confirmed').length;
  const progressPercent = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  // Multiplier logic: If Annual is selected, double the predicted demand (assuming base is semestral)
  const multiplier = period === 'anual' ? 2 : 1;

  // Export Logic
  const handleExport = async (format: 'excel' | 'csv' | 'pdf' | 'jpeg') => {
    setShowExportMenu(false);
    const exportRows = filtered;

    if (format === 'excel') {
       // HTML Table generation for correct Column parsing in Excel
       const tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head>
        <body>
          <table border="1">
            <thead>
              <tr>
                <th style="background-color: #f0f0f0;">Região</th>
                <th style="background-color: #f0f0f0;">Comarca</th>
                <th style="background-color: #f0f0f0;">Categoria</th>
                <th style="background-color: #f0f0f0;">Material</th>
                <th style="background-color: #f0f0f0;">Previsão (${period})</th>
                <th style="background-color: #f0f0f0;">Qtd. Solicitada</th>
                <th style="background-color: #f0f0f0;">Qtd. Atendida</th>
                <th style="background-color: #f0f0f0;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${exportRows.map(item => {
                 const statusText = mode === 'admin' 
                    ? (item.approvedQty > 0 ? 'Validado' : (item.requestedQty > 0 ? 'Aguardando' : 'Pendente'))
                    : (item.requestedQty > 0 ? 'Preenchido' : 'Pendente');
                 return `
                  <tr>
                    <td>${item.region}</td>
                    <td>${item.comarca}</td>
                    <td>${item.category}</td>
                    <td>${item.materialName}</td>
                    <td>${item.predictedDemand * multiplier}</td>
                    <td>${item.requestedQty}</td>
                    <td>${item.approvedQty}</td>
                    <td>${statusText}</td>
                  </tr>
                 `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
       `;
       const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `Relatorio_${selectedRegion || 'Geral'}_${nowISO().slice(0,10)}.xls`;
       a.click();

    } else if (format === 'csv') {
      // CSV with BOM for UTF-8 Support
      const headers = "Região,Comarca,Categoria,Material,Previsão,Qtd. Solicitada,Qtd. Atendida,Status";
      const rows = exportRows.map(item => {
        const statusText = mode === 'admin' 
            ? (item.approvedQty > 0 ? 'Validado' : (item.requestedQty > 0 ? 'Aguardando' : 'Pendente'))
            : (item.requestedQty > 0 ? 'Preenchido' : 'Pendente');
        return `"${item.region}","${item.comarca}","${item.category}","${item.materialName}",${item.predictedDemand * multiplier},${item.requestedQty},${item.approvedQty},"${statusText}"`;
      }).join('\n');
      
      const content = `\uFEFF${headers}\n${rows}`;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_${selectedRegion || 'Geral'}_${nowISO().slice(0,10)}.csv`;
      a.click();

    } else if (format === 'pdf' || format === 'jpeg') {
      const elementToCapture = document.getElementById('export-table-container');
      if (!elementToCapture) return;

      try {
        const canvas = await html2canvas(elementToCapture, {
            scale: 2, // Higher scale for better resolution
            backgroundColor: '#ffffff', // Force white background
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                const element = clonedDoc.getElementById('export-table-container');
                if (element) {
                    // 1. RESET CONTAINER LAYOUT TO FULL WIDTH
                    // We force a very large width to ensure ALL columns fit horizontally without scrolling
                    element.style.width = '2400px'; 
                    element.style.minHeight = 'fit-content';
                    element.style.height = 'auto';
                    element.style.position = 'absolute'; // Take out of flow
                    element.style.left = '0';
                    element.style.top = '0';
                    element.style.backgroundColor = '#ffffff'; // White bg
                    element.style.color = '#1a1a1a'; // Dark text
                    element.style.padding = '40px'; // Page padding
                    element.style.overflow = 'visible'; // No internal scrollbars

                    // 2. EXPAND SCROLL AREAS
                    const scrollAreas = element.querySelectorAll('.scroll-area');
                    scrollAreas.forEach((el: any) => {
                        el.style.overflow = 'visible';
                        el.style.height = 'auto';
                        el.style.maxHeight = 'none';
                        el.style.width = '100%';
                    });

                    // 3. RESET TABLE WIDTHS
                    const table = element.querySelector('table');
                    if (table) {
                        table.style.width = '100%';
                        table.style.tableLayout = 'auto'; // Let columns expand naturally
                    }
                    
                    // 4. STYLE HEADERS (Remove fixed widths)
                    const ths = element.querySelectorAll('th');
                    ths.forEach((th: any) => {
                        th.style.backgroundColor = '#f1f5f9'; // Light gray
                        th.style.color = '#0f172a'; // Dark Blue
                        th.style.border = '1px solid #cbd5e1'; // Gray border
                        th.style.fontSize = '12px';
                        th.style.width = 'auto'; // IMPORTANT: Unset fixed widths (w-40)
                        th.style.minWidth = '100px'; // Min width to look good
                        th.style.maxWidth = 'none';
                        th.style.whiteSpace = 'nowrap'; // Prevent wrapping
                        th.style.padding = '12px';
                    });

                    // 5. STYLE ROWS & CELLS
                    const trs = element.querySelectorAll('tbody tr');
                    trs.forEach((tr, idx) => {
                        (tr as HTMLElement).style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                    });
                    const tds = element.querySelectorAll('td');
                    tds.forEach((td: any) => {
                        td.style.color = '#334155';
                        td.style.border = '1px solid #e2e8f0';
                        td.style.padding = '10px';
                        td.style.fontSize = '12px';
                        td.style.whiteSpace = 'normal';
                    });

                    // 6. REPLACE INPUTS WITH CLEAN TEXT
                    // Inputs are often the cause of cutoff or weird rendering. We replace them with spans.
                    const inputs = element.querySelectorAll('input');
                    inputs.forEach((input: any) => {
                        const val = input.value;
                        const span = clonedDoc.createElement('span');
                        span.innerText = val;
                        span.style.fontWeight = 'bold';
                        span.style.fontFamily = 'monospace';
                        span.style.fontSize = '14px';
                        // Color based on value
                        if (Number(val) > 0) span.style.color = '#059669'; // Green
                        else span.style.color = '#cbd5e1'; // Gray
                        
                        if (input.parentNode) {
                             input.parentNode.replaceChild(span, input);
                        }
                    });

                    // 7. ADD HEADER TITLE
                    const headerDiv = element.querySelector('.bg-slate-800');
                    if (headerDiv) {
                        (headerDiv as HTMLElement).style.display = 'none'; // Hide original header
                    }
                    const titleDiv = clonedDoc.createElement('div');
                    titleDiv.innerHTML = `
                        <div style="margin-bottom: 20px; border-bottom: 2px solid #334155; padding-bottom: 10px;">
                            <h1 style="font-size: 28px; font-weight: bold; color: #0f172a; margin: 0;">Relatório de Demanda: ${selectedRegion || 'Geral'}</h1>
                            <p style="color: #64748b; margin-top: 5px;">Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                        </div>
                    `;
                    element.prepend(titleDiv);

                    // 8. HIDE UNWANTED ELEMENTS
                    const toHide = element.querySelectorAll('.no-print, .export-menu, .filters-section, .progress-bar-line, button, svg, .status-pill');
                    toHide.forEach((el: any) => el.style.display = 'none');
                    
                    // Make sure Status column text is visible since we hid the pill
                    const statusCells = element.querySelectorAll('td:last-child');
                    statusCells.forEach((td: any) => {
                        const pill = td.querySelector('.status-pill');
                        if (pill) {
                             const text = pill.innerText;
                             td.innerHTML = `<b>${text}</b>`;
                             td.style.textAlign = 'center';
                        }
                    });
                }
            }
        });

        if (format === 'jpeg') {
            const image = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement('a');
            link.download = `Relatorio_${selectedRegion || 'Geral'}_${nowISO().slice(0,10)}.jpg`;
            link.href = image;
            link.click();
        } else {
            // PDF Generation - Landscape A4
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Scale the 2400px wide capture to fit exactly on the A4 Landscape width
            const imgWidth = pageWidth; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Relatorio_${selectedRegion || 'Geral'}_${nowISO().slice(0,10)}.pdf`);
        }
      } catch (err) {
          console.error("Export failed", err);
          alert("Erro ao gerar exportação. Tente novamente.");
      }
    }
  };

  return (
    <Card id="export-table-container" className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 animate-fadeIn shadow-2xl border-slate-700 relative card-container">
      <div className="h-full flex flex-col">
        <style>{`
            @media print {
              @page { margin: 10mm; size: landscape; }
              body { background-color: white !important; color: black !important; }
            }
        `}</style>

        <div className="p-5 border-b border-slate-700 flex flex-wrap gap-4 items-center justify-between bg-slate-800 no-print">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <FileSpreadsheet size={24} />
            </div>
            <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {mode === 'admin' ? 'Gestão de Pedidos' : 'Previsão de Demanda'}
                    {selectedRegion && mode === 'input' && (
                        <span className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1 ${progressPercent === 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                            {progressPercent === 100 ? <CheckCircle size={12}/> : <CircleDashed size={12}/>}
                            {progressPercent}% Completo
                        </span>
                    )}
                </h3>
                {selectedRegion && <span className="text-xs text-blue-400 font-medium">Comarca: {selectedRegion} • {filledItems}/{totalItems} Itens preenchidos</span>}
            </div>
            </div>
            <div className="flex gap-3 items-center filters-section">
            {mode === 'admin' && (
                <div className="relative">
                <Button 
                    variant="outline" 
                    className="h-10 gap-2" 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    icon={Download}
                >
                    Exportar
                </Button>
                {showExportMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 py-1 animate-fadeIn export-menu">
                    <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-emerald-400 flex items-center gap-2"><FileSpreadsheet size={16}/> Excel (.xls)</button>
                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-blue-400 flex items-center gap-2"><FileType size={16}/> CSV (.csv)</button>
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-red-400 flex items-center gap-2"><FileText size={16}/> PDF (Arquivo)</button>
                    <button onClick={() => handleExport('jpeg')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-purple-400 flex items-center gap-2"><FileImage size={16}/> Imagem (JPEG)</button>
                    </div>
                )}
                </div>
            )}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                placeholder="Filtrar material..." 
                className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                />
            </div>
            <select 
                className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none cursor-pointer hover:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
            >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            </div>
        </div>
        
        {/* Progress Bar Line */}
        {selectedRegion && mode === 'input' && (
            <div className="w-full h-1 bg-slate-800 progress-bar-line">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        )}

        <div className="overflow-auto flex-1 custom-scrollbar scroll-area">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 sticky top-0 z-10 text-xs uppercase text-slate-400 font-bold tracking-wider shadow-md">
                <tr>
                <th className="p-4 border-b border-slate-700">Comarca</th>
                <th className="p-4 border-b border-slate-700">Material / Categoria</th>
                {/* Previsão Header with Select */}
                <th className="p-4 border-b border-slate-700 text-right text-blue-400">
                    <div className="flex items-center justify-end gap-2">
                    <span>Previsão</span>
                    <div className="relative no-print">
                        <select 
                        value={period} 
                        onChange={(e) => setPeriod(e.target.value as any)}
                        className="appearance-none bg-blue-900/30 border border-blue-500/30 text-blue-300 text-[10px] py-1 pl-2 pr-6 rounded focus:outline-none cursor-pointer hover:bg-blue-900/50"
                        >
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400" />
                    </div>
                    </div>
                </th>
                
                {/* Qtd. Solicitada */}
                <th className="p-4 border-b border-slate-700 text-right text-amber-400 bg-slate-800/30 border-l border-slate-700 w-40">Qtd. Solicitada</th>
                
                {/* Qtd. Atendida (Only visible/editable in Admin mode, or just visible in Input mode?) */}
                {mode === 'admin' && (
                    <th className="p-4 border-b border-slate-700 text-right text-emerald-400 bg-slate-800/30 border-l border-slate-700 w-40">Qtd. Atendida</th>
                )}

                <th className="p-4 border-b border-slate-700 text-center">Status do Item</th>
                </tr>
            </thead>
            <tbody className="text-slate-300 text-sm divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                <tr>
                    <td colSpan={mode === 'admin' ? 6 : 5} className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <Search size={48} className="opacity-20" />
                    Nenhum registro encontrado para esta seleção.
                    </td>
                </tr>
                ) : filtered.map(item => {
                const displayPrediction = item.predictedDemand * multiplier;
                
                // Dynamic Status Logic based on View Mode
                let isConfirmed = false;
                let isWaiting = false;
                let statusLabel = "Pendente";
                let statusColor = "text-slate-400 bg-slate-800 border-slate-700";
                let statusIcon = <CircleDashed size={14} />;

                if (mode === 'input') {
                    if (item.requestedQty > 0) {
                        isConfirmed = true;
                        statusLabel = "Preenchido";
                        statusColor = "text-emerald-400 bg-emerald-900/10 border-emerald-500/20";
                        statusIcon = <CheckCircle size={14} />;
                    }
                } else {
                    // Admin Mode Logic
                    if (item.approvedQty > 0) {
                        statusLabel = "Validado";
                        statusColor = "text-emerald-400 bg-emerald-900/10 border-emerald-500/20";
                        statusIcon = <ShieldCheck size={14} />;
                    } else if (item.requestedQty > 0) {
                        isWaiting = true;
                        statusLabel = "Aguardando";
                        statusColor = "text-amber-400 bg-amber-900/10 border-amber-500/20";
                        statusIcon = <AlertCircle size={14} />;
                    }
                }

                return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4">
                        <div className="font-medium text-white">{item.comarca}</div>
                        <div className="text-xs text-slate-500">{item.region}</div>
                    </td>
                    <td className="p-4">
                        <div className="font-medium text-slate-200">{item.materialName}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-700 text-slate-400 mt-1 tracking-wide">
                        {item.category}
                        </span>
                    </td>
                    
                    <td className="p-4 text-right font-bold text-blue-300 font-mono text-base">
                        {displayPrediction}
                    </td>

                    {/* Solicitada Input */}
                    <td className="p-4 text-right bg-slate-800/20 border-l border-slate-800">
                        <input 
                        type="number"
                        disabled={mode === 'admin'} // Read-only in admin mode
                        className={`w-full text-right bg-slate-950 border border-slate-700 rounded px-2 py-2 text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none font-bold font-mono transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-transparent disabled:border-none ${item.requestedQty > 0 ? 'border-amber-500/30' : ''}`}
                        value={item.requestedQty}
                        onChange={(e) => onUpdate(item.id, 'requestedQty', e.target.value)}
                        />
                    </td>

                    {/* Atendida Input (Admin Mode Only) */}
                    {mode === 'admin' && (
                        <td className="p-4 text-right bg-slate-800/20 border-l border-slate-800">
                        <input 
                            type="number"
                            className={`w-full text-right bg-slate-950 border border-slate-700 rounded px-2 py-2 text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none font-bold font-mono transition-all`}
                            value={item.approvedQty}
                            onChange={(e) => onUpdate(item.id, 'approvedQty', e.target.value)}
                            placeholder={item.requestedQty > 0 ? item.requestedQty.toString() : "0"}
                        />
                        </td>
                    )}

                    <td className="p-4 text-center">
                        <div className="flex justify-center">
                            <span className={`status-pill px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold border shadow-sm ${statusColor}`}>
                            {statusIcon} {statusLabel}
                            </span>
                        </div>
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>
    </Card>
  );
};

// --- General List View (Drill-down like History) ---
const GeneralListView = ({ 
    data, 
    onUpdate 
}: { 
    data: MaterialRecord[], 
    onUpdate: (id: string, field: string, val: any) => void 
}) => {
  const [viewState, setViewState] = useState<'regions' | 'comarcas' | 'table'>('regions');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedComarca, setSelectedComarca] = useState<string | null>(null);

  // Logic reuse from RegionGrid
  const uniqueRegions = useMemo(() => {
    const set = new Set(data.map(d => d.region));
    return Array.from(set);
  }, [data]);

  const comarcas = useMemo(() => {
    if (!selectedRegion) return [];
    const set = new Set(data.filter(d => d.region === selectedRegion).map(d => d.comarca));
    return Array.from(set);
  }, [data, selectedRegion]);

  const handleBack = () => {
    if (viewState === 'table') setViewState('comarcas');
    else if (viewState === 'comarcas') {
      setViewState('regions');
      setSelectedRegion(null);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fadeIn">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
            {viewState !== 'regions' && (
                <button onClick={handleBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                </button>
            )}
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet size={24} className="text-blue-500"/>
                    Listagem Geral
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className={viewState === 'regions' ? 'text-blue-400 font-bold' : ''}>Regiões</span>
                    <ChevronRight size={12}/>
                    <span className={viewState === 'comarcas' ? 'text-blue-400 font-bold' : ''}>{selectedRegion || '...'}</span>
                    <ChevronRight size={12}/>
                    <span className={viewState === 'table' ? 'text-blue-400 font-bold' : ''}>{selectedComarca || '...'}</span>
                </div>
            </div>
        </div>

        {/* Step 1: Regions */}
        {viewState === 'regions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueRegions.map(r => (
                <button 
                    key={r} 
                    onClick={() => { setSelectedRegion(r); setViewState('comarcas'); }} 
                    className="group bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 hover:shadow-blue-900/20 hover:shadow-lg transition-all text-left relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Map size={80} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">{r}</h3>
                    <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                        Selecionar Região <ChevronRight size={16} />
                    </div>
                </button>
            ))}
            </div>
        )}

        {/* Step 2: Comarcas */}
        {viewState === 'comarcas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {comarcas.map(c => (
                <button 
                    key={c} 
                    onClick={() => { setSelectedComarca(c); setViewState('table'); }} 
                    className="group bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-emerald-500 hover:bg-slate-800/80 transition-all text-left"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-slate-900 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                        <Briefcase size={20} />
                        </div>
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-white">{c}</h4>
                    <p className="text-xs text-slate-500 mt-1">Abrir tabela de pedidos</p>
                </button>
            ))}
            </div>
        )}

        {/* Step 3: Table (Admin Mode) */}
        {viewState === 'table' && (
            <SmartTable 
                data={data} 
                onUpdate={onUpdate} 
                selectedRegion={selectedComarca} // Passing specific comarca to filter
                mode="admin"
            />
        )}
    </div>
  );
};

// --- History & Drilldown Components ---

const HistoryAnalytics = ({ data }: { data: MaterialRecord[] }) => {
  const [viewState, setViewState] = useState<'regions' | 'comarcas' | 'details'>('regions');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedComarca, setSelectedComarca] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'trimestral' | 'semestral' | 'anual'>('trimestral');

  // Group data to find unique regions
  const regions = useMemo(() => {
    const set = new Set(data.map(d => d.region));
    return Array.from(set);
  }, [data]);

  // Group data to find unique comarcas for a region
  const comarcas = useMemo(() => {
    if (!selectedRegion) return [];
    const set = new Set(data.filter(d => d.region === selectedRegion).map(d => d.comarca));
    return Array.from(set);
  }, [data, selectedRegion]);

  // Detail View Data Preparation
  const comarcaDetails = useMemo(() => {
    if (!selectedComarca) return null;
    const comarcaData = data.filter(d => d.comarca === selectedComarca);
    
    // Current Snapshot Base for calculations
    const baseReq = comarcaData.reduce((a,b) => a + (b.requestedQty || 0), 0);
    const baseAtt = comarcaData.reduce((a,b) => a + (b.approvedQty || 0), 0);
    
    // Mocking historical data evolution based on the snapshot and selected filter
    let chartData = [];
    
    if (timeFilter === 'trimestral') {
        // Simulated Quarterly Data
        chartData = [
            { name: '3º Trim 23', solicitado: Math.round(baseReq * 0.85), atendido: Math.round(baseAtt * 0.8) },
            { name: '4º Trim 23', solicitado: Math.round(baseReq * 1.1), atendido: Math.round(baseAtt * 0.95) },
            { name: '1º Trim 24', solicitado: Math.round(baseReq * 0.9), atendido: Math.round(baseAtt * 0.88) },
            { name: '2º Trim 24', solicitado: baseReq, atendido: baseAtt }, // Current cycle
        ];
    } else if (timeFilter === 'semestral') {
        // Simulated Semiannual Data
        chartData = [
            { name: '1º Sem 23', solicitado: Math.round(baseReq * 1.8), atendido: Math.round(baseAtt * 1.6) },
            { name: '2º Sem 23', solicitado: Math.round(baseReq * 2.1), atendido: Math.round(baseAtt * 1.9) },
            { name: '1º Sem 24', solicitado: Math.round(baseReq * 1.9), atendido: Math.round(baseAtt * 1.8) },
            { name: '2º Sem 24', solicitado: Math.round(baseReq * 2.0), atendido: Math.round(baseAtt * 1.9) }, // Projected
        ];
    } else { // anual
        // Simulated Annual Data
        chartData = [
            { name: '2022', solicitado: Math.round(baseReq * 3.5), atendido: Math.round(baseAtt * 3.0) },
            { name: '2023', solicitado: Math.round(baseReq * 4.0), atendido: Math.round(baseAtt * 3.6) },
            { name: '2024', solicitado: Math.round(baseReq * 4.2), atendido: Math.round(baseAtt * 3.9) },
        ];
    }

    // Calculate aggregate KPIs for the displayed period
    const totalReqPeriod = chartData.reduce((acc, i) => acc + i.solicitado, 0);
    const totalAttPeriod = chartData.reduce((acc, i) => acc + i.atendido, 0);
    const optimized = totalReqPeriod - totalAttPeriod;
    const efficiency = totalReqPeriod > 0 ? (totalAttPeriod / totalReqPeriod) * 100 : 0;
    
    // Additional mocked KPIs
    const activeCats = new Set(comarcaData.filter(d => d.requestedQty > 0).map(d => d.category)).size;
    const avgPerCycle = chartData.length > 0 ? Math.round(totalAttPeriod / chartData.length) : 0;

    return { 
        totalReq: totalReqPeriod, 
        totalAtt: totalAttPeriod, 
        optimized, // Deviation
        efficiency,
        activeCats,
        avgPerCycle,
        chartData 
    };
  }, [data, selectedComarca, timeFilter]);


  const handleRegionClick = (reg: string) => {
    setSelectedRegion(reg);
    setViewState('comarcas');
  };

  const handleComarcaClick = (com: string) => {
    setSelectedComarca(com);
    setViewState('details');
  };

  const handleBack = () => {
    if (viewState === 'details') setViewState('comarcas');
    else if (viewState === 'comarcas') {
      setViewState('regions');
      setSelectedRegion(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
      {/* Breadcrumb / Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {viewState !== 'regions' && (
            <button onClick={handleBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp size={24} className="text-blue-500"/>
                  Gestão & Histórico
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className={viewState === 'regions' ? 'text-blue-400 font-bold' : ''}>Rotas</span>
                  <ChevronRight size={12}/>
                  <span className={viewState === 'comarcas' ? 'text-blue-400 font-bold' : ''}>{selectedRegion || '...'}</span>
                  <ChevronRight size={12}/>
                  <span className={viewState === 'details' ? 'text-blue-400 font-bold' : ''}>{selectedComarca || '...'}</span>
              </div>
          </div>
        </div>

        {/* Filter Widget - Visible only in Details view */}
        {viewState === 'details' && (
           <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex items-center shadow-md">
              {['trimestral', 'semestral', 'anual'].map((filter) => (
                 <button
                    key={filter}
                    onClick={() => setTimeFilter(filter as any)}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${timeFilter === filter ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                 >
                    {filter}
                 </button>
              ))}
           </div>
        )}
      </div>

      {/* VIEW: REGIONS */}
      {viewState === 'regions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map(r => (
            <button key={r} onClick={() => handleRegionClick(r)} className="group bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 hover:shadow-blue-900/20 hover:shadow-lg transition-all text-left relative overflow-hidden">
               <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Map size={80} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 relative z-10">{r}</h3>
               <p className="text-slate-400 text-sm relative z-10">Clique para ver comarcas e indicadores</p>
               <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:translate-x-2 transition-transform">
                  Acessar Rota <ChevronRight size={16} />
               </div>
            </button>
          ))}
        </div>
      )}

      {/* VIEW: COMARCAS */}
      {viewState === 'comarcas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {comarcas.map(c => (
            <button key={c} onClick={() => handleComarcaClick(c)} className="group bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-emerald-500 hover:bg-slate-800/80 transition-all text-left">
               <div className="flex justify-between items-start mb-3">
                 <div className="p-2 bg-slate-900 rounded-lg text-emerald-500 group-hover:scale-110 transition-transform">
                   <Briefcase size={20} />
                 </div>
                 <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-500" />
               </div>
               <h4 className="text-lg font-bold text-white">{c}</h4>
               <p className="text-xs text-slate-500 mt-1">Visualizar histórico completo</p>
            </button>
          ))}
        </div>
      )}

      {/* VIEW: DETAILS DASHBOARD */}
      {viewState === 'details' && comarcaDetails && (
        <div className="space-y-6 animate-fadeIn">
           {/* Top KPIs - Expanded to 2 rows */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1 */}
              <StatCard 
                title={`Acumulado Solicitado`}
                value={comarcaDetails.totalReq.toLocaleString()} 
                subtext={`Total no período ${timeFilter}`} 
                icon={FileText} 
                color="bg-amber-500" 
              />
              <StatCard 
                title={`Acumulado Atendido`}
                value={comarcaDetails.totalAtt.toLocaleString()} 
                subtext={`Validado no período ${timeFilter}`} 
                icon={ShieldCheck} 
                color="bg-emerald-500" 
              />
              <StatCard 
                title="Eficiência Global" 
                value={`${comarcaDetails.efficiency.toFixed(1)}%`} 
                subtext="Taxa de conversão média" 
                icon={TrendingUp} 
                color="bg-blue-500" 
              />
              
              {/* Row 2 - New KPIs */}
              <StatCard 
                title="Itens Otimizados" 
                value={comarcaDetails.optimized.toLocaleString()} 
                subtext="Diferença (Solic. - Atend.)" 
                icon={BarChart2} 
                color="bg-rose-500" 
              />
              <StatCard 
                title="Categorias Ativas" 
                value={comarcaDetails.activeCats.toString()} 
                subtext="Mix de produtos solicitados" 
                icon={Layers} 
                color="bg-indigo-500" 
              />
              <StatCard 
                title="Média por Ciclo" 
                value={comarcaDetails.avgPerCycle.toLocaleString()} 
                subtext="Média de itens entregues" 
                icon={History} 
                color="bg-cyan-500" 
              />
           </div>

           {/* Historical Chart */}
           <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 capitalize">
                        <Calendar size={20} className="text-blue-400"/>
                        Evolução {timeFilter} (Solicitado vs Atendido)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Análise de desempenho ao longo dos ciclos de pedido</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-400"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Solicitado</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Atendido</div>
                </div>
              </div>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comarcaDetails.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        cursor={{fill: '#1e293b'}}
                    />
                    <Bar dataKey="solicitado" name="Qtd. Solicitada" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40}>
                         <LabelList dataKey="solicitado" position="top" fill="#f59e0b" fontSize={12} fontWeight="bold" />
                    </Bar>
                    <Bar dataKey="atendido" name="Qtd. Atendida" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                         <LabelList dataKey="atendido" position="top" fill="#10b981" fontSize={12} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </Card>

           {/* Action Buttons */}
           <div className="flex justify-end gap-4">
               <Button variant="outline" icon={Download}>Exportar Relatório ({timeFilter.toUpperCase()})</Button>
               <Button variant="primary" icon={Search}>Ver Detalhes Pontuais</Button>
           </div>
        </div>
      )}
    </div>
  );
};

const RegionGrid = ({ data, onSelect }: { data: MaterialRecord[], onSelect: (comarca: string) => void }) => {
  const [selectedRegionGroup, setSelectedRegionGroup] = useState<string | null>(null);

  // Level 1 Data: Unique Regions
  const uniqueRegions = useMemo(() => {
    const map: Record<string, { totalComarcas: Set<string>, totalItems: number, pending: number }> = {};
    data.forEach(d => {
      if (!map[d.region]) map[d.region] = { totalComarcas: new Set(), totalItems: 0, pending: 0 };
      map[d.region].totalComarcas.add(d.comarca);
      map[d.region].totalItems++;
      // Count as pending if status is not confirmed
      if (d.status !== 'confirmed') map[d.region].pending++;
    });
    return Object.entries(map).map(([name, stats]) => ({
      name,
      comarcaCount: stats.totalComarcas.size,
      totalItems: stats.totalItems,
      pending: stats.pending
    }));
  }, [data]);

  // Level 2 Data: Comarcas for selected Region
  const comarcasInRegion = useMemo(() => {
    if (!selectedRegionGroup) return [];
    const map: Record<string, { region: string, totalItems: number, pending: number }> = {};
    data.filter(d => d.region === selectedRegionGroup).forEach(d => {
        if (!map[d.comarca]) map[d.comarca] = { region: d.region, totalItems: 0, pending: 0 };
        map[d.comarca].totalItems++;
        if (d.status !== 'confirmed') map[d.comarca].pending++;
    });
    return Object.entries(map).map(([name, stats]) => ({ name, ...stats }));
  }, [data, selectedRegionGroup]);

  // VIEW: REGION GROUPS (Level 1)
  if (!selectedRegionGroup) {
    return (
      <div className="animate-fadeIn">
         <p className="text-slate-400 mb-6">Selecione uma macro-região para visualizar as comarcas disponíveis.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uniqueRegions.map((r) => (
            <button 
              key={r.name}
              onClick={() => setSelectedRegionGroup(r.name)}
              className="group bg-slate-800 hover:bg-blue-900/20 border border-slate-700 hover:border-blue-500 rounded-xl p-6 text-left transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-blue-900/20"
            >
              <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Map size={120} />
              </div>
              
              <div className="relative z-10">
                 <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30">
                    <Map size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">{r.name}</h3>
                 
                 <div className="flex items-center gap-4 text-sm text-slate-400 mt-4">
                    <div className="flex items-center gap-1.5">
                       <Database size={14} className="text-slate-500"/> 
                       {r.comarcaCount} Comarcas
                    </div>
                    <div className="flex items-center gap-1.5">
                       <FileText size={14} className="text-slate-500"/> 
                       {r.totalItems} Materiais
                    </div>
                 </div>

                 <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progresso da Região</span>
                    <span className="text-xs font-bold text-white">{Math.round(((r.totalItems - r.pending) / r.totalItems) * 100)}%</span>
                 </div>
                 
                 <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${r.pending === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${((r.totalItems - r.pending) / r.totalItems) * 100}%` }} 
                    />
                 </div>
              </div>
            </button>
          ))}
         </div>
      </div>
    );
  }

  // VIEW: COMARCAS GRID (Level 2)
  return (
    <div className="animate-fadeIn">
       <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedRegionGroup(null)} 
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            title="Voltar"
          >
             <ArrowLeft size={24} />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
               {selectedRegionGroup}
               <span className="text-sm font-normal text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                 {comarcasInRegion.length} Comarcas
               </span>
            </h3>
            <p className="text-sm text-slate-400">Selecione a comarca para gerenciar materiais</p>
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {comarcasInRegion.map((r) => (
            <button 
              key={r.name}
              onClick={() => onSelect(r.name)}
              className="group bg-slate-800 hover:bg-blue-900/10 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 text-left transition-all duration-200 relative overflow-hidden shadow-md hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Map size={64} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/30">
                    {r.region.split(' ')[1] || 'Regional'}
                  </span>
                  {r.pending === 0 ? (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><ShieldCheck size={14}/> Completo</span>
                  ) : (
                    <span className="text-amber-400 text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Em Andamento</span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white group-hover:text-blue-200 mb-1">{r.name}</h3>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <span>{r.totalItems} Itens registrados</span>
                </div>

                <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${r.pending === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                    style={{ width: `${((r.totalItems - r.pending) / r.totalItems) * 100}%` }} 
                  />
                </div>
                <div className="flex justify-between mt-1">
                   <span className="text-[10px] text-slate-500">Progresso</span>
                   <span className="text-[10px] font-bold text-slate-400">{Math.round(((r.totalItems - r.pending) / r.totalItems) * 100)}%</span>
                </div>
              </div>
            </button>
          ))}
       </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'general_list' | 'regions' | 'audit' | 'history_analytics'>('dashboard');
  const [data, setData] = useState<MaterialRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [pinTarget, setPinTarget] = useState<string | null>(null);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '', name: '', isRegister: false });

  // Init & Persistence
  useEffect(() => {
    const storedData = localStorage.getItem('demand_app_data');
    const storedLogs = localStorage.getItem('demand_app_logs');
    const storedUser = localStorage.getItem('demand_app_user');

    if (storedData) setData(JSON.parse(storedData));
    if (storedLogs) setAuditLog(JSON.parse(storedLogs));
    if (storedUser) setUser(JSON.parse(storedUser));
    
    if (!storedData) {
      // Real material names generation
      const materialsByCat: Record<string, string[]> = {
        "Escritório": ["Papel A4 75g", "Caneta Esferográfica Azul", "Grampos 26/6", "Cola Bastão", "Bloco de Notas Adesivo"],
        "Limpeza": ["Detergente Líquido 500ml", "Desinfetante Floral 2L", "Papel Higiênico FD", "Saco de Lixo 100L", "Álcool 70%"],
        "Informática": ["Mouse Óptico USB", "Teclado ABNT2", "Cabo HDMI 2m", "Cartucho Preto HP", "Pendrive 32GB"],
        "Copa": ["Café em Pó 500g", "Açúcar Cristal 1kg", "Copo Descartável 200ml", "Guardanapo de Papel", "Chá Mate"],
        "Manutenção": ["Lâmpada LED 9W", "Fita Isolante", "Parafuso M4", "Bucha 8mm", "Tinta Látex Branca 18L"]
      };
      
      const cats = Object.keys(materialsByCat);

      const dummy = Array.from({ length: 60 }).map((_, i) => {
        const comarcas = ["Aquiraz", "Fortaleza", "Sobral", "Eusébio", "Caucaia", "Juazeiro", "Crato", "Maracanaú"];
        const category = cats[i % cats.length];
        const items = materialsByCat[category];
        const materialName = items[i % items.length];
        
        return {
          id: generateId(),
          region: i % 2 === 0 ? "Região Metropolitana" : "Região Norte",
          comarca: comarcas[i % comarcas.length],
          category: category,
          materialName: materialName,
          unit: 'UN',
          historicalDemand: Math.floor(Math.random() * 100) + 10,
          predictedDemand: Math.floor(Math.random() * 120) + 10,
          requestedQty: 0,
          approvedQty: 0,
          status: 'pending' as RecordStatus,
          lastUpdated: nowISO()
        };
      });
      setData(dummy);
      localStorage.setItem('demand_app_data', JSON.stringify(dummy));
    }
  }, []);

  useEffect(() => {
    if (data.length > 0) localStorage.setItem('demand_app_data', JSON.stringify(data));
    if (auditLog.length > 0) localStorage.setItem('demand_app_logs', JSON.stringify(auditLog));
  }, [data, auditLog]);

  const logAction = (username: string, action: string, details: string) => {
    const entry: AuditEntry = { id: generateId(), timestamp: nowISO(), user: username, action, details };
    setAuditLog(prev => [entry, ...prev]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.isRegister) {
      const u: User = { id: generateId(), username: loginForm.username, name: loginForm.name, role: 'manager' };
      setUser(u);
      localStorage.setItem('demand_app_user', JSON.stringify(u));
      logAction(u.name, 'Registro', 'Novo usuário registrado no sistema');
    } else {
      const u: User = { id: '1', username: loginForm.username, name: loginForm.username, role: 'manager' };
      setUser(u);
      localStorage.setItem('demand_app_user', JSON.stringify(u));
      logAction(u.name, 'Login', 'Acesso ao sistema realizado');
    }
  };

  const handleLogout = () => {
    logAction(user?.name || '?', 'Logout', 'Saída do sistema');
    setUser(null);
    localStorage.removeItem('demand_app_user');
    setView('dashboard');
    setSelectedRegion(null);
  };

  const handleUpdate = (id: string, field: string, val: any) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        const numVal = Number(val);
        
        // Special logic for Status Update based on RequestedQty changes in Input Mode
        let newStatus = item.status;
        if (field === 'requestedQty') {
            newStatus = numVal > 0 ? 'confirmed' : 'pending';
        }

        return { 
           ...item, 
           [field]: numVal, 
           status: newStatus,
           lastUpdated: nowISO() 
        };
      }
      return item;
    }));
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      if (lines.length > 1) {
         alert(`Arquivo lido com sucesso. ${lines.length - 1} linhas processadas.`);
         logAction(user?.name || '', 'Importação', 'Planilha importada manualmente');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = (format: 'csv' | 'json') => {
    const content = format === 'json' 
      ? JSON.stringify(data, null, 2)
      : "ID,Comarca,Material,Previsto,Solicitado,Atendido,Status\n" + data.map(d => `${d.id},${d.comarca},${d.materialName},${d.predictedDemand},${d.requestedQty},${d.approvedQty},${d.status}`).join('\n');
      
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${nowISO()}.${format}`;
    a.click();
    logAction(user?.name || '', 'Exportação', `Dados exportados em ${format.toUpperCase()}`);
  };

  const handleSystemRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const restored = JSON.parse(evt.target?.result as string);
        if (Array.isArray(restored)) {
          setData(restored);
          logAction(user?.name || '', 'Backup', 'Sistema restaurado via arquivo JSON');
          alert("Backup restaurado com sucesso!");
        }
      } catch (err) {
        alert("Erro ao ler arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  // --- Render: Login Screen ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <Card className="w-full max-w-md p-8 border-slate-800 shadow-2xl animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50 transform rotate-3">
              <FileSpreadsheet className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Demand Forecast OS</h1>
            <p className="text-slate-400 mt-2">Sistema Inteligente de Previsão</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginForm.isRegister && (
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                 <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                   value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} />
               </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Usuário</label>
              <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
              <input required type="password" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            <Button className="w-full py-3 text-lg mt-4">
              {loginForm.isRegister ? 'Criar Conta' : 'Acessar Sistema'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setLoginForm(p => ({...p, isRegister: !p.isRegister}))} className="text-slate-500 hover:text-blue-400 text-sm transition-colors">
              {loginForm.isRegister ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Render: Main App ---
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans sidebar-wrapper">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col transition-all duration-300 no-print">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
             <FileSpreadsheet size={20} className="text-white" />
          </div>
          <span className="ml-3 font-bold text-white hidden lg:block tracking-tight">DemandOS</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem active={view === 'dashboard'} onClick={() => { setView('dashboard'); setSelectedRegion(null); }} icon={LayoutDashboard} label="Dashboard" />
          
          {/* Region Input Mode */}
          <SidebarItem active={view === 'regions'} onClick={() => { setView('regions'); setSelectedRegion(null); }} icon={Map} label="Regiões & Rotas" />
          
          {/* General List Mode */}
          <SidebarItem active={view === 'general_list'} onClick={() => { setView('general_list'); setSelectedRegion(null); }} icon={FileSpreadsheet} label="Listagem Geral" />
          
          {/* History Mode */}
          <SidebarItem active={view === 'history_analytics'} onClick={() => setView('history_analytics')} icon={TrendingUp} label="Gestão & Histórico" />

          <SidebarItem active={view === 'audit'} onClick={() => setView('audit')} icon={History} label="Auditoria & Logs" />
          
          <div className="pt-6 pb-2">
             <div className="text-xs font-bold text-slate-600 uppercase px-2 mb-2 hidden lg:block">Dados</div>
             <label className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                <Upload size={20} />
                <span className="hidden lg:block text-sm font-medium">Importar CSV</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
             </label>
             <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                <Download size={20} />
                <span className="hidden lg:block text-sm font-medium">Exportar CSV</span>
             </button>
             <label className="flex items-center gap-3 px-3 py-2 text-blue-400 hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors mt-2">
                <Database size={20} />
                <span className="hidden lg:block text-sm font-medium">Restaurar Backup</span>
                <input type="file" accept=".json" className="hidden" onChange={handleSystemRestore} />
             </label>
              <button onClick={() => handleExport('json')} className="w-full flex items-center gap-3 px-3 py-2 text-blue-400 hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors">
                <Save size={20} />
                <span className="hidden lg:block text-sm font-medium">Backup JSON</span>
             </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut size={20} />
            <span className="hidden lg:block text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm z-10 no-print">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {view === 'dashboard' && 'Visão Geral'}
                {view === 'regions' && 'Selecione a Região'}
                {view === 'general_list' && 'Gestão de Demandas'}
                {view === 'history_analytics' && 'Análise Histórica'}
                {view === 'audit' && 'Registro de Atividades'}
              </h2>
           </div>
           <div className="flex items-center gap-4 text-slate-400 text-sm">
              <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-6 relative scroll-area">
          {view === 'dashboard' && <DashboardView data={data} />}
          
          {/* INPUT FLOW */}
          {view === 'regions' && (
            <RegionGrid 
              data={data} 
              onSelect={(comarca) => setPinTarget(comarca)} 
            />
          )}
          
          {/* Input Table (Shown after PIN via Regions flow) */}
          {view === 'regions' && selectedRegion && (
            <div className="absolute inset-0 bg-slate-950 p-6 z-20">
               <div className="mb-4 no-print">
                 <button onClick={() => setSelectedRegion(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                   <ArrowLeft size={20}/> Voltar para Regiões
                 </button>
               </div>
               <SmartTable 
                 data={data} 
                 onUpdate={handleUpdate} 
                 selectedRegion={selectedRegion}
                 mode="input"
               />
            </div>
          )}
          
          {/* GENERAL LIST FLOW (ADMIN) */}
          {view === 'general_list' && (
            <GeneralListView 
              data={data} 
              onUpdate={handleUpdate}
            />
          )}

          {view === 'history_analytics' && (
            <HistoryAnalytics data={data} />
          )}
          
          {view === 'audit' && (
            <Card className="animate-fadeIn overflow-hidden">
               <div className="p-4 border-b border-slate-700 bg-slate-800 font-bold text-white flex items-center gap-2">
                 <History size={20} className="text-blue-400"/>
                 Histórico de Ações
               </div>
               <div className="overflow-auto max-h-[calc(100vh-250px)]">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-900 text-slate-400 sticky top-0">
                     <tr>
                       <th className="p-4">Data/Hora</th>
                       <th className="p-4">Usuário</th>
                       <th className="p-4">Ação</th>
                       <th className="p-4">Detalhes</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700 text-slate-300">
                     {auditLog.map(log => (
                       <tr key={log.id} className="hover:bg-slate-800/50">
                         <td className="p-4 font-mono text-slate-500 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                         <td className="p-4 font-medium text-white">{log.user}</td>
                         <td className="p-4">
                            <span className="px-2 py-1 bg-slate-700 rounded text-xs uppercase font-bold tracking-wider">{log.action}</span>
                         </td>
                         <td className="p-4 text-slate-400">{log.details}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </Card>
          )}
        </div>
      </main>

      {/* Security Modal */}
      {pinTarget && (
        <PinPad 
          target={pinTarget} 
          onUnlock={() => {
            setSelectedRegion(pinTarget);
            // We stay in 'regions' view, but render the table overlay
            setPinTarget(null);
            logAction(user.name, 'Acesso', `Acesso liberado à comarca ${pinTarget}`);
          }} 
          onCancel={() => setPinTarget(null)} 
        />
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'} no-print`}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className={`hidden lg:block font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden lg:block shadow-lg" />}
  </button>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);