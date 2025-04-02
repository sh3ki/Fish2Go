import { useState, useRef, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { X, CirclePlus, CircleMinus, CircleX, AlertCircle, LayoutList, Printer } from "lucide-react";
import axios from "axios";
import { router } from "@inertiajs/react";
import { usePrinter } from "../Contexts/PrinterContext"; // Import usePrinter hook
import PrinterService from "../Services/PrinterService"; // Add this import
import { PrinterProvider } from "../Contexts/PrinterContext"; // Import PrinterProvider
import SearchBar from "@/components/ui/search-bar"; // Import SearchBar component

const breadcrumbs: BreadcrumbItem[] = [{ title: "POS", href: "/staff/pos" }];

export default function POS() {
    const { products: initialProducts, categories } = usePage().props;

    const [availableProducts, setAvailableProducts] = useState(initialProducts);
    const [selectedItems, setSelectedItems] = useState([]);
    const [cash, setCash] = useState("");
    const [focusedInputType, setFocusedInputType] = useState(null); // 'cash' or 'quantity'
    const [focusedItemId, setFocusedItemId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [discount, setDiscount] = useState(0);
    const [editableQty, setEditableQty] = useState(null); // Add this for editable quantity
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showFullScreenPrompt, setShowFullScreenPrompt] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);  // Initialize as empty array
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all"); // Add this state to track active category
    const categoryButtonRef = useRef(null);
    const categoryModalRef = useRef(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false); // Add new state for checkout modal
    const [showPrinterHelp, setShowPrinterHelp] = useState(false); // Add state for printer help modal
    const [allowInsecurePrinting, setAllowInsecurePrinting] = useState(false); // Flag to allow alternative printing

    const cashInputRef = useRef(null);

    const { 
        printReceipt, 
        isPrinting, 
        printerError, 
        isSecureContext, 
        printerConnected, 
        printerName,
        connectPrinter 
    } = usePrinter(); // Use printer context with extended properties
    
    const [printingStatus, setPrintingStatus] = useState(""); // Track printing status

    // Check for development mode on component mount
    useEffect(() => {
        // Check if running in development mode via IP address
        const isDevMode = !window.isSecureContext && 
            window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/);
        
        if (isDevMode) {
            console.log("Running in development mode on IP address:", window.location.hostname);
            // Auto-enable development printing mode
            setAllowInsecurePrinting(true);
        }
    }, []);

    // Define the category order function - updated to group by category and sort by ID
    const sortProductsByCategory = (products) => {
        // Define specific category order
        const categoryOrder = {
            "Grilled": 1,
            "Ready2Eat": 2,
            "Ready2Cook": 3,
            "Bottled": 4
        };
        
        // First group products by category
        const groupedProducts = products.reduce((groups, product) => {
            const categoryName = product.category_name;
            if (!groups[categoryName]) {
                groups[categoryName] = [];
            }
            groups[categoryName].push(product);
            return groups;
        }, {});
        
        // Sort each category group by product_id
        Object.keys(groupedProducts).forEach(category => {
            groupedProducts[category].sort((a, b) => 
                // Primary sort by product_id
                parseInt(a.product_id) - parseInt(b.product_id)
            );
        });
        
        // Convert back to array, respecting the defined category order
        const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
            const orderA = categoryOrder[a] || 999;
            const orderB = categoryOrder[b] || 999;
            return orderA - orderB;
        });
        
        // Flatten the grouped products into a single array
        return sortedCategories.flatMap(category => groupedProducts[category]);
    };

    // Initialize filtered products with sorted products on component mount
    useEffect(() => {
        const sortedProducts = sortProductsByCategory(initialProducts);
        setFilteredProducts(sortedProducts);
    }, [initialProducts]);

    // Handle search results from SearchBar component
    const handleSearchResults = (results) => {
        // Apply category filter if needed
        let filtered = results;
        
        if (activeCategory === "available") {
            filtered = filtered.filter(product => parseInt(product.product_qty) > 0);
        } else if (activeCategory !== "all") {
            filtered = filtered.filter(product => product.category_id === activeCategory);
        }
        
        // Apply category grouping and ID sorting to search results
        setFilteredProducts(sortProductsByCategory(filtered));
    };

    // Handle search term changes
    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    // Enhanced filter products based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            // When clearing search, apply active category filter
            filterByCategory(activeCategory);
        } else {
            // Split the search term into individual words (tokens)
            const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(token => token.length > 0);
            
            let filtered = availableProducts.filter(product => {
                const productName = product.product_name.toLowerCase();
                
                // Check if all search tokens are found in the product name
                return searchTokens.every(token => 
                    productName.includes(token)
                );
            });
            
            // Apply category filter if not showing all products
            if (activeCategory === "available") {
                filtered = filtered.filter(product => parseInt(product.product_qty) > 0);
            } else if (activeCategory !== "all") {
                filtered = filtered.filter(product => product.category_id === activeCategory);
            }
            
            // Apply category grouping and ID sorting to search results
            setFilteredProducts(sortProductsByCategory(filtered));
        }
    }, [searchTerm, availableProducts, activeCategory]);

    // Full-screen functionality
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true);
                setShowFullScreenPrompt(false);
                localStorage.setItem('staffFullScreenMode', 'true');
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
    };

    // Check if user previously entered full-screen mode
    useEffect(() => {
        const wasInFullScreen = localStorage.getItem('staffFullScreenMode') === 'true';
        if (wasInFullScreen) {
            setShowFullScreenPrompt(false);
        }

        const handleUserInteraction = () => {
            if (!document.fullscreenElement) {
                toggleFullScreen();
            }
        };

        if (!document.fullscreenElement) {
            window.addEventListener('click', handleUserInteraction, { once: true });
            window.addEventListener('keydown', handleUserInteraction, { once: true });
        }

        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
            if (!document.fullscreenElement) {
                setShowFullScreenPrompt(true);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Close category dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (categoryModalRef.current && 
                !categoryModalRef.current.contains(event.target) &&
                categoryButtonRef.current && 
                !categoryButtonRef.current.contains(event.target)) {
                setShowCategoryModal(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getAvailableStock = (productId) => {
        const product = availableProducts.find(p => p.product_id === productId);
        return product ? parseInt(product.product_qty) : 0;
    };

    const addToOrder = (product) => {
        const availableStock = parseInt(product.product_qty);
        
        if (availableStock <= 0) {
            setErrorMessage("No stock available for this item.");
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        setAvailableProducts(prev => {
            return prev.map(p => {
                if (p.product_id === product.product_id) {
                    return {
                        ...p,
                        product_qty: Math.max(0, parseInt(p.product_qty) - 1)
                    };
                }
                return p;
            });
        });

        setSelectedItems((prev) => {
            const existing = prev.find((item) => item.product_id === product.product_id);
            if (existing) {
                return prev.map((item) =>
                    item.product_id === product.product_id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }
            return [...prev, { ...product, product_price: parseFloat(product.product_price), qty: 1 }];
        });
    };

    const removeItem = (id) => {
        const item = selectedItems.find(item => item.product_id === id);
        if (item) {
            setAvailableProducts(prev => {
                return prev.map(p => {
                    if (p.product_id === id) {
                        return {
                            ...p,
                            product_qty: parseInt(p.product_qty) + item.qty
                        };
                    }
                    return p;
                });
            });
        }

        setSelectedItems((prev) => prev.filter(item => item.product_id !== id));
        if (focusedItemId === id) {
            setFocusedItemId(null);
            setFocusedInputType(null);
            setEditableQty(null);
        }
    };

    const adjustQty = (id, delta) => {
        if (delta < 0) {
            const item = selectedItems.find(item => item.product_id === id);
            if (item && item.qty === 1) {
                removeItem(id);
                return;
            }
        } else if (delta > 0) {
            const product = availableProducts.find(p => p.product_id === id);
            if (product && parseInt(product.product_qty) <= 0) {
                setErrorMessage("No more stock available for this item.");
                setTimeout(() => setErrorMessage(null), 3000);
                return;
            }
        }

        setAvailableProducts(prev => {
            return prev.map(p => {
                if (p.product_id === id) {
                    return {
                        ...p,
                        product_qty: parseInt(p.product_qty) - delta
                    };
                }
                return p;
            });
        });

        setSelectedItems((prev) => {
            return prev.map((item) => {
                if (item.product_id === id) {
                    return { ...item, qty: item.qty + delta };
                }
                return item;
            });
        });
    };

    const handleQuantityFocus = (id) => {
        // If clicking on the same input that's already focused, keep the current edited value
        if (focusedInputType === 'quantity' && focusedItemId === id && editableQty !== null) {
            // Just maintain focus without changing the current value
            return;
        }
        
        // Mark that we're switching focus between quantity inputs to prevent clearing
        const switchingBetweenQuantities = focusedInputType === 'quantity' && focusedItemId !== id;
        
        setFocusedInputType('quantity');
        setFocusedItemId(id);

        // Only set the editableQty from the item if we're not already editing this item
        const item = selectedItems.find(item => item.product_id === id);
        if (item) {
            setEditableQty(item.qty.toString());
        }
        
        // If we're switching between quantities, ensure the previous edit is completed
        if (switchingBetweenQuantities) {
            // Apply any pending edits from the previous field
            completeQuantityEdit(true); // true means we're switching, don't clear the focus state
        }
    };

    const handleCashFocus = () => {
        setFocusedInputType('cash');
        setFocusedItemId(null);
        setEditableQty(null);
    };

    const completeQuantityEdit = (isSwitchingInputs = false) => {
        if (focusedItemId && editableQty !== null) {
            // If the quantity is empty or zero, remove the item and restore stock
            if (!editableQty || editableQty === '0') {
                const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
                if (originalProduct) {
                    // Reset to initial stock when removing the item
                    setAvailableProducts(prev => {
                        return prev.map(p => {
                            if (p.product_id === focusedItemId) {
                                return {
                                    ...p,
                                    product_qty: parseInt(originalProduct.product_qty)
                                };
                            }
                            return p;
                        });
                    });
                }
                removeItem(focusedItemId);
                return;
            }
            
            const parsedQty = parseInt(editableQty);
            
            if (isNaN(parsedQty) || parsedQty < 1) {
                removeItem(focusedItemId);
                return;
            }
            
            const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
            const selectedItem = selectedItems.find(item => item.product_id === focusedItemId);
            
            if (originalProduct && selectedItem) {
                const totalAvailableStock = parseInt(originalProduct.product_qty);
                
                if (parsedQty > totalAvailableStock) {
                    setErrorMessage(`Cannot add ${parsedQty} items. Only ${totalAvailableStock} available in stock.`);
                    
                    setEditableQty(selectedItem.qty.toString());
                    
                    setAvailableProducts(prev => {
                        return prev.map(p => {
                            if (p.product_id === focusedItemId) {
                                return {
                                    ...p,
                                    product_qty: totalAvailableStock - selectedItem.qty
                                };
                            }
                            return p;
                        });
                    });
                    
                    return;
                }
                
                setSelectedItems(prev => {
                    return prev.map(item => {
                        if (item.product_id === focusedItemId) {
                            return { ...item, qty: parsedQty };
                        }
                        return item;
                    });
                });
                
                setAvailableProducts(prev => {
                    return prev.map(p => {
                        if (p.product_id === focusedItemId) {
                            return {
                                ...p,
                                product_qty: totalAvailableStock - parsedQty
                            };
                        }
                        return p;
                    });
                });
            }
        }
        
        // Only clear focus state if we're not switching between quantity inputs
        if (!isSwitchingInputs) {
            setEditableQty(null);
            setFocusedInputType(null);
            setFocusedItemId(null);
        }
    };

    const handleKeypadInput = (value) => {
        if (focusedInputType === 'cash') {
            if (value === 'backspace') {
                setCash(prev => prev.slice(0, -1));
            } else if (value === 'clear') {
                setCash('');
            } else if (value === '.' && !cash.includes('.')) {
                setCash(prev => prev + '.');
            } else if (value !== '.') {
                setCash(prev => prev + value);
            }
        } else if (focusedInputType === 'quantity' && focusedItemId) {
            let newQtyString = editableQty || '';
            
            if (value === 'backspace') {
                newQtyString = newQtyString.slice(0, -1);
            } else if (value === 'clear') {
                newQtyString = '';
            } else if (value === '.') {
                return;
            } else {
                // Predict the new quantity if this digit is added
                const potentialNewQtyString = `${newQtyString}${value}`;
                const potentialQty = parseInt(potentialNewQtyString);
                
                // Find the original product and check against total stock
                const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
                
                if (originalProduct) {
                    const totalAvailableStock = parseInt(originalProduct.product_qty);
                    
                    // Check if the potential quantity exceeds available stock
                    if (potentialQty > totalAvailableStock) {
                        // Show error message but keep the existing valid quantity
                        setErrorMessage(`Cannot add ${potentialNewQtyString} items. Only ${totalAvailableStock} available in stock.`);
                        setTimeout(() => setErrorMessage(null), 3000);
                        return; // Don't update the quantity
                    }
                }
                
                // If within stock limits, proceed with the update
                newQtyString = potentialNewQtyString;
            }
            
            // Update the editable quantity
            setEditableQty(newQtyString);
            
            // Handle empty quantity case
            if (newQtyString === '') {
                const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
                if (originalProduct) {
                    // Reset to initial stock
                    setAvailableProducts(prev => {
                        return prev.map(p => {
                            if (p.product_id === focusedItemId) {
                                return {
                                    ...p,
                                    product_qty: parseInt(originalProduct.product_qty)
                                };
                            }
                            return p;
                        });
                    });
                }
            } else if (newQtyString !== '') {
                const parsedQty = parseInt(newQtyString);
                
                if (!isNaN(parsedQty)) {
                    const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
                    const selectedItem = selectedItems.find(item => item.product_id === focusedItemId);
                    
                    if (originalProduct && selectedItem) {
                        const totalAvailableStock = parseInt(originalProduct.product_qty);
                        const currentQty = selectedItem.qty;
                        
                        if (parsedQty <= totalAvailableStock) {
                            const qtyDifference = parsedQty - currentQty;
                            
                            setAvailableProducts(prev => {
                                return prev.map(p => {
                                    if (p.product_id === focusedItemId) {
                                        return {
                                            ...p,
                                            product_qty: Math.max(0, parseInt(originalProduct.product_qty) - parsedQty)
                                        };
                                    }
                                    return p;
                                });
                            });
                        } else {
                            setErrorMessage(`Cannot add ${parsedQty} items. Only ${totalAvailableStock} available in stock.`);
                            setTimeout(() => setErrorMessage(null), 3000);
                            
                            setEditableQty(totalAvailableStock.toString());
                        }
                    }
                }
            }
        }
    };

    const setActivePayment = (method) => {
        setPaymentMethod(method);
        if (method !== 'CASH') {
            setCash(''); // Still clear cash when switching to non-cash methods
        }
    };

    const toggleCategoryModal = () => {
        setShowCategoryModal(prev => !prev);
    };

    const filterByCategory = (categoryId) => {
        setActiveCategory(categoryId);
        
        let filtered = [...availableProducts];
        
        if (categoryId === "available") {
            // Filter to show only products with stock > 0
            filtered = filtered.filter(product => parseInt(product.product_qty) > 0);
        } else if (categoryId !== "all") {
            // Filter by specific category
            filtered = filtered.filter(product => product.category_id === categoryId);
        }
        
        // Apply current search term if any
        if (searchTerm.trim() !== "") {
            const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            filtered = filtered.filter(product => 
                tokens.every(token => product.product_name.toLowerCase().includes(token))
            );
        }
        
        // Apply category-based grouping and ID sorting
        const sortedProducts = sortProductsByCategory(filtered);
        setFilteredProducts(sortedProducts);
        setShowCategoryModal(false);
    };

    const printViaClipboard = (receiptData) => {
        try {
            // Convert receipt data to text format
            const items = receiptData.items.map(item => 
                `${item.quantity}x ${item.name.padEnd(20)} ₱${parseFloat(item.total).toFixed(2)}`
            ).join('\n');
            
            const receiptText = 
                `-------------- FISH2GO RECEIPT --------------\n` +
                `Date: ${receiptData.date}\n` +
                `Order #: ${receiptData.orderId}\n` +
                `------------------------------------------\n` +
                `${items}\n` +
                `------------------------------------------\n` +
                `Subtotal: ₱${parseFloat(receiptData.subtotal).toFixed(2)}\n` +
                `Tax: ₱${parseFloat(receiptData.tax).toFixed(2)}\n` +
                `Discount: ₱${parseFloat(receiptData.discount).toFixed(2)}\n` +
                `Total: ₱${parseFloat(receiptData.total).toFixed(2)}\n` +
                (receiptData.payment ? `Payment: ₱${parseFloat(receiptData.payment).toFixed(2)}\n` : '') +
                (receiptData.change ? `Change: ₱${parseFloat(receiptData.change).toFixed(2)}\n` : '') +
                `Payment Method: ${receiptData.paymentMethod}\n` +
                `------------------------------------------\n` +
                `Thank you for your purchase!`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(receiptText)
                .then(() => {
                    setPrintingStatus("Receipt copied to clipboard! You can paste into a document to print.");
                    
                    // Open in new window as well
                    const receiptWindow = window.open('', '_blank');
                    if (receiptWindow) {
                        receiptWindow.document.write(`
                            <html>
                                <head>
                                    <title>Fish2Go Receipt - Order #${receiptData.orderId}</title>
                                    <style>
                                        body { font-family: monospace; white-space: pre; }
                                        @media print {
                                            body { margin: 0; padding: 0; }
                                        }
                                        .content { width: 300px; margin: 20px auto; }
                                        .print-btn { 
                                            display: block; 
                                            margin: 20px auto; 
                                            padding: 10px 20px;
                                            background-color: #4CAF50;
                                            color: white;
                                            border: none;
                                            border-radius: 5px;
                                            cursor: pointer;
                                            font-size: 16px;
                                        }
                                        .print-btn:hover { background-color: #45a049; }
                                    </style>
                                </head>
                                <body>
                                    <div class="content">
                                        <button class="print-btn" onclick="window.print()">Print Receipt</button>
                                        ${receiptText.replace(/\n/g, '<br>')}
                                        <button class="print-btn" onclick="window.print()">Print Receipt</button>
                                    </div>
                                </body>
                            </html>
                        `);
                    }
                    
                    return true;
                })
                .catch(err => {
                    setErrorMessage(`Clipboard error: ${err.message}`);
                    return false;
                });
            
            return true;
        } catch (error) {
            console.error("Error generating receipt text:", error);
            setErrorMessage(`Error generating receipt: ${error.message}`);
            return false;
        }
    };

    const handleCheckoutConfirm = async () => {
        try {
            // Start loading state
            setErrorMessage("Processing order...");
            setPrintingStatus(""); // Reset printing status
            
            // Calculate total values
            const totalOrderPayment = paymentMethod === 'CASH' ? parseFloat(cash) : total;
            const totalOrderChange = paymentMethod === 'CASH' ? change : 0;
            
            // Prepare order data for submission
            const orderItems = selectedItems.map(item => ({
                product_id: item.product_id,
                order_quantity: item.qty,
                order_subtotal: subtotal,
                order_tax: tax,
                order_discount: discountAmount,
                order_total: total,
                order_payment: totalOrderPayment,
                order_change: totalOrderChange,
                order_status: 'confirmed',
                order_payment_method: paymentMethod.toLowerCase(),
            }));

            // Send order to server
            const response = await axios.post(route('staff.orders.store'), orderItems);
            
            // Order completed successfully
            setErrorMessage("Order completed successfully!");
            
            // Prepare receipt data
            const receiptData = {
                orderId: response.data.order_id || 'N/A',
                items: selectedItems.map(item => ({
                    name: item.product_name,
                    quantity: item.qty,
                    price: item.product_price,
                    total: (item.qty * item.product_price).toFixed(2)
                })),
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                discount: discountAmount.toFixed(2),
                total: total.toFixed(2),
                payment: totalOrderPayment.toFixed(2),
                change: totalOrderChange.toFixed(2),
                paymentMethod: paymentMethod,
                date: new Date().toLocaleString()
            };
            
            // Try to print based on context
            if (!window.isSecureContext && allowInsecurePrinting) {
                // In development mode with IP address - use alternative printing
                setPrintingStatus("Using development mode printing...");
                printViaClipboard(receiptData);
            } else {
                // In secure context - use Web Bluetooth
                setPrintingStatus("Printing receipt via Bluetooth...");
                try {
                    const printSuccess = await printReceipt(receiptData);
                    
                    if (printSuccess) {
                        setPrintingStatus("Receipt printed successfully!");
                    } else {
                        setPrintingStatus("Printer error - check paper and power");
                    }
                } catch (printError) {
                    console.error("Error printing receipt:", printError);
                    setPrintingStatus("Failed to print receipt");
                    
                    // If we failed due to secure context, offer alternative
                    if (!window.isSecureContext && !allowInsecurePrinting) {
                        setTimeout(() => {
                            setShowPrinterHelp(true);
                        }, 500);
                    }
                }
            }

            // Wait a moment before closing modal
            setTimeout(() => {
                setShowCheckoutModal(false);
                setSelectedItems([]);
                setCash("");
                setPrintingStatus("");
                router.reload(); // Refresh product data
            }, 1500);

        } catch (error) {
            console.error("Error processing order:", error);
            setErrorMessage("Error processing order. Please try again.");
            setPrintingStatus("");
            setTimeout(() => setErrorMessage(null), 3000);
        }
    };

    const connectPrinterManually = async () => {
        try {
            // Check if we're not in a secure context
            if (!window.isSecureContext) {
                setPrintingStatus("Running in non-secure context (not HTTPS/localhost)");
                setShowPrinterHelp(true);
                return;
            }
            
            // Rest of the existing function...
            // Check system Bluetooth capability
            if (!navigator.bluetooth) {
                setPrintingStatus("Error: Web Bluetooth not supported");
                setErrorMessage("This browser doesn't support Web Bluetooth fully. Common causes:\n" +
                               "1. Bluetooth is turned off on your system\n" + 
                               "2. You need to enable Bluetooth permission\n" +
                               "3. You're not running on HTTPS or localhost\n" +
                               "Try using Chrome or Edge with Bluetooth enabled");
                return;
            }
            
            // Additional check for Chrome's permissions API if available
            if (navigator.permissions) {
                try {
                    const permission = await navigator.permissions.query({ name: 'bluetooth' as PermissionName });
                    if (permission.state === 'denied') {
                        setPrintingStatus("Bluetooth permission denied");
                        setErrorMessage("You've blocked Bluetooth access. Please allow Bluetooth in your browser settings.");
                        return;
                    }
                } catch (e) {
                    console.log("Permissions API not fully supported:", e);
                }
            }
            
            setPrintingStatus("Connecting to printer...");
            setPrintingStatus("When prompted, select your thermal printer from the list");
            
            // First, test if we can even access bluetooth devices
            try {
                // Just test if we can get a device list
                const availability = await navigator.bluetooth.getAvailability();
                if (!availability) {
                    setPrintingStatus("Bluetooth is not available on this device/browser");
                    setErrorMessage("Your system reports that Bluetooth is not available. Check if Bluetooth is turned on.");
                    return;
                }
                
                await new PrinterService().setupPrinterConnection();
                setPrintingStatus("Printer connected successfully!");
                setTimeout(() => setPrintingStatus(""), 2000);
            } catch (e) {
                console.error("Connection attempt error:", e);
                setPrintingStatus(`Connection error: ${e.message || "Unknown"}`);
                setErrorMessage(e.message.includes("User cancelled") 
                    ? "You cancelled printer selection. Try again and select your thermal printer." 
                    : `Bluetooth error: ${e.message}`);
            }
        } catch (error) {
            console.error("Error connecting to printer:", error);
            setPrintingStatus("Failed to connect printer");
            setErrorMessage(`Connection error: ${error.message || "Unknown error"}`);
        }
    };

    const togglePrinterHelp = () => {
        setShowPrinterHelp(!showPrinterHelp);
    };
    
    const testPrint = async () => {
        try {
            setPrintingStatus("Testing printer...");
            
            // Create test receipt data
            const testReceiptData = {
                orderId: "TEST-1234",
                items: [
                    {
                        name: "Test Product 1",
                        quantity: 2,
                        price: 100,
                        total: 200
                    },
                    {
                        name: "Test Product 2",
                        quantity: 1,
                        price: 150,
                        total: 150
                    }
                ],
                subtotal: 350,
                tax: 42,
                discount: 0,
                total: 392,
                payment: 400,
                change: 8,
                paymentMethod: "CASH",
                date: new Date().toLocaleString()
            };
            
            // Try to print based on context
            if (!window.isSecureContext && allowInsecurePrinting) {
                // In development mode with IP address - use alternative printing
                setPrintingStatus("Using development mode printing...");
                printViaClipboard(testReceiptData);
            } else {
                // In secure context - use Web Bluetooth
                setPrintingStatus("Printing test receipt via Bluetooth...");
                try {
                    const printSuccess = await printReceipt(testReceiptData);
                    
                    if (printSuccess) {
                        setPrintingStatus("Test receipt printed successfully!");
                    } else {
                        setPrintingStatus("Printer error - check paper and power");
                    }
                } catch (printError) {
                    console.error("Error printing test receipt:", printError);
                    setPrintingStatus("Failed to print test receipt");
                    
                    // If we failed due to secure context, offer alternative
                    if (!window.isSecureContext && !allowInsecurePrinting) {
                        setTimeout(() => {
                            setShowPrinterHelp(true);
                        }, 500);
                    }
                }
            }
            
            // Clear status after a delay
            setTimeout(() => {
                setPrintingStatus("");
            }, 3000);

        } catch (error) {
            console.error("Error testing printer:", error);
            setPrintingStatus("Test print failed");
            setErrorMessage(`Printer test error: ${error.message || "Unknown error"}`);
        }
    };

    const total = selectedItems.reduce((sum, item) => sum + item.product_price * item.qty, 0);
    const tax = total * 0.12;
    const discountAmount = discount;
    const subtotal = total - tax - discountAmount;
    const change = total === 0 ? 0 : (cash ? parseFloat(cash) - total : 0);

    // Simplified category colors handling
    const categoryIdToColor = {};
    
    categories.forEach(category => {
        // Format the color properly with # prefix if needed
        let color = category.category_color || '';
        if (color && !color.startsWith('#')) {
            color = `#${color}`;
        }
        
        // Store directly by category_id
        categoryIdToColor[category.category_id] = color || "#CCCCCC";
    });
    
    // Simplified color getter function - only check by category ID
    const getProductColor = (product) => {
        // Get color directly from product's category_id
        if (product.category_id && categoryIdToColor[product.category_id]) {
            return categoryIdToColor[product.category_id];
        }
        // If product has its own color from the join, use that
        if (product.category_color) {
            let color = product.category_color;
            if (color && !color.startsWith('#')) {
                color = `#${color}`;
            }
            return color;
        }
        // Fall back to default
        return "#CCCCCC";
    };

    return (
        <PrinterProvider>
            <StaffLayout breadcrumbs={breadcrumbs}>
                <Head title="Point of Sales" />

                {showFullScreenPrompt && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-xl max-w-md text-center">
                            <h2 className="text-xl font-bold mb-4 text-white">Press anywhere or any key to enter full-screen mode</h2>
                            <p className="text-gray-300 mb-6">For the best experience, this application works in full-screen mode.</p>
                            <Button
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={toggleFullScreen}
                            >
                                Enter Full-Screen Mode
                            </Button>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-3 rounded-md shadow-lg flex items-center animate-in fade-in slide-in-from-top-5 duration-300">
                        <AlertCircle className="mr-2" size={20} />
                        <span>{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="ml-4 text-white hover:text-red-200"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Checkout Modal */}
                {showCheckoutModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
                        <div className="bg-gray-800 p-2 pt-3 rounded-xl w-xs w-full relative">
                            {/* Close button - moved outside the flex container */}
                            <button 
                                onClick={() => setShowCheckoutModal(false)}
                                className="absolute top-1 right-1 text-white-500"
                            >
                                <CircleX size={20} />
                            </button>
                            
                            <div className="flex justify-center items-center mb-2">
                                <h2 className="text-xl font-bold text-white">Confirm Order</h2>
                            </div>
                          
                            {/* Order Summary (reusing existing component) */}
                            <div className="space-y-0 p-3 py-1 text-sm leading-tight rounded-lg bg-gray-800 mb-2 px-7">
                                <div className="flex justify-between text-white">
                                    <span>Subtotal:</span>
                                    <span>₱ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-white">
                                    <span>Tax:</span>
                                    <span>₱ {tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-white">
                                    <span>Discount:</span>
                                    <span>₱ {discountAmount.toFixed(2)}</span>
                                </div>
                                
                                {/* First separator line */}
                                <div className="border-t border-white my-1"></div>
                                
                                <div className="flex justify-between font-bold text-lg text-white">
                                    <span>Total:</span>
                                    <span>₱ {total.toFixed(2)}</span>
                                </div>

                                {/* Second separator line */}
                                <div className="border-t border-white my-1"></div>

                                {/* Payment Method */}
                                <div className="flex justify-between items-center text-white mt-2">
                                    <span>Payment Method:</span>
                                    <span className="font-semibold">{paymentMethod}</span>
                                </div>
                                
                                {/* Only show cash/change for CASH payments */}
                                {paymentMethod === 'CASH' && (
                                    <>
                                        <div className="flex justify-between items-center text-white">
                                            <span>Cash:</span>
                                            <span>₱ {cash}</span>
                                        </div>
                                        <div className="border-t border-white my-1"></div>
                                        <div className="flex justify-between font-bold text-sm text-white" style={{ fontSize: "1.05rem" }}>
                                            <span>Change:</span>
                                            <span>₱ {change > 0 ? change.toFixed(2) : '0.00'}</span>
                                        </div>
                                        <div className="border-t border-white my-1"></div>
                                    </>
                                )}
                            </div>
                            
                            {/* Printing Status */}
                            {printingStatus && (
                                <div className="text-sm italic text-blue-600 mt-2 text-center">
                                    {printingStatus}
                                </div>
                            )}

                            {/* Confirm Button */}
                            <div className="flex justify-center">
                                <Button 
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2"
                                    onClick={handleCheckoutConfirm}
                                    disabled={isPrinting} // Disable button while printing
                                >
                                    {isPrinting ? "Printing..." : "CONFIRM"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Printer Help Modal */}
                {showPrinterHelp && (
                    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
                        <div className="bg-gray-800 p-4 rounded-xl w-full max-w-md">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-xl font-bold text-white">Printer Connection Help</h2>
                                <button 
                                    onClick={togglePrinterHelp}
                                    className="text-gray-300 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="text-white space-y-4">
                                <p className="text-yellow-300 font-semibold">
                                    Web Bluetooth requires a secure context (HTTPS or localhost)
                                </p>
                                
                                <p>
                                    You are currently running on: <br/>
                                    <code className="bg-gray-700 px-2 py-1 rounded">{window.location.origin}</code>
                                </p>
                                
                                <div className="space-y-2">
                                    <p className="font-bold">Solutions:</p>
                                    
                                    <div className="border border-gray-600 rounded p-2">
                                        <p className="font-semibold">Option 1: Use localhost</p>
                                        <p className="text-sm text-gray-300">
                                            Access the app via <code className="bg-gray-700 px-1 rounded">localhost:8000</code> on the same device
                                        </p>
                                    </div>
                                    
                                    <div className="border border-gray-600 rounded p-2">
                                        <p className="font-semibold">Option 2: Setup HTTPS in development</p>
                                        <p className="text-sm text-gray-300">
                                            Configure your Laravel app to use HTTPS with a self-signed certificate
                                        </p>
                                    </div>
                                    
                                    <div className="border border-gray-600 rounded p-2">
                                        <p className="font-semibold">Option 3: Enable development mode printing</p>
                                        <p className="text-sm text-gray-300">
                                            The app will show the receipt in a new window for printing
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <input 
                                                type="checkbox" 
                                                id="allowInsecurePrinting"
                                                checked={allowInsecurePrinting}
                                                onChange={(e) => setAllowInsecurePrinting(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <label htmlFor="allowInsecurePrinting">
                                                Enable development mode printing
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={togglePrinterHelp}
                                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex h-[calc(100vh-41px)] w-full flex-1 gap-2 bg-gray-900 text-white">
                    <div className="flex-1 space-y-4 p-2 bg-gray-800 flex flex-col">
                        <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg">
                            <SearchBar
                                placeholder="Search Product"
                                items={availableProducts}
                                searchField="product_name"
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-600 p-1 pl-3 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            <div className="relative">
                                <Button
                                    ref={categoryButtonRef}
                                    className="bg-gray-500 rounded-lg flex items-center justify-center h-[32px]"
                                    style={{ aspectRatio: '1/1', padding: '0' }}
                                    onClick={toggleCategoryModal}
                                >
                                    <LayoutList size={18} />
                                </Button>
                                
                                {showCategoryModal && (
                                    <div 
                                        ref={categoryModalRef}
                                        className="absolute right-0 p-0.5 w-30 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
                                    >
                                        <div className="py-0.5" role="menu" aria-orientation="vertical">
                                            <button
                                                onClick={() => filterByCategory("all")}
                                                className={`block w-full text-left px-4 py-2 text-sm ${
                                                    activeCategory === "all" 
                                                    ? "bg-gray-600 text-white" 
                                                    : "text-white hover:bg-gray-600"
                                                }`}
                                                role="menuitem"
                                            >
                                                All Products
                                            </button>
                                            <button
                                                onClick={() => filterByCategory("available")}
                                                className={`block w-full text-left px-4 py-2 text-sm ${
                                                    activeCategory === "available" 
                                                    ? "bg-gray-600 text-white" 
                                                    : "text-white hover:bg-gray-600"
                                                }`}
                                                role="menuitem"
                                            >
                                                Available
                                            </button>
                                            {categories.map((category) => (
                                                <button
                                                    key={category.category_id}
                                                    onClick={() => filterByCategory(category.category_id)}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${
                                                        activeCategory === category.category_id 
                                                        ? "bg-gray-600 text-white" 
                                                        : "text-white hover:bg-gray-600"
                                                    }`}
                                                    role="menuitem"
                                                >
                                                    {category.category_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Modified grid container with fixed height and scrolling */}
                        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                            <div className="grid grid-cols-6 gap-1">
                                {filteredProducts.map((product) => {
                                    const stockAvailable = parseInt(product.product_qty) > 0;
                                    
                                    return (
                                        <div
                                            key={product.product_id}
                                            className={`rounded-xl p-0.5 border text-center flex flex-col items-center 
                                                ${stockAvailable ? 'cursor-pointer opacity-100' : 'opacity-50 cursor-not-allowed'}
                                            `}
                                            style={{ backgroundColor: getProductColor(product) }}
                                            onClick={() => stockAvailable && addToOrder(product)}
                                        >
                                            <div className="h-8 flex items-center justify-center">
                                                <p className="font-bold text-black text-sm text-center line-clamp-2 leading-none">
                                                    {product.product_name}
                                                </p>
                                            </div>
                                            <img
                                                src={`${window.location.origin}/storage/${product.product_image}`}
                                                alt={product.product_name}
                                                className="w-24 h-18 object-cover rounded-md"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                
                                                }}
                                            />
                                            <p className="font-bold text-black leading-none pt-1" style={{ fontSize: "1.2rem" }}>
                                                ₱ {parseFloat(product.product_price).toFixed(2)}
                                            </p>
                                            <p className={`leading-none pb-1 ${stockAvailable ? 'text-black' : 'text-red-700 font-semibold'}`} 
                                               style={{ fontSize: "0.65rem" }}>
                                                Stock: {product.product_qty}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="w-1/3 p-2 pb-1 bg-gray-800 flex flex-col h-full">
                        <h2 className="text-m font-bold mb-0.5">Order Summary</h2>

                        <div className="flex-1 max-h-[260px] overflow-y-auto space-y-0.5 mb-1">
                            {selectedItems.map((product) => (
                                <div key={product.product_id} className="flex items-center bg-gray-700 p-1.5 rounded-lg">
                                    <img
                                        src={`${window.location.origin}/storage/${product.product_image}`}
                                        alt={product.product_name}
                                        className="object-cover rounded-md bg-white h-8 w-8"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                      
                                        }}
                                    />
                                    <div className="flex flex-col justify-center ml-2 flex-1">
                                        <p className="text-left text-sm font-semibold line-clamp-1">{product.product_name}</p>
                                        <p className="text-left text-xs leading-none">₱ {parseFloat(product.product_price).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => adjustQty(product.product_id, -1)}
                                        >
                                            <CircleMinus size={17} className="text-red-500" />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                data-product-id={product.product_id}
                                                className={`w-10 h-6.5 text-center text-sm leading-none bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400`}
                                                value={focusedInputType === 'quantity' && focusedItemId === product.product_id && editableQty !== null ? editableQty : product.qty}
                                                readOnly
                                                onClick={() => handleQuantityFocus(product.product_id)}
                                                onBlur={(e) => {
                                                    // Only complete the edit if we're not clicking on another quantity input
                                                    const relatedTarget = e.relatedTarget;
                                                    const clickingAnotherQtyInput = relatedTarget && relatedTarget.hasAttribute('data-product-id');
                                                    if (!clickingAnotherQtyInput) {
                                                        completeQuantityEdit();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const availableProduct = availableProducts.find(p => p.product_id === product.product_id);
                                                if (availableProduct && parseInt(availableProduct.product_qty) > 0) {
                                                    adjustQty(product.product_id, 1);
                                                } else {
                                                    setErrorMessage("No more stock available for this item.");
                                                    setTimeout(() => setErrorMessage(null), 3000);
                                                }
                                            }}
                                        >
                                            <CirclePlus size={17} className="text-green-500" />
                                        </div>
                                        <div
                                            className="cursor-pointer ml-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem(product.product_id);
                                            }}
                                        >
                                            <CircleX size={20} className="text-white-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-0 p-3 py-1 text-xs rounded-lg bg-gray-700 mb-1 px-3">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>₱ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>₱ {tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>₱ {discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>₱ {total.toFixed(2)}</span>
                            </div>

                            {/* Always show Cash and Change, but disable input for non-cash payment methods */}
                            <div className="flex justify-between items-center">
                                <span>Cash:</span>
                                <input
                                    type="text"
                                    ref={cashInputRef}
                                    className={`w-20 text-right text-white ${paymentMethod !== 'CASH' ? 'bg-transparent' : 'bg-gray-600'} p-1 rounded focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white`}
                                    placeholder="₱ 0.00"
                                    value={cash ? `₱ ${cash}` : ""}
                                    readOnly
                                    disabled={paymentMethod !== 'CASH'}
                                    onClick={() => paymentMethod === 'CASH' && handleCashFocus()}
                                    onBlur={() => paymentMethod === 'CASH' && setFocusedInputType(null)}
                                />
                            </div>
                            <div className="flex justify-between font-bold text-sm">
                                <span>Change:</span>
                                <span>₱ {paymentMethod === 'CASH' && change > 0 ? change.toFixed(2) : '0.00'}</span>
                            </div>
                        </div>

                        <div className="p-0 grid grid-cols-4 gap-1 mb-1">
                            {["CASH", "GCASH", "GRABF", "FOODP"].map((method) => (
                                <Button
                                    key={method}
                                    className={`${paymentMethod === method ? 'bg-green-600' : 'bg-gray-600'} p-0 text-xs font-bold`}
                                    onClick={() => setActivePayment(method)}
                                >
                                    {method}
                                </Button>
                            ))}
                        </div>

                        <div onMouseDown={(e) => e.preventDefault()} className="grid grid-cols-5 gap-1">
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('1')}
                            >
                                1
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('2')}
                            >
                                2
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('3')}
                            >
                                3
                            </Button>
                            <Button
                                className="bg-red-500 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('backspace')}
                            >
                                ⌫
                            </Button>
                            <Button className="bg-blue-500 text-sm p-0 h-8">Tax</Button>

                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('4')}
                            >
                                4
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('5')}
                            >
                                5
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('6')}
                            >
                                6
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('clear')}
                            >
                                CLR
                            </Button>
                            <Button className="bg-yellow-500 text-sm p-0 h-8">Disc</Button>

                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('7')}
                            >
                                7
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('8')}
                            >
                                8
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('9')}
                            >
                                9
                            </Button>
                            <Button className="bg-orange-500 text-sm p-0 h-8">Hold</Button>
                            <Button className="bg-red-500 text-sm p-0 h-8">Void</Button>

                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('00')}
                            >
                                00
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('0')}
                            >
                                0
                            </Button>
                            <Button
                                className="bg-gray-400 text-sm p-0 h-8"
                                disabled={!focusedInputType}
                                onClick={() => handleKeypadInput('.')}
                            >
                                .
                            </Button>
                            <Button className="bg-green-500 col-span-2 text-sm p-0 h-8">Open</Button>

                            <Button
                                className="col-span-5 bg-green-600 text-white font-bold text-sm p-2 mt-1"
                                onClick={() => setShowCheckoutModal(true)}
                                disabled={selectedItems.length === 0 || (paymentMethod === 'CASH' && (!cash || parseFloat(cash) < total))}
                            >
                                CHECKOUT
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-1 mt-1">
                            <Button 
                                className="bg-blue-600 text-white font-bold text-sm p-1.5"
                                onClick={window.isSecureContext ? connectPrinterManually : togglePrinterHelp}
                            >
                                {window.isSecureContext ? "Set Up Printer" : "Printer Help"}
                            </Button>
                            <Button
                                className="bg-gray-600 text-white font-bold text-sm p-1.5"
                                onClick={testPrint}
                            >
                                Test Receipt
                            </Button>
                        </div>
                        
                        {/* Show printing mode indicator */}
                        {!window.isSecureContext && allowInsecurePrinting && (
                            <div className="text-xs text-center mt-1 text-yellow-300">
                                Development printing mode enabled
                            </div>
                        )}
                    </div>
                </div>
            </StaffLayout>
        </PrinterProvider>
    );
}