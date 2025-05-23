import React, { createContext, useContext, useState } from 'react';

export interface Device {
  id: string;
  name: string;
  ip: string;
}

interface DeviceContextType {
  devices: Device[];
  addDevice: (device: Device) => void;
  updateDeviceName: (id: string, name: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);

  const addDevice = (device: Device) => {
    setDevices(prev => [...prev, device]);
  };

  const updateDeviceName = (id: string, name: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, name } : d))
    );
  };

  return (
    <DeviceContext.Provider value={{ devices, addDevice, updateDeviceName }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);
  if (!context) throw new Error('useDeviceContext must be used within DeviceProvider');
  return context;
};
