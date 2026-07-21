const { useState, useRef, useEffect } = React;
const {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} = window.Recharts;

// Colors for the charts
const COLORS = ['#00FF88', '#FF0055', '#00D4FF', '#FFD700', '#FF9F43'];

const ThreatHunterApp = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Triggers when file is dropped
  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.pcap') || droppedFile.name.endsWith('.pcapng')) {
          setFile(droppedFile);
          setError(null);
      } else {
          setError("Invalid file type. Only .pcap or .pcapng files are supported.");
      }
    }
  };

  // Triggers when file is selected via click
  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
       if (selectedFile.name.endsWith('.pcap') || selectedFile.name.endsWith('.pcapng')) {
          setFile(selectedFile);
          setError(null);
      } else {
          setError("Invalid file type. Only .pcap or .pcapng files are supported.");
      }
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const resetState = () => {
      setFile(null);
      setResult(null);
      setError(null);
  }

  const analyzeFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Adjust the URL if your backend runs on a different port
      const response = await fetch("http://localhost:8000/api/v1/threat-hunter/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze file");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };
  
  // Format detections for the chart
  const getDetectionChartData = () => {
      if (!result || !result.detections) return [];
      
      const data = [];
      Object.entries(result.detections).forEach(([key, value]) => {
          if (value) {
               // Format key: "port_scanning" -> "Port Scanning"
               const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
               data.push({ name: label, value: 1 });
          }
      });
      return data;
  }

  const detectionChartData = getDetectionChartData();

  return (
    <div className="p-8 max-w-7xl mx-auto font-mono text-white min-h-screen">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#00f5ff] uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
            AI Threat Hunter
        </h1>
        <p className="text-gray-400 mt-2 text-sm uppercase tracking-wider">
            Automated packet analysis & anomaly detection engine
        </p>
      </div>

      {!result && (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <div 
                className={`relative w-full max-w-2xl p-12 rounded-xl border-2 border-dashed transition-all duration-300 backdrop-blur-sm
                    ${dragActive ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-[#00f5ff]/30 bg-[#051428]/80 hover:border-[#00f5ff]/60 hover:bg-[#00f5ff]/5'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pcap,.pcapng"
                    onChange={handleChange}
                />
                
                <div className="text-center flex flex-col items-center gap-6">
                    <div className={`p-4 rounded-full ${file ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-[#00f5ff]/10 text-[#00f5ff]'}`}>
                       {file ? (
                           <i className='bx bxs-file-archive text-5xl'></i>
                       ) : (
                           <i className='bx bx-cloud-upload text-5xl'></i>
                       )}
                    </div>
                    
                    {file ? (
                        <div>
                            <p className="text-xl font-semibold text-[#00ff88]">{file.name}</p>
                            <p className="text-gray-400 text-sm mt-2">Ready for analysis ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xl font-semibold text-gray-200">Drag and drop PCAP file here</p>
                            <p className="text-gray-400 text-sm mt-2">or</p>
                            <button 
                                onClick={onButtonClick}
                                className="mt-4 px-6 py-2 bg-transparent border border-[#00f5ff] text-[#00f5ff] rounded hover:bg-[#00f5ff]/10 transition-colors uppercase text-sm tracking-wider"
                            >
                                Browse Files
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-6 p-4 border border-[#ff0055] bg-[#ff0055]/10 text-[#ff0055] rounded max-w-2xl w-full flex items-center gap-3">
                    <i className='bx bx-error-circle text-xl'></i>
                    {error}
                </div>
            )}

            {file && (
                <button
                    onClick={analyzeFile}
                    disabled={isUploading}
                    className="mt-8 px-12 py-4 bg-gradient-to-r from-[#00f5ff]/20 to-[#00f5ff]/40 border border-[#00f5ff] text-white rounded-lg hover:from-[#00f5ff]/40 hover:to-[#00f5ff]/60 transition-all font-bold tracking-widest uppercase flex items-center gap-3 shadow-[0_0_15px_rgba(0,245,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <i className='bx bx-loader-alt animate-spin text-2xl'></i>
                            Analyzing Threat...
                        </>
                    ) : (
                        <>
                            <i className='bx bx-radar text-2xl'></i>
                            Initiate Analysis
                        </>
                    )}
                </button>
            )}
        </div>
      )}

      {result && result.report && (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Top Action Bar */}
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl text-gray-200 font-semibold flex items-center gap-3">
                    <i className='bx bx-check-shield text-[#00ff88]'></i>
                    Analysis Complete
                </h2>
                <button 
                    onClick={resetState}
                    className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition-colors uppercase text-xs tracking-wider flex items-center gap-2"
                >
                    <i className='bx bx-refresh text-lg'></i> Analyze Another
                </button>
            </div>

            {/* Main Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Threat Summary Card */}
                <div className="bg-[#051428]/80 border border-[#00f5ff]/30 p-6 rounded-xl backdrop-blur-sm relative overflow-hidden group hover:border-[#00f5ff]/60 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f5ff]/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    
                    <h3 className="text-[#00f5ff] text-sm uppercase tracking-widest border-b border-[#00f5ff]/20 pb-2 mb-4 flex items-center justify-between">
                        Top Threat Report
                        <span className={`px-2 py-1 rounded text-xs ${result.report.confidence > 75 ? 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/50' : 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/50'}`}>
                            {result.report.confidence}% Confidence
                        </span>
                    </h3>
                    
                    <div className="space-y-4 mt-6">
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                            <span className="text-gray-500 uppercase text-xs">Attack Type</span>
                            <span className={`text-xl font-bold ${result.report.attack !== 'No significant threat detected' ? 'text-[#ff0055]' : 'text-[#00ff88]'}`}>
                                {result.report.attack}
                            </span>
                        </div>
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                            <span className="text-gray-500 uppercase text-xs">Source IP</span>
                            <span className="text-gray-200 font-mono tracking-wider">{result.report.source}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                            <span className="text-gray-500 uppercase text-xs">Target</span>
                            <span className="text-gray-200 font-mono tracking-wider">{result.report.target}</span>
                        </div>
                        <div className="flex justify-between items-end pb-2">
                            <span className="text-gray-500 uppercase text-xs">Attempts</span>
                            <span className="text-[#ff9f43] font-bold text-lg">{result.report.attempts}</span>
                        </div>
                    </div>
                </div>

                {/* Detections List Card */}
                <div className="bg-[#051428]/80 border border-[#00f5ff]/30 p-6 rounded-xl backdrop-blur-sm">
                    <h3 className="text-[#00f5ff] text-sm uppercase tracking-widest border-b border-[#00f5ff]/20 pb-2 mb-4">
                        Heuristic & ML Detections
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                         {Object.entries(result.detections).map(([key, isDetected]) => {
                             const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                             return (
                                 <div key={key} className={`p-3 border rounded flex items-center justify-between transition-colors
                                     ${isDetected ? 'border-[#ff0055]/40 bg-[#ff0055]/5 text-[#ff0055]' : 'border-gray-800 bg-gray-900/50 text-gray-500'}`}>
                                     <span className="text-sm font-semibold">{label}</span>
                                     {isDetected ? (
                                         <i className='bx bxs-error-circle text-xl drop-shadow-[0_0_5px_rgba(255,0,85,0.8)]'></i>
                                     ) : (
                                         <i className='bx bx-check-circle text-xl'></i>
                                     )}
                                 </div>
                             );
                         })}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            {detectionChartData.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-[#051428]/80 border border-[#00f5ff]/30 p-6 rounded-xl backdrop-blur-sm h-[300px]">
                        <h3 className="text-[#00f5ff] text-sm uppercase tracking-widest border-b border-[#00f5ff]/20 pb-2 mb-4">
                            Attack Vectors (Active)
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={detectionChartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#00f5ff" width={150} tick={{fill: '#a0aec0', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(5, 20, 40, 0.9)', borderColor: '#00f5ff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#ff0055' }}
                                />
                                <Bar dataKey="value" fill="#ff0055" radius={[0, 4, 4, 0]}>
                                    {
                                        detectionChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ThreatHunterApp />);
