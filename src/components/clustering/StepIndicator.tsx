type Step = 'source' | 'wordstat-dialog' | 'cities' | 'minus-filters' | 'processing' | 'results';

interface StepIndicatorProps {
  currentStep: Step;
}

const stepToNumber = (step: Step): number => {
  const stepMap: Record<string, number> = {
    source: 1,
    'wordstat-dialog': 1,
    cities: 2,
    'minus-filters': 3,
    processing: 3,
    results: 3,
  };
  return stepMap[step] ?? 1;
};

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const current = stepToNumber(currentStep);

  if (currentStep === 'processing' || currentStep === 'results') {
    return null;
  }

  return (
    <div className="mb-12 flex justify-center items-center gap-2">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
            current >= num 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white border-2 border-slate-200 text-slate-400'
          }`}>
            {num}
          </div>
          {num < 3 && <div className={`w-12 h-0.5 ${current > num ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}
