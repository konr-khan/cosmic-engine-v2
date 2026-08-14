import React from 'react';
import { Globe, Compass, X } from 'lucide-react';
import { LatitudeSlider } from '../../controls/LatitudeSlider';
import { PolarLongitudeSelector } from '../../controls/PolarLongitudeSelector';

const formatLat = (l) => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'N') : 'S'}`;
const formatLon = (l) => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'E') : 'W'}`;

export const ChronometerModalPopovers = ({
  activePopup,
  onClose,
  latitude,
  longitude,
  onLatChange,
  onLonChange
}) => {
  if (!activePopup) return null;

  return (
    <>
      {/* =======================================================
          POPOVER 1: GLOBULAR LATITUDE SELECTOR MODAL
         ======================================================= */}
      {activePopup === 'lat' && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={onClose}
        >
          <div 
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl max-w-sm sm:max-w-md w-full relative space-y-3 max-h-[85vh] my-auto overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-400" /> Globular Latitude Selector
              </h4>
              <button 
                onClick={onClose} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-800 flex justify-center">
              <LatitudeSlider latitude={latitude} onChange={onLatChange} />
            </div>

            <div className="flex justify-between items-center text-xs font-mono px-1">
              <span className="text-slate-400">Selected Latitude:</span>
              <strong className="text-rose-400 font-bold text-sm">{formatLat(latitude)}</strong>
            </div>

            <button 
              onClick={onClose} 
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          POPOVER 2: POLAR 360° LONGITUDE SELECTOR MODAL
         ======================================================= */}
      {activePopup === 'lon' && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={onClose}
        >
          <div 
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl max-w-sm sm:max-w-md w-full relative space-y-3 max-h-[85vh] my-auto overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" /> Polar 360° Longitude Selector
              </h4>
              <button 
                onClick={onClose} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-800 flex justify-center">
              <PolarLongitudeSelector longitude={longitude} onChange={onLonChange} isDarkMode={true} />
            </div>

            <div className="flex justify-between items-center text-xs font-mono px-1">
              <span className="text-slate-400">Selected Longitude:</span>
              <strong className="text-amber-400 font-bold text-sm">{formatLon(longitude)}</strong>
            </div>

            <button 
              onClick={onClose} 
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChronometerModalPopovers;
