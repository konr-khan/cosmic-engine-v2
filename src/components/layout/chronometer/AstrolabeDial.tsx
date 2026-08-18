import React, { useRef, useState, useEffect, useCallback } from 'react';
import { toDegrees, getDaysInYear, getDayOfYear } from '../../../utils/cosmicMath';
import { ControlRing } from '../../controls/ControlRing';
import { ArmillaryRail } from '../../controls/ArmillaryRail';
import { LivingMarble } from '../../common/LivingMarble';

export interface AstrolabeDialProps {
  date: Date;
  timeOfDay: number;
  latitude: number;
  longitude: number;
  declination?: number;
  onDateChange?: (date: Date) => void;
  onTimeChange?: (time: number) => void;
  onLatChange?: (lat: number) => void;
  onLonChange?: (lon: number) => void;
}

const THEME = {
  date: "#10b981", // Outer: Emerald (Date)
  time: "#3b82f6", // 3rd: Blue (Time)
  lon: "#f59e0b",  // 2nd: Amber (Longitude)
  lat: "#f43f5e"   // Innermost: Rose (Latitude Armillary Rail)
};

const getAngle = (clientX: number, clientY: number, rect: DOMRect): number => {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = toDegrees(Math.atan2(dy, dx)) + 90; 
  if (angle < 0) angle += 360;
  return angle;
};

export const AstrolabeDial: React.FC<AstrolabeDialProps> = ({
  date,
  timeOfDay,
  latitude,
  longitude,
  declination = 0,
  onDateChange,
  onTimeChange,
  onLatChange,
  onLonChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeRing, setActiveRing] = useState<'date' | 'time' | 'lon' | 'lat' | null>(null);
  const [hoveredRing, setHoveredRing] = useState<'date' | 'time' | 'lon' | 'lat' | null>(null);

  // References to track previous drag values for boundary crossing/rollover detection
  const prevTimeRef = useRef(timeOfDay);
  const prevDayRef = useRef(1);

  const totalDays = getDaysInYear(date.getFullYear());
  const dayOfYear = getDayOfYear(date);

  useEffect(() => {
    prevTimeRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    prevDayRef.current = dayOfYear;
  }, [dayOfYear]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - (rect.left + cx);
    const dy = e.clientY - (rect.top + cy);
    const r = Math.sqrt(dx * dx + dy * dy);

    // Dynamic radial threshold scaling based on current render size (viewBox radius = 135)
    const scale = rect.width / 270;
    const scaledR = r / scale;

    if (scaledR > 115 && scaledR <= 135) setActiveRing('date');
    else if (scaledR > 90 && scaledR <= 115) setActiveRing('time');
    else if (scaledR > 65 && scaledR <= 90) setActiveRing('lon');
    else if (scaledR > 45 && scaledR <= 65 && dx < 10) setActiveRing('lat'); // Left half for Armillary Rail

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - (rect.left + cx);
    const dy = e.clientY - (rect.top + cy);
    const r = Math.sqrt(dx * dx + dy * dy);
    const scale = rect.width / 270;
    const scaledR = r / scale;

    // Update hovered ring when not dragging
    if (!activeRing) {
      if (scaledR > 115 && scaledR <= 135) setHoveredRing('date');
      else if (scaledR > 90 && scaledR <= 115) setHoveredRing('time');
      else if (scaledR > 65 && scaledR <= 90) setHoveredRing('lon');
      else if (scaledR > 45 && scaledR <= 65 && dx < 10) setHoveredRing('lat');
      else setHoveredRing(null);
    }

    if (!activeRing) return;
    const angle = getAngle(e.clientX, e.clientY, rect);

    if (activeRing === 'date' && onDateChange) {
      const newDay = Math.max(1, Math.min(totalDays, Math.round((angle / 360) * totalDays)));
      const prevDay = prevDayRef.current;
      const currentYear = date.getFullYear();

      // Year rollover detection when dragging across Jan 1 / Dec 31 boundary
      if (prevDay >= totalDays - 15 && newDay <= 15) {
        const nextYear = currentYear + 1;
        const nextTotalDays = getDaysInYear(nextYear);
        const adjustedDay = Math.min(newDay, nextTotalDays);
        prevDayRef.current = adjustedDay;
        onDateChange(new Date(nextYear, 0, adjustedDay));
      } else if (prevDay <= 15 && newDay >= totalDays - 15) {
        const prevYear = currentYear - 1;
        const prevTotalDays = getDaysInYear(prevYear);
        const adjustedDay = Math.min(newDay, prevTotalDays);
        prevDayRef.current = adjustedDay;
        onDateChange(new Date(prevYear, 0, adjustedDay));
      } else {
        prevDayRef.current = newDay;
        onDateChange(new Date(currentYear, 0, newDay));
      }
    } 
    else if (activeRing === 'time' && onTimeChange) {
      const newTime = parseFloat(((angle / 360) * 24).toFixed(3));
      const prevTime = prevTimeRef.current;

      // Day rollover detection when dragging across 00:00 / 24:00 boundary
      if (onDateChange) {
        if (prevTime >= 22 && newTime <= 2) {
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          onDateChange(nextDate);
        } else if (prevTime <= 2 && newTime >= 22) {
          const prevDate = new Date(date);
          prevDate.setDate(prevDate.getDate() - 1);
          onDateChange(prevDate);
        }
      }

      prevTimeRef.current = newTime;
      onTimeChange(newTime);
    } 
    else if (activeRing === 'lon' && onLonChange) {
      // Longitude: 0° Top (Greenwich), 90° East (Right), -90° West (Left), ±180° Bottom (IDL)
      let lon = angle;
      if (lon > 180) lon -= 360;
      onLonChange(Math.round(lon));
    } 
    else if (activeRing === 'lat' && onLatChange) {
      const scaleVal = rect.height / 270;
      const scaledDy = dy / scaleVal;
      const clampedY = Math.max(-54, Math.min(54, scaledDy));
      const lat = Math.round(toDegrees(-Math.asin(clampedY / 54)));
      onLatChange(lat);
    }
  }, [activeRing, date, totalDays, onDateChange, onTimeChange, onLonChange, onLatChange]);

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setActiveRing(null);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  };

  const handlePointerLeave = () => {
    if (!activeRing) setHoveredRing(null);
  };

  const formatDate = (d: number): string => {
    const tempDate = new Date(date.getFullYear(), 0, d);
    return tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const formatLat = (l: number): string => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'N') : 'S'}`;
  const formatLon = (l: number): string => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'E') : 'W'}`;
  const formatTimeStr = (t: number): string => {
    const h = Math.floor(t);
    const m = Math.floor((t - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}Z`;
  };

  const currentDisplayRing = activeRing || hoveredRing;

  return (
    <div className="relative w-full aspect-square max-w-[270px] mx-auto select-none touch-none">
      <svg 
        ref={svgRef}
        viewBox="-135 -135 270 270" 
        className={`w-full h-full drop-shadow-2xl overflow-visible ${activeRing ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Outer Bezel Base with Precision Hairlines */}
        <circle cx="0" cy="0" r="134" fill="none" stroke="#334155" strokeWidth="0.75" strokeOpacity="0.5" />
        <circle cx="0" cy="0" r="132.5" fill="none" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="45" fill="url(#hubGlow)" />

        {/* 1. OUTER RING (R=125): DATE / DAY-OF-YEAR (Emerald) */}
        <ControlRing 
          radius={125} 
          width={14} 
          value={dayOfYear} 
          max={totalDays} 
          color={THEME.date} 
          formatValue={formatDate}
        />

        {/* 2. SECOND RING (R=102): TIME OF DAY (Blue) */}
        <ControlRing 
          radius={102} 
          width={14} 
          value={timeOfDay} 
          max={24} 
          color={THEME.time} 
          formatValue={formatTimeStr}
        />

        {/* 3. THIRD RING (R=78): LONGITUDE (Amber, 0° top, +90° right, -90° left) */}
        <ControlRing 
          radius={78} 
          width={14} 
          value={longitude} 
          max={360} 
          color={THEME.lon} 
          formatValue={formatLon}
        />

        {/* 4. FOURTH RING (R=54): LATITUDE ARMILLARY RAIL (Rose) */}
        <ArmillaryRail 
          radius={54} 
          width={14} 
          latitude={latitude} 
          color={THEME.lat} 
        />

        {/* Central Living Earth Globe Hub (R=45) */}
        <LivingMarble 
          declination={declination} 
          timeOfDay={timeOfDay} 
          longitude={longitude} 
          radius={45} 
        />

        {/* Crosshair Horizon & Meridian Sights */}
        <line x1="0" y1="-45" x2="0" y2="45" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" pointerEvents="none" />
        <line x1="-45" y1="0" x2="45" y2="0" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" pointerEvents="none" />
        
        {/* Center Pivot Point */}
        <circle cx="0" cy="0" r="2.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" pointerEvents="none" />

        {/* TOP-LEVEL FLOATING TOOLTIP (Highest z-index in SVG to prevent occlusion) */}
        {currentDisplayRing && (
          <g transform="translate(0, 118)" pointerEvents="none" className="animate-in fade-in zoom-in-90 duration-150">
            <rect 
              x="-45" 
              y="-12" 
              width="90" 
              height="22" 
              rx="7" 
              fill="#020617" 
              fillOpacity="0.95"
              stroke={THEME[currentDisplayRing]} 
              strokeWidth="1.5" 
              className="drop-shadow-2xl"
            />
            <text 
              x="0" 
              y="3" 
              textAnchor="middle" 
              className="text-[10.5px] font-mono font-bold fill-white"
            >
              {currentDisplayRing === 'date' && formatDate(dayOfYear)}
              {currentDisplayRing === 'time' && formatTimeStr(timeOfDay)}
              {currentDisplayRing === 'lon' && formatLon(longitude)}
              {currentDisplayRing === 'lat' && formatLat(latitude)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default AstrolabeDial;
