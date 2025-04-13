import type { NextComponentType } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import StatusCarousel from "./StatusCarousel.misc"; // Add this import

type StatusData = {
  isActive: boolean;
  status: string;
  activity?: {
    name: string;
    details?: string;
    state?: string;
    image?: string | null;
  };
  message?: string;
  activeDevice?: string;
};

const DiscordStatus: NextComponentType = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/discord-status');
        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <StatusCarousel 
      baseWidth={400}
      autoplay={true}
      autoplayDelay={5000}
      discordActivity={status?.activity}
      activeDevice={status?.activeDevice} // Add this prop
    />
  );
};

export default DiscordStatus;