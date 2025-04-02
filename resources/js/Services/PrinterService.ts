/**
 * PrinterService.ts
 * Service for handling communication with XP-58IIH thermal printer via Bluetooth
 */

/// <reference types="web-bluetooth" />

// ESC/POS commands
const ESC = 0x1B;
const GS = 0x1D;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total?: string | number;
}

interface OrderData {
  orderId: string | number;
  items: OrderItem[];
  subtotal?: string | number;
  tax?: string | number;
  discount?: string | number;
  total: string | number;
  payment?: string | number;
  change?: string | number;
  customerName?: string;
  paymentMethod?: string;
  date?: string;
}

interface PrinterConnectionStatus {
  isConnected: boolean;
  deviceName?: string;
  errorMessage?: string;
}

export default class PrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isSecureContext: boolean;
  private isConnected: boolean = false;
  
  constructor() {
    // Check if running in secure context (HTTPS or localhost)
    this.isSecureContext = window.isSecureContext;
    
    // Display warnings for non-secure contexts
    if (!this.isSecureContext) {
      console.warn("WARNING: Web Bluetooth requires a secure context (HTTPS or localhost)");
      console.warn("Running on HTTP will prevent printer connection");
      console.warn("Try accessing via HTTPS or localhost instead");
    }
  }

  // Check connection status
  public getConnectionStatus(): PrinterConnectionStatus {
    return {
      isConnected: this.isConnected,
      deviceName: this.device?.name,
      errorMessage: !this.isSecureContext ? 
        "Web Bluetooth requires HTTPS. Connect using HTTPS or localhost" : 
        undefined
    };
  }

  // Always assume the printer is connected and ready
  async printReceipt(orderData: OrderData): Promise<boolean> {
    // Check for browser support first
    if (!navigator.bluetooth) {
      console.error("Bluetooth not supported in this browser");
      return false;
    }
    
    // Alert about non-secure context
    if (!this.isSecureContext) {
      console.error("Cannot print: Web Bluetooth requires HTTPS or localhost");
      throw new Error("Printing requires a secure connection (HTTPS or localhost). Current connection is not secure.");
    }

    try {
      // Format receipt data
      console.log("Formatting receipt for printing...");
      const receiptData = this.formatReceipt(orderData);
      
      // Get the printer characteristic if needed
      if (!this.characteristic || !this.isConnected) {
        await this.setupPrinterConnection();
      }
      
      if (!this.characteristic) {
        console.error("Printer not ready - characteristic unavailable");
        return false;
      }
      
      // Send data to printer in chunks
      const CHUNK_SIZE = 512;
      for (let i = 0; i < receiptData.byteLength; i += CHUNK_SIZE) {
        const chunk = receiptData.slice(i, Math.min(i + CHUNK_SIZE, receiptData.byteLength));
        await this.characteristic.writeValue(chunk);
        
        // Brief delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log("Receipt printed successfully!");
      return true;
    } catch (error) {
      console.error("Error printing receipt:", error);
      if (!this.isSecureContext) {
        console.error("IMPORTANT: Web Bluetooth requires HTTPS. Switch to HTTPS or localhost.");
      }
      throw error;
    }
  }

  // Setup printer connection - only called if needed
  public async setupPrinterConnection(): Promise<void> {
    // First check for secure context
    if (!this.isSecureContext) {
      console.error("Cannot connect to printer: Web Bluetooth requires HTTPS or localhost");
      throw new Error(
        "Printer connection requires HTTPS. You appear to be using HTTP. " +
        "Please access this page via HTTPS or localhost instead of an IP address."
      );
    }
    
    if (!navigator.bluetooth) {
      console.warn("Bluetooth not supported; entering simulation mode.");
      // Create a dummy characteristic that logs data instead of sending it to a printer
      this.characteristic = {
        writeValue: async (value: ArrayBuffer) => {
          console.log("Simulated printer write:", new Uint8Array(value));
        },
        properties: { write: true, writeWithoutResponse: true }
      } as BluetoothRemoteGATTCharacteristic;
      return;
    }

    try {
      console.log("Connecting to printer...");
      
      // Check if Bluetooth is available on this device
      const available = await navigator.bluetooth.getAvailability();
      if (!available) {
        throw new Error("Bluetooth is turned off or not available on this device");
      }
      
      // Try to get a list of any Bluetooth devices - these filters cover most thermal printers
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "Printer" },
          { namePrefix: "POS" },
          { namePrefix: "XP" },
          { namePrefix: "ZJ" },
          { namePrefix: "MTP" },
          { namePrefix: "Thermal" },
          { namePrefix: "BlueTooth" },
          { namePrefix: "BT" }
        ],
        // But also accept any device if the user wants to try a different one
        acceptAllDevices: true,
        // Common printer services and characteristics
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb", // Common printer service
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Alternative service
          "0000ff00-0000-1000-8000-00805f9b34fb",  // Another common service
          "49535343-fe7d-4ae5-8fa9-9fafd205e455"  // Generic serial
        ]
      });
      
      if (!this.device) {
        throw new Error("No printer selected");
      }
      
      console.log("Connecting to device:", this.device.name);
      
      // Set up handler for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log("Printer disconnected");
        this.isConnected = false;
        this.characteristic = null;
      });
      
      // Try to connect to the GATT server
      const server = await this.device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to printer GATT server");
      
      console.log("Getting available services...");
      // Get all available services - better for discovery
      const services = await server.getPrimaryServices();
      if (services.length === 0) {
        throw new Error("No services found on this device. It may not be a printer.");
      }
      
      // List all found services for debugging
      console.log("Found services:", services.map(s => s.uuid));
      
      // Try to find a characteristic we can write to
      let writableCharacteristic = null;
      for (const service of services) {
        console.log("Checking service:", service.uuid);
        try {
          const characteristics = await service.getCharacteristics();
          console.log("Found characteristics:", characteristics.map(c => c.uuid));
          
          // Find any writable characteristic
          writableCharacteristic = characteristics.find(c => 
            c.properties.write || c.properties.writeWithoutResponse
          );
          
          if (writableCharacteristic) {
            console.log("Found writable characteristic:", writableCharacteristic.uuid);
            this.characteristic = writableCharacteristic;
            this.isConnected = true;
            break;
          }
        } catch (e) {
          console.log("Error accessing service characteristics:", e);
        }
      }
      
      if (!this.characteristic) {
        throw new Error("No writable characteristic found on this device");
      }
      
      console.log("Printer connected successfully!");
      this.isConnected = true;

    } catch (error) {
      console.error("Error setting up printer connection:", error);
      this.isConnected = false;
      this.characteristic = null;
      throw error;
    }
  }

  // Format receipt data
  private formatReceipt(orderData: OrderData): ArrayBuffer {
    // Create an array buffer with ESC/POS commands
    const encoder = new TextEncoder();
    const buffer = new ArrayBuffer(4096);
    const dataView = new DataView(buffer);
    let offset = 0;

    // Initialize printer
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x40); // ESC @

    // Center align
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x61); // ESC a
    dataView.setUint8(offset++, 1); // 1 = center

    // Bold text for header
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x45); // ESC E
    dataView.setUint8(offset++, 1); // 1 = bold

    // Store name
    const storeNameBytes = encoder.encode("Fish2Go");
    for (let i = 0; i < storeNameBytes.length; i++) {
      dataView.setUint8(offset++, storeNameBytes[i]);
    }
    
    // Line feed
    dataView.setUint8(offset++, 0x0A); // LF

    // Cancel bold
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x45); // ESC E
    dataView.setUint8(offset++, 0); // 0 = not bold

    // Date and order number
    const dateText = orderData.date ? orderData.date : new Date().toLocaleDateString();
    const dateBytes = encoder.encode(`Date: ${dateText}`);
    for (let i = 0; i < dateBytes.length; i++) {
      dataView.setUint8(offset++, dateBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    const timeBytes = encoder.encode(`Time: ${new Date().toLocaleTimeString()}`);
    for (let i = 0; i < timeBytes.length; i++) {
      dataView.setUint8(offset++, timeBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    const orderNoBytes = encoder.encode(`Order #: ${orderData.orderId}`);
    for (let i = 0; i < orderNoBytes.length; i++) {
      dataView.setUint8(offset++, orderNoBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    // Divider
    const dividerBytes = encoder.encode("--------------------------------");
    for (let i = 0; i < dividerBytes.length; i++) {
      dataView.setUint8(offset++, dividerBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    // Left align for items
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x61); // ESC a
    dataView.setUint8(offset++, 0); // 0 = left

    // Items
    orderData.items.forEach(item => {
      const itemNameBytes = encoder.encode(`${item.quantity}x ${item.name}`);
      for (let i = 0; i < itemNameBytes.length; i++) {
        dataView.setUint8(offset++, itemNameBytes[i]);
      }
      dataView.setUint8(offset++, 0x0A); // LF

      const itemTotal = item.total !== undefined 
        ? item.total 
        : (item.price * item.quantity).toFixed(2);
        
      const priceBytes = encoder.encode(`  ₱${itemTotal}`);
      for (let i = 0; i < priceBytes.length; i++) {
        dataView.setUint8(offset++, priceBytes[i]);
      }
      dataView.setUint8(offset++, 0x0A); // LF
    });

    // Divider
    for (let i = 0; i < dividerBytes.length; i++) {
      dataView.setUint8(offset++, dividerBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    // Financial details
    if (orderData.subtotal !== undefined) {
      const subtotalBytes = encoder.encode(`Subtotal: ₱${orderData.subtotal}`);
      for (let i = 0; i < subtotalBytes.length; i++) {
        dataView.setUint8(offset++, subtotalBytes[i]);
      }
      dataView.setUint8(offset++, 0x0A); // LF
    }

    if (orderData.tax !== undefined) {
      const taxBytes = encoder.encode(`Tax: ₱${orderData.tax}`);
      for (let i = 0; i < taxBytes.length; i++) {
        dataView.setUint8(offset++, taxBytes[i]);
      }
      dataView.setUint8(offset++, 0x0A); // LF
    }

    if (orderData.discount !== undefined) {
      const discountBytes = encoder.encode(`Discount: ₱${orderData.discount}`);
      for (let i = 0; i < discountBytes.length; i++) {
        dataView.setUint8(offset++, discountBytes[i]);
      }
      dataView.setUint8(offset++, 0x0A); // LF
    }

    // Total - make it bold
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x45); // ESC E
    dataView.setUint8(offset++, 1); // 1 = bold

    const totalBytes = encoder.encode(`Total: ₱${orderData.total}`);
    for (let i = 0; i < totalBytes.length; i++) {
      dataView.setUint8(offset++, totalBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    // Disable bold
    dataView.setUint8(offset++, ESC);
    dataView.setUint8(offset++, 0x45); // ESC E
    dataView.setUint8(offset++, 0); // 0 = not bold

    // Payment and change
    if (orderData.payment !== undefined) {
      dataView.setUint8(offset++, 0x0A); // LF
    }

    // Footer
    const footerBytes = encoder.encode("Thank you for your purchase!");
    for (let i = 0; i < footerBytes.length; i++) {
      dataView.setUint8(offset++, footerBytes[i]);
    }
    dataView.setUint8(offset++, 0x0A); // LF

    // Extra line feeds before cutting
    dataView.setUint8(offset++, 0x0A); // LF
    dataView.setUint8(offset++, 0x0A); // LF

    // Cut paper
    dataView.setUint8(offset++, GS);
    dataView.setUint8(offset++, 0x56); // GS V
    dataView.setUint8(offset++, 0x00); // Full cut

    return buffer.slice(0, offset);
  }
}
