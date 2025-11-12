type Step = 'source' | 'cities' | 'goal' | 'minus-filters' | 'processing' | 'results';

interface StepIndicatorProps {
  currentStep: Step;
}

const stepToNumber = (step: Step): number => {
  const stepMap = { source: 1, cities: 2, goal: 3, 'minus-filters': 4, processing: 5, results: 5 };
  return stepMap[step] || 1;
};

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const current = stepToNumber(currentStep);

  if (currentStep === 'processing' || currentStep === 'results') {
    return null;
  }

  return (
    <div className="mb-12 flex justify-center items-center gap-2">
      {[1, 2, 3, 4].map((num) => (
        <div key={num} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
            current >= num 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white border-2 border-slate-200 text-slate-400'
          }`}>
            {num}
          </div>
          {num < 4 && <div className={`w-12 h-0.5 ${current > num ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}