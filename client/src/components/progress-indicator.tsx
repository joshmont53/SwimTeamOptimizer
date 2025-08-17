interface ProgressIndicatorProps {
  currentStep: number;
  isCustomTemplate?: boolean;
}

export default function ProgressIndicator({ currentStep, isCustomTemplate = false }: ProgressIndicatorProps) {
  const steps = isCustomTemplate ? [
    { number: 0.5, label: "Build Events", displayNumber: "1a" },
    { number: 1, label: "Upload Data", displayNumber: "1b" },
    { number: 2, label: "Squad Selection", displayNumber: "2" },
    { number: 3, label: "Event Assignment", displayNumber: "3" },
    { number: 4, label: "Results", displayNumber: "4" }
  ] : [
    { number: 1, label: "Upload Data", displayNumber: "1" },
    { number: 2, label: "Squad Selection", displayNumber: "2" },
    { number: 3, label: "Event Assignment", displayNumber: "3" },
    { number: 4, label: "Results", displayNumber: "4" }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.displayNumber}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step.number 
                    ? 'text-primary-600 font-medium' 
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-16 h-1 bg-gray-200 ml-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
