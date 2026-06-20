import React from 'react';
import { Check } from 'lucide-react';

interface CheckoutStepsProps {
  currentStep: number; // 1, 2, or 3
}

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const steps = [
    { number: 1, name: 'Thông tin giao hàng' },
    { number: 2, name: 'Thanh toán & Vận chuyển' },
    { number: 3, name: 'Hoàn tất đơn hàng' },
  ];

  return (
    <div className="w-full py-4 mb-8">
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          
          return (
            <React.Fragment key={step.number}>
              {/* Step bubble */}
              <div className="flex flex-col items-center relative z-10 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isActive
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-md shadow-primary-500/10'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`text-3xs font-extrabold tracking-wide uppercase mt-2.5 whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'text-primary-600' : 'text-slate-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              
              {/* Line connector */}
              {idx < steps.length - 1 && (
                <div className="flex-grow h-0.5 mx-2 bg-slate-200 relative -top-3">
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
