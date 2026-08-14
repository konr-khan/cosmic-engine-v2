import React, { useRef, useState, useEffect, useCallback } from 'react';
import { toDegrees, getDaysInYear, getDayOfYear } from '../../../utils/cosmicMath';
import { ControlRing } from '../../controls/ControlRing';
import { ArmillaryRail } from '../../controls/ArmillaryRail';
import { LivingMarble } from '../../common/LivingMarble';

const THEME = {
  date: "#10b981", // Outer: Emerald (Date)
  time: "#3b82f6", // 3rd: Blue (Time)
  lon: "#f59e0b",  // 2nd: Amber (Longitude)
  lat: "#f43f5e"   // Innermost: Rose (Latitude Armillary Rail)
};

const getAngle = (clientX, clientY, rect) => {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let angle = toDegrees(Math.atan2(dy, dx)) + 90; 
  if (angle < 0) angle += 360;
  return angle;
};

export const AstrolabeDial = ({
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
  const svgRef = useRef(null);
  const [activeRing, setActiveRing] = useState(null);

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

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - (rect.left + cx);
    const dy = e.clientY - (rect.top + cy);
    const domDist = Math.sqrt(dx * dx + dy * dy);

    // Convert DOM pixel distance to SVG viewBox radius coordinates (viewBox is -160 to +160, total 320)
    const scale = 320 / rect.width;
    const dist = domDist * scale;

    if (dist >= 122 && dist <= 155) {
      setActiveRing('date');
    } else if (dist >= 95 && dist < 122) {
      setActiveRing('time');
    } else if (dist >= 68 && dist < 95) {
      setActiveRing('lon');
    } else if (dist >= 42 && dist < 68) {
      setActiveRing('lat');
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (!activeRing || !svgRef.current) return;
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();

    if (activeRing === 'lat') {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const latAngleRad = Math.atan2(-dy, -dx);
      let latDeg = Math.round(toDegrees(latAngleRad));
      latDeg = Math.max(-90, Math.min(90, latDeg));
      if (onLatChange) onLatChange(latDeg);
      return;
    }

    const angle = getAngle(e.clientX, e.clientY, rect);

    if (activeRing === 'date') {
      const rawDay = (angle / 360) * totalDays;
      const roundedDay = Math.max(1, Math.min(totalDays, Math.round(rawDay)));
      const prevDay = prevDayRef.current;

      let targetYear = date.getFullYear();
      if (prevDay > 340 && roundedDay < 20) {
        targetYear += 1;
      } else if (prevDay < 20 && roundedDay > 340) {
        targetYear -= 1;
      }

      const newDate = new Date(targetYear, 0, roundedDay);
      if (onDateChange) onDateChange(newDate);
    } 
    else if (activeRing === 'lon') {
      let lon = angle;
      if (lon > 180) lon -= 360;
      if (onLonChange) onLonChange(Math.round(lon));
    } 
    else if (activeRing === 'time') {
      let newTime = (angle / 360) * 24; 
      if (newTime >= 24) newTime -= 24;

      const prevTime = prevTimeRef.current;

      if (prevTime > 20 && newTime < 4) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        if (onDateChange) onDateChange(nextDay);
      } else if (prevTime < 4 && newTime > 20) {
        const prevDay = new Date(date);
        prevDay.setDate(prevDay.getDate() - 1);
        if (onDateChange) onDateChange(prevDay);
      }

      if (onTimeChange) onTimeChange(parseFloat(newTime.toFixed(3)));
    }
  }, [activeRing, date, totalDays, onDateChange, onLonChange, onTimeChange, onLatChange]);

  const handlePointerUp = () => setActiveRing(null);

  useEffect(() => {
    if (activeRing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeRing, handlePointerMove]);

  const formatDate = (d) => {
    const tempDate = new Date(date.getFullYear(), 0, d);
    return tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const formatLon = (l) => `${Math.abs(l)}°${l >= 0 ? (l === 0 ? '' : 'E') : 'W'}`;
  const formatTimeStr = (t) => {
    const h = Math.floor(t);
    const m = Math.floor((t - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}Z`;
  };

  const normalizedLon = (longitude + 360) % 360;

  return (
    <div className="relative w-[210px] h-[210px] shrink-0 touch-none cursor-crosshair flex items-center justify-center">
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox="-160 -160 320 320"
        onPointerDown={handlePointerDown}
        className="drop-shadow-2xl overflow-visible"
      >
        {/* Outermost Ring (Layer 4): Date */}
        <ControlRing 
          radius={136} 
          width={22} 
          value={dayOfYear} 
          max={totalDays} 
          color={THEME.date}
          formatValue={(d) => formatDate(d)}
        />
        <g className="pointer-events-none opacity-40">
          <text x="0" y="-120" textAnchor="middle" className="text-[7px] font-bold fill-slate-400 font-mono tracking-widest">JUN SOL</text>
          <text x="0" y="126" textAnchor="middle" className="text-[7px] font-bold fill-slate-400 font-mono tracking-widest">DEC SOL</text>
        </g>

        {/* Third Ring (Layer 3): Time */}
        <ControlRing 
          radius={108} 
          width={20} 
          value={timeOfDay} 
          max={24}
          rangeOffset={0} 
          color={THEME.time}
          formatValue={formatTimeStr}
        />
        <g className="pointer-events-none opacity-40">
          <text x="0" y="-92" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-300 font-mono">0000Z</text>
          <text x="0" y="98" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-300 font-mono">1200Z</text>
        </g>

        {/* Second Ring (Layer 2): Longitude */}
        <ControlRing 
          radius={82} 
          width={20} 
          value={normalizedLon} 
          max={360}
          rangeOffset={0} 
          color={THEME.lon}
          formatValue={() => formatLon(longitude)}
        />
        <g className="pointer-events-none opacity-40">
          <text x="0" y="-66" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">0°</text>
          <text x="0" y="72" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">180°</text>
          <text x="70" y="3" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">90°E</text>
          <text x="-70" y="3" textAnchor="middle" className="text-[6.5px] font-bold fill-slate-400 font-mono">90°W</text>
        </g>

        {/* Innermost Ring (Layer 1): Armillary Meridian Rail (Latitude) */}
        <ArmillaryRail 
          radius={54} 
          width={16} 
          latitude={latitude} 
          color={THEME.lat} 
        />

        {/* Living Earth Center */}
        <LivingMarble 
          declination={declination} 
          timeOfDay={timeOfDay} 
          longitude={longitude} 
          radius={36}
        />
      </svg>
    </div>
  );
};

export default AstrolabeDial;
