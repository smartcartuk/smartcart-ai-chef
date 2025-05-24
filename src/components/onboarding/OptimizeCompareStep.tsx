
import React from 'react';

export const OptimizeCompareStep: React.FC = () => {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Optimize & Compare</h2>
        <p className="text-gray-600">Smart price comparison across your connected stores</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-3">Price optimization features:</h3>
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Compare prices across all your connected stores</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Apply loyalty card discounts automatically</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span className="text-sm">Suggest cheaper alternatives for expensive items</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <span className="text-sm">Split shopping across stores for maximum savings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
