import React, { useState } from 'react';
import { ICONS, TREE_PRICE } from '../constants';
import { createDonation } from '../services/supabaseService';
import { generateImpactMessage } from '../services/geminiService';

interface DonationFormProps {
  qrUrl: string;
  onSuccess: (message: string) => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({ qrUrl, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(5);
  const [customQty, setCustomQty] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const presets = [1, 5, 10, 50];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size too large. Please upload an image under 5MB.");
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleNextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev + 1);
  };
  const handlePrevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      alert("Please upload your payment receipt.");
      return;
    }

    setIsUploading(true);
    const qty = customQty ? parseInt(customQty) : quantity;
    
    try {
      createDonation({
        tree_quantity: qty,
        amount: qty * TREE_PRICE,
        receipt_url: preview,
        donor_name: donorName || 'Anonymous Donor'
      });

      const impactMessage = await generateImpactMessage(qty);
      onSuccess(impactMessage);
    } catch (err) {
      onSuccess(`Thank you for your incredible support in planting ${qty} trees! Your contribution is being verified.`);
    } finally {
      setIsUploading(false);
    }
  };

  const currentQty = customQty ? parseInt(customQty) : quantity;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-full min-h-[650px] transition-all duration-500">
      <div className="green-gradient p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
        <div className="flex justify-between items-center mb-2 relative z-10">
          <h3 className="text-2xl font-black flex items-center gap-3">
            {ICONS.Tree} Sponsor a Tree
          </h3>
          <span className="text-[10px] font-black bg-white/20 px-3 py-1.5 rounded-full uppercase tracking-[0.2em] backdrop-blur-sm">Phase {step}/3</span>
        </div>
        <p className="text-green-50/90 text-sm font-medium relative z-10">RM {TREE_PRICE}.00 plants one native seedling.</p>
      </div>

      <div className="p-10 flex-grow flex flex-col">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 flex-grow flex flex-col">
            <div className="flex-grow">
              <label className="block text-xs font-black text-gray-400 mb-5 uppercase tracking-[0.2em]">Select Quantity</label>
              <div className="grid grid-cols-2 gap-5">
                {presets.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setQuantity(q); setCustomQty(''); }}
                    className={`p-8 rounded-[2rem] font-black transition-all border-2 text-2xl flex flex-col items-center justify-center gap-2 ${
                      quantity === q && !customQty 
                        ? 'bg-green-600 border-green-600 text-white shadow-2xl shadow-green-200 scale-[1.05]' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-green-100 hover:bg-green-50/20'
                    }`}
                  >
                    <span>{q}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60 font-black">{q === 1 ? 'Tree' : 'Trees'}</span>
                  </button>
                ))}
              </div>
              <div className="mt-10">
                <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Custom Impact</label>
                <div className="relative group">
                  <input
                    type="number"
                    placeholder="Enter custom count..."
                    value={customQty}
                    onChange={(e) => {
                      setCustomQty(e.target.value);
                      setQuantity(0);
                    }}
                    className="w-full px-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-all text-xl font-black text-gray-800"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Trees</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleNextStep}
              disabled={!currentQty || currentQty <= 0}
              className="w-full py-7 bg-green-600 hover:bg-green-700 disabled:opacity-30 text-white text-lg font-black rounded-[1.8rem] transition-all shadow-2xl shadow-green-200 flex items-center justify-center gap-3 transform active:scale-[0.97]"
            >
              Continue to RM{(currentQty || 0) * TREE_PRICE}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="text-center space-y-8">
              <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 inline-block w-full">
                <p className="text-green-800 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Checkout Total</p>
                <p className="text-4xl font-black text-green-900 tracking-tighter">RM {(currentQty || 0) * TREE_PRICE}.00</p>
              </div>
              
              <div className="relative inline-block">
                 <div className="absolute -inset-4 bg-gradient-to-tr from-green-500 to-green-200 rounded-[3rem] blur-2xl opacity-20 animate-pulse"></div>
                 <div className="bg-white p-6 rounded-[2.5rem] border-4 border-double border-gray-100 shadow-xl relative z-10 transform hover:scale-105 transition-transform duration-500">
                    <img src={qrUrl} alt="TNG QR" className="w-64 h-64 rounded-2xl mx-auto object-cover" />
                 </div>
              </div>

              <div className="space-y-4 px-6">
                <div className="flex items-center justify-center gap-3">
                   <div className="w-3 h-3 rounded-full bg-blue-400 animate-ping"></div>
                   <p className="text-sm font-black text-gray-800 uppercase tracking-widest">Touch 'n Go eWallet</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Scan the QR above, pay <span className="text-green-600 font-bold">RM {(currentQty || 0) * TREE_PRICE}.00</span>, and keep your receipt screenshot ready for the next step.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrevStep}
                className="flex-1 py-6 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black rounded-2xl transition-all border border-gray-100 text-xs uppercase tracking-[0.2em]"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="flex-[2] py-6 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-green-100 text-xs uppercase tracking-[0.2em]"
              >
                Payment Done
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div>
              <label className="block text-xs font-black text-gray-400 mb-5 uppercase tracking-[0.2em]">Verification Protocol</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                  required
                />
                <label 
                  htmlFor="receipt-upload"
                  className={`w-full py-12 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden relative group ${
                    preview ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-green-400 bg-gray-50 hover:bg-white'
                  }`}
                >
                  {preview ? (
                    <div className="relative w-full h-48 flex flex-col items-center justify-center">
                      <img src={preview} alt="Receipt preview" className="absolute inset-0 w-full h-full object-contain p-4 opacity-20" />
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                          {ICONS.Check}
                        </div>
                        <p className="text-green-900 font-black text-xs uppercase tracking-[0.2em]">Evidence Loaded</p>
                        <p className="text-[9px] text-gray-400 mt-2 truncate max-w-[200px] mx-auto font-bold">{file?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center px-10">
                      <div className="w-20 h-20 bg-white text-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 group-hover:scale-110 group-hover:text-green-400 transition-all duration-500">
                        {ICONS.Wallet}
                      </div>
                      <p className="text-gray-900 font-black mb-2 text-lg">Attach Receipt</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Screenshot, JPG or PNG</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Public Recognition</label>
              <input
                type="text"
                placeholder="Name to display on our donor wall..."
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all font-black text-gray-700 text-sm"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 py-6 bg-gray-50 hover:bg-gray-100 text-gray-500 font-black rounded-2xl transition-all border border-gray-100 text-xs uppercase tracking-[0.2em]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!preview || isUploading}
                className="flex-[2] py-6 bg-green-600 hover:bg-green-700 disabled:opacity-30 text-white font-black rounded-2xl transition-all shadow-2xl shadow-green-200 flex items-center justify-center gap-3 group text-xs uppercase tracking-[0.2em]"
              >
                {isUploading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Securing Impact...
                  </span>
                ) : (
                  'Complete Sponsorship'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};