
import React from 'react';

export const ExportShopStep: React.FC = () => {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Export & Shop</h2>
        <p className="text-gray-600">Your SmartCart is ready! Choose how you'd like to shop</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-3">Shopping options:</h3>
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Export shopping list to email or PDF</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Auto-fill baskets on supermarket websites</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-sm">Schedule weekly delivery or collection</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span className="text-sm">Track your weekly savings progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
