
import React from "react";

type RegistrationStep = "account" | "personal" | "children" | "review" | "complete";

interface ProgressBarProps {
  currentStep: RegistrationStep;
}

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "account" || currentStep === "personal" || 
            currentStep === "children" || currentStep === "review" || 
            currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}>
            1
          </div>
          <div className={`h-1 w-12 ${
            currentStep === "personal" || currentStep === "children" || 
            currentStep === "review" || currentStep === "complete" ? "bg-blue-500" : "bg-gray-200"
          }`}></div>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "personal" || currentStep === "children" || 
            currentStep === "review" || currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}>
            2
          </div>
          <div className={`h-1 w-12 ${
            currentStep === "children" || currentStep === "review" || 
            currentStep === "complete" ? "bg-blue-500" : "bg-gray-200"
          }`}></div>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "children" || currentStep === "review" || 
            currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}>
            3
          </div>
          <div className={`h-1 w-12 ${
            currentStep === "review" || currentStep === "complete" ? "bg-blue-500" : "bg-gray-200"
          }`}></div>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep === "review" || currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}>
            4
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-sm">
        <span className={currentStep === "account" ? "font-medium text-blue-600" : ""}>Account</span>
        <span className={currentStep === "personal" ? "font-medium text-blue-600" : ""}>Personal</span>
        <span className={currentStep === "children" ? "font-medium text-blue-600" : ""}>Children</span>
        <span className={currentStep === "review" || currentStep === "complete" ? "font-medium text-blue-600" : ""}>Review</span>
      </div>
    </div>
  );
};

export default ProgressBar;

