import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Home, ShoppingBag, Utensils, Plane, Car, Zap, Heart, GraduationCap, CircleDollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { statementService, type ParsedTransaction } from '../services/statement.service';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)'
];

const CategoryIcon = ({ category, x, y }: { category: string, x: number, y: number }) => {
  const getIcon = () => {
    const name = category.toLowerCase();
    if (name.includes('rent') || name.includes('home') || name.includes('house')) return Home;
    if (name.includes('food') || name.includes('dining') || name.includes('restaurant')) return Utensils;
    if (name.includes('travel') || name.includes('flight') || name.includes('plane')) return Plane;
    if (name.includes('transport') || name.includes('train') || name.includes('bus') || name.includes('car')) return Car;
    if (name.includes('shopping') || name.includes('clothes')) return ShoppingBag;
    if (name.includes('health') || name.includes('medical')) return Heart;
    if (name.includes('bill') || name.includes('utility') || name.includes('zap')) return Zap;
    if (name.includes('education') || name.includes('school')) return GraduationCap;
    return CircleDollarSign;
  };
  const Icon = getIcon();
  return (
    <foreignObject x={x - 10} y={y - 10} width={20} height={20}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Icon size={12} strokeWidth={2.5} />
      </div>
    </foreignObject>
  );
};

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;
  const RADIAN = Math.PI / 180;
  
  if (percent < 0.03) return null; // Hide labels for very small slices

  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  
  const lineStartX = cx + (outerRadius) * cos;
  const lineStartY = cy + (outerRadius) * sin;
  
  const circleRadius = outerRadius + 25; 
  const circleX = cx + circleRadius * cos;
  const circleY = cy + circleRadius * sin;
  
  const textX = cx + (circleRadius + 18) * cos;
  const textY = cy + (circleRadius) * sin;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <line 
        x1={lineStartX} 
        y1={lineStartY} 
        x2={circleX} 
        y2={circleY} 
        stroke={fill} 
        strokeWidth={1.5}
        opacity={0.6}
      />
      <circle cx={circleX} cy={circleY} r={14} fill={fill} stroke="none" />
      <CategoryIcon category={name} x={circleX} y={circleY} />
      <text 
        x={textX} 
        y={textY} 
        dy={5} 
        textAnchor={textAnchor} 
        fill={fill}
        fontSize={13}
        fontWeight={700}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

export const StatementAnalytics: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Results state
  const [parsedData, setParsedData] = useState<{
    imported: number;
    duplicates: number;
    transactions: ParsedTransaction[];
  } | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload a PDF, JPG, or PNG.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }
    setFile(selectedFile);
    setParsedData(null); // Reset previous results when a new file is selected
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const uploadToastId = toast.loading('Reading bank statement via AI... This may take a moment.');

    try {
      const response = await statementService.uploadStatement(file);
      
      setParsedData({
        imported: response.data.imported,
        duplicates: response.data.duplicates,
        transactions: response.data.parsedTransactions
      });
      
      toast.success(response.message, { id: uploadToastId, duration: 5000 });
      setFile(null); // Clear the file input
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze the statement.', { id: uploadToastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Compute chart data from parsed transactions
  const getCategoryData = () => {
    if (!parsedData) return [];
    const expenses = parsedData.transactions.filter(t => t.type === 'expense');
    const categoryMap: Record<string, number> = {};
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    return Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] }));
  };

  const getIncomeVsExpense = () => {
    if (!parsedData) return [];
    let income = 0;
    let expense = 0;
    parsedData.transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return [{ name: 'Cashflow', Income: income, Expense: expense }];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Bank Statement Analytics</h1>
        <p className="text-text-muted">
          Upload your bank statements. Our AI will automatically extract and categorize your transactions.
        </p>
      </div>

      {/* Upload Zone */}
      <div 
        className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all bg-card-custom ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border-custom hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf,image/jpeg,image/png,image/jpg"
          className="hidden"
        />

        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-text-custom mb-2">
          Drag & Drop your statement here
        </h3>
        <p className="text-sm text-text-muted mb-6 text-center max-w-sm">
          Supports PDF, JPG, and PNG files up to 10MB.
        </p>

        {file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-background-custom border border-border-custom rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold truncate max-w-[200px]">{file.name}</span>
              <span className="text-xs text-text-muted">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-opacity-95 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  Process Statement
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-background-custom border border-border-custom rounded-xl font-semibold text-text-custom hover:bg-border-custom/30 transition-all shadow-sm"
          >
            Browse Files
          </button>
        )}
      </div>

      {/* Parsing Results Summary */}
      {parsedData && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-card-custom border border-border-custom rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--success)]/10 text-[var(--success)] rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-muted font-semibold">Successfully Imported</p>
                <h4 className="text-2xl font-bold">{parsedData.imported} transactions</h4>
              </div>
            </div>
            
            <div className="p-6 bg-card-custom border border-border-custom rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--warning)]/10 text-[var(--warning)] rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-muted font-semibold">Duplicates Skipped</p>
                <h4 className="text-2xl font-bold">{parsedData.duplicates} skipped</h4>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          {parsedData.transactions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Category Breakdown */}
              <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col">
                <h3 className="font-bold text-lg mb-4">Expense Breakdown</h3>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getCategoryData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                        stroke="none"
                        labelLine={false}
                        label={isMobile ? undefined : renderCustomizedLabel}
                      >
                        {getCategoryData().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      {isMobile && <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Income vs Expense */}
              <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm flex flex-col">
                <h3 className="font-bold text-lg mb-4">Cashflow Summary</h3>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getIncomeVsExpense()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => `₹${value}`} />
                      <RechartsTooltip 
                        formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1f2937', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="Income" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      <Bar dataKey="Expense" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Transactions Preview Table */}
          {parsedData.transactions.length > 0 && (
            <div className="rounded-2xl bg-card-custom border border-border-custom shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border-custom">
                <h3 className="font-bold text-lg">Preview of New Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-background-custom/30 text-text-muted uppercase text-xs">
                      <th className="py-3 px-6">Date</th>
                      <th className="py-3 px-6">Description</th>
                      <th className="py-3 px-6">Category</th>
                      <th className="py-3 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50">
                    {parsedData.transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-border-custom/10 transition-colors">
                        <td className="py-3 px-6 text-text-muted">{tx.date}</td>
                        <td className="py-3 px-6 font-medium">{tx.notes}</td>
                        <td className="py-3 px-6">
                          <span className="px-2.5 py-1 bg-border-custom/30 rounded-lg text-xs font-semibold">
                            {tx.category}
                          </span>
                        </td>
                        <td className={`py-3 px-6 text-right font-bold tabular-nums ${tx.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatementAnalytics;
