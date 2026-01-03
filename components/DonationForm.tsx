import React, { useState } from 'react';
import { ICONS } from '../constants';

interface DonationFormProps {
  qrUrl: string;
  treePrice: number;
  onSuccess: (message: string) => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({ qrUrl, treePrice, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(5);
  const [customQty, setCustomQty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const presets = [1, 5, 10, 50];
  const currentQty = customQty ? parseInt(customQty) : quantity;
  const totalAmount = (currentQty || 0) * treePrice;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File size exceeds 5MB. Please upload a smaller image.");
            return;
        }
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
    }
  };

  const handleNavigation = (nextStep: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(nextStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("A receipt upload is required for verification.");
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('quantity', String(currentQty));
    formData.append('donorName', donorName || 'Anonymous');
    formData.append('proof', file);

    try {
      const response = await fetch('/api/create-donation', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Donation submission failed.');
      onSuccess(`Thank you for sponsoring ${currentQty} trees! Your donation is now pending verification.`);
    } catch (err) {
      alert(`An error occurred: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-full min-h-[650px]">
      <div className="p-8 text-center border-b-2 border-gray-100">
        <h3 className="text-2xl font-black text-gray-800">Sponsor a Tree</h3>
        <p className="text-sm text-gray-500 font-medium mt-1">RM {treePrice} plants one native seedling.</p>
      </div>

      <div className="p-8 flex-grow flex flex-col">
        {step === 1 && <Step1 presets={presets} quantity={quantity} setQuantity={setQuantity} customQty={customQty} setCustomQty={setCustomQty} onNext={() => handleNavigation(2)} totalAmount={totalAmount} />}
        {step === 2 && <Step2 qrUrl={qrUrl} totalAmount={totalAmount} onBack={() => handleNavigation(1)} onNext={() => handleNavigation(3)} />}
        {step === 3 && <Step3 file={file} preview={preview} handleFileChange={handleFileChange} donorName={donorName} setDonorName={setDonorName} isSubmitting={isSubmitting} onSubmit={handleSubmit} onBack={() => handleNavigation(2)} />}
      </div>
    </div>
  );
};

const Step1 = ({ presets, quantity, setQuantity, customQty, setCustomQty, onNext, totalAmount }) => (
    <div className="flex flex-col flex-grow animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="flex-grow space-y-8">
            <label className="form-label">Select Quantity</label>
            <div className="grid grid-cols-2 gap-4">
                {presets.map(q => (
                    <button key={q} type="button" onClick={() => { setQuantity(q); setCustomQty(''); }} className={`preset-btn ${quantity === q && !customQty ? 'preset-btn-active' : ''}`}>
                        <span>{q}</span>
                        <span className="text-xs opacity-70">{q === 1 ? 'Tree' : 'Trees'}</span>
                    </button>
                ))}
            </div>
            <div>
                <label className="form-label">Or Enter Custom Amount</label>
                <div className="relative">
                    <input type="number" placeholder="e.g., 100" value={customQty} onChange={e => { setCustomQty(e.target.value); setQuantity(0); }} className="form-input text-xl"/>
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-300">TREES</span>
                </div>
            </div>
        </div>
        <button onClick={onNext} disabled={totalAmount <= 0} className="btn-primary w-full py-6 text-lg">
            Continue to RM {totalAmount}
        </button>
    </div>
);

const Step2 = ({ qrUrl, totalAmount, onBack, onNext }) => (
    <div className="flex flex-col flex-grow animate-in fade-in slide-in-from-right-8 duration-500 text-center">
        <div className="flex-grow space-y-6">
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <p className="text-green-800 text-xs font-black uppercase tracking-widest">Total Amount</p>
                <p className="text-4xl font-black text-green-900">RM {totalAmount}.00</p>
            </div>
            <div className="relative inline-block group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-green-500 to-green-300 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                <img src={qrUrl} alt="Payment QR Code" className="w-56 h-56 rounded-3xl mx-auto object-cover relative z-10 shadow-lg border-4 border-white" />
            </div>
            <div className="space-y-2 px-4">
                <p className="text-sm font-bold text-gray-800">Scan with your eWallet</p>
                <p className="text-xs text-gray-500">Scan the QR, pay RM {totalAmount}, and save your receipt screenshot for the final step.</p>
            </div>
        </div>
        <div className="flex gap-4 mt-8">
            <button onClick={onBack} className="btn-secondary flex-1 py-5">Back</button>
            <button onClick={onNext} className="btn-primary flex-[2] py-5">Payment Complete</button>
        </div>
    </div>
);

const Step3 = ({ file, preview, handleFileChange, donorName, setDonorName, isSubmitting, onSubmit, onBack }) => (
    <form onSubmit={onSubmit} className="flex flex-col flex-grow space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex-grow space-y-8">
            <div>
                <label className="form-label">Upload Receipt</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="receipt-upload" required />
                <label htmlFor="receipt-upload" className={`upload-area ${preview ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    {preview ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">{ICONS.Check}</div>
                            <p className="font-bold text-green-800 text-sm">Receipt Loaded</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{file?.name}</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border">{ICONS.Wallet}</div>
                            <p className="font-bold text-gray-700">Attach Receipt</p>
                            <p className="text-xs text-gray-400">PNG or JPG, max 5MB</p>
                        </div>
                    )}
                </label>
            </div>
            <div>
                <label className="form-label">Your Name (Optional)</label>
                <input type="text" placeholder="Name for the donor wall..." value={donorName} onChange={e => setDonorName(e.target.value)} className="form-input" />
            </div>
        </div>
        <div className="flex gap-4">
            <button type="button" onClick={onBack} className="btn-secondary flex-1 py-5">Back</button>
            <button type="submit" disabled={!file || isSubmitting} className="btn-primary flex-[2] py-5">
                {isSubmitting ? "Submitting..." : "Complete Donation"}
            </button>
        </div>
    </form>
);

// Add some base styles to a global stylesheet or directly in the component if not already present
// This is a simplified example of how you might define these utility classes.
/*
.form-label { @apply block text-sm font-bold text-gray-500 mb-3; }
.form-input { @apply w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-800 transition-all; }
.preset-btn { @apply p-6 rounded-2xl font-black transition-all border-2 text-xl flex flex-col items-center justify-center gap-1 bg-gray-50 border-gray-200 text-gray-500; }
.preset-btn-active { @apply bg-green-600 border-green-600 text-white shadow-lg shadow-green-100 scale-105; }
.upload-area { @apply w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all; }
.btn-primary { @apply py-4 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-200; }
.btn-secondary { @apply py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all; }
*/