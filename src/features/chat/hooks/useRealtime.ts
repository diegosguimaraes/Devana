import { useEffect, useState } from 'react';

export { useRealtime } from '../../../hooks/useRealtime';

export function useWorkroomStopwatch() {
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const toggleRunning = () => setTimerRunning((prev) => !prev);
  const reset = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  return {
    timerRunning,
    timerSeconds,
    toggleRunning,
    reset,
  };
}
