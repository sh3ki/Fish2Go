import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import PrinterService from '../Services/PrinterService';

interface PrinterContextType {
  isPrinting: boolean;
  printerError: string | null;
  isSecureContext: boolean;
  printerConnected: boolean;
  printerName: string | undefined;
  printReceipt: (orderData: any) => Promise<boolean>;
  connectPrinter: () => Promise<boolean>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

interface PrinterProviderProps {
  children: ReactNode;
}

export const PrinterProvider: React.FC<PrinterProviderProps> = ({ children }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerName, setPrinterName] = useState<string | undefined>(undefined);
  
  const printerService = new PrinterService();

  // Check if we're in a secure context on component mount
  useEffect(() => {
    setIsSecureContext(window.isSecureContext);
    
    // Check initial printer connection status
    const status = printerService.getConnectionStatus();
    setPrinterConnected(status.isConnected);
    setPrinterName(status.deviceName);
    
    // Show warning if not in secure context
    if (!window.isSecureContext) {
      setPrinterError(
        "This app is running in a non-secure context (not HTTPS or localhost). " +
        "Web Bluetooth requires HTTPS or localhost. " +
        "Please use HTTPS or access via localhost instead of an IP address."
      );
    }
  }, []);

  const connectPrinter = async (): Promise<boolean> => {
    try {
      setPrinterError(null);
      await printerService.setupPrinterConnection();
      
      // Update connection status after attempt
      const status = printerService.getConnectionStatus();
      setPrinterConnected(status.isConnected);
      setPrinterName(status.deviceName);
      
      return status.isConnected;
    } catch (error) {
      console.error("Printer connection error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPrinterError(errorMessage);
      return false;
    }
  };

  const printReceipt = async (orderData: any): Promise<boolean> => {
    try {
      setIsPrinting(true);
      setPrinterError(null);
      
      if (!window.isSecureContext) {
        setPrinterError(
          "Cannot print: Web Bluetooth requires HTTPS or localhost. " +
          "You're currently using HTTP. Please switch to HTTPS or localhost."
        );
        setIsPrinting(false);
        return false;
      }
      
      console.log("Printing receipt...");
      const success = await printerService.printReceipt(orderData);
      
      if (!success) {
        setPrinterError("Failed to print receipt. Check printer connection.");
      }
      
      // Update status after printing
      const status = printerService.getConnectionStatus();
      setPrinterConnected(status.isConnected);
      
      setIsPrinting(false);
      return success;
    } catch (error) {
      console.error("Print error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPrinterError(errorMessage);
      setIsPrinting(false);
      return false;
    }
  };

  return (
    <PrinterContext.Provider value={{
      isPrinting,
      printerError,
      isSecureContext,
      printerConnected,
      printerName,
      printReceipt,
      connectPrinter
    }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = (): PrinterContextType => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};
