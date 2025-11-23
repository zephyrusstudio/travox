import { Monitor, Tablet } from "lucide-react";
import React from "react";

const UnsupportedDevice: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center space-x-4 mb-6">
          <Monitor className="w-16 h-16 text-blue-600" />
          <Tablet className="w-16 h-16 text-blue-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Device Not Supported
        </h1>
        
        <p className="text-gray-600 mb-6">
          This application is optimized for desktop and tablet devices. 
          Please access from a larger screen for the best experience.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-medium mb-2">Supported Devices:</p>
          <ul className="text-left space-y-1">
            <li>• Laptops or Desktops</li>
            <li>• Tablets (iPad, Galaxy Tab, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnsupportedDevice;
