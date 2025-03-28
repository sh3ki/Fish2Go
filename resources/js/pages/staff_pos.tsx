import { useState, useRef, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { X, CirclePlus, CircleMinus, CircleX, AlertCircle } from "lucide-react";

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
    const [errorMessage, setErrorMessage] = useState(null);

    const cashInputRef = useRef(null);

    // Full-screen functionality
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true);
                setShowFullScreenPrompt(false);
                // Store in localStorage that user has entered full-screen mode
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

        // Add event listener for any user interaction to trigger full-screen
        const handleUserInteraction = () => {
            if (!document.fullscreenElement) {
                toggleFullScreen();
            }
        };

        // Only add the event listeners if not already in full-screen
        if (!document.fullscreenElement) {
            window.addEventListener('click', handleUserInteraction, { once: true });
            window.addEventListener('keydown', handleUserInteraction, { once: true });
        }

        // Monitor full-screen changes
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
            if (!document.fullscreenElement) {
                // If user exits full-screen mode, show prompt again
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

    const addToOrder = (product) => {
        // First update the available products by reducing quantity
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

        // Then update selected items
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
        // Find the item before removing it to get its quantity
        const item = selectedItems.find(item => item.product_id === id);
        if (item) {
            // Add quantity back to available products
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
        // First check if we're subtracting from quantity 1
        if (delta < 0) {
            const item = selectedItems.find(item => item.product_id === id);
            if (item && item.qty === 1) {
                removeItem(id);
                return;
            }
        }

        // Update available product quantities
        setAvailableProducts(prev => {
            return prev.map(p => {
                if (p.product_id === id) {
                    // When delta is negative, we're adding back to available
                    // When delta is positive, we're removing from available
                    return {
                        ...p,
                        product_qty: parseInt(p.product_qty) - delta
                    };
                }
                return p;
            });
        });

        // Update selected items quantity
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
        setFocusedInputType('quantity');
        setFocusedItemId(id);

        // Set the editable quantity to match the current item's quantity
        const item = selectedItems.find(item => item.product_id === id);
        if (item) {
            setEditableQty(item.qty.toString());
        }
    };

    const handleCashFocus = () => {
        setFocusedInputType('cash');
        setFocusedItemId(null);
        setEditableQty(null);
    };

    const completeQuantityEdit = () => {
        if (focusedItemId && editableQty !== null) {
            const parsedQty = parseInt(editableQty);
            
            if (isNaN(parsedQty) || parsedQty < 1) {
                // If invalid or less than 1, remove the item
                removeItem(focusedItemId);
                return;
            }
            
            // Get the original product from initial products
            const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
            
            if (originalProduct) {
                const totalAvailableStock = parseInt(originalProduct.product_qty);
                
                // Final validation check
                if (parsedQty > totalAvailableStock) {
                    setErrorMessage(`Cannot add ${parsedQty} items. Only ${totalAvailableStock} available in stock.`);
                    
                    // Reset quantities to valid state
                    const item = selectedItems.find(item => item.product_id === focusedItemId);
                    if (item) {
                        setEditableQty(item.qty.toString());
                    }
                    
                    // Don't clear focused state yet to allow re-editing
                    return;
                }
                
                // Apply the final quantity to selected items
                setSelectedItems(prev => {
                    return prev.map(item => {
                        if (item.product_id === focusedItemId) {
                            return { ...item, qty: parsedQty };
                        }
                        return item;
                    });
                });
                
                // Calculate and update available stock for display
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
        
        // Reset editing state
        setEditableQty(null);
        setFocusedInputType(null);
        setFocusedItemId(null);
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
                // No decimal for quantity
                return;
            } else {
                newQtyString = `${newQtyString}${value}`;
            }
            
            // Update the editable quantity
            setEditableQty(newQtyString);
            
            // If the new string is not empty, update product quantities in real-time
            if (newQtyString !== '') {
                const parsedQty = parseInt(newQtyString);
                
                if (!isNaN(parsedQty)) {
                    // Get the original item and available product
                    const originalItem = selectedItems.find(item => item.product_id === focusedItemId);
                    const originalProduct = initialProducts.find(p => p.product_id === focusedItemId);
                    
                    if (originalItem && originalProduct) {
                        // Calculate total stock (current available + what's already in the cart)
                        const totalAvailableStock = parseInt(originalProduct.product_qty);
                        
                        // Check if quantity is valid (not more than total stock)
                        if (parsedQty <= totalAvailableStock) {
                            // Update the available products in real-time
                            setAvailableProducts(prev => {
                                return prev.map(p => {
                                    if (p.product_id === focusedItemId) {
                                        // Calculate new available quantity based on the total stock minus what's in cart
                                        const newAvailableQty = totalAvailableStock - parsedQty;
                                        return {
                                            ...p,
                                            product_qty: newAvailableQty
                                        };
                                    }
                                    return p;
                                });
                            });
                        } else {
                            // Show error for invalid quantity
                            setErrorMessage(`Cannot add ${parsedQty} items. Only ${totalAvailableStock} available in stock.`);
                            setTimeout(() => setErrorMessage(null), 3000);
                        }
                    }
                }
            }
        }
    };

    const setActivePayment = (method) => {
        setPaymentMethod(method);
        // Clear cash input when switching payment methods
        if (method !== 'CASH') {
            setCash('');
        }
    };

    const subtotal = selectedItems.reduce((sum, item) => sum + item.product_price * item.qty, 0);
    const tax = subtotal * 0.1;
    const discountAmount = discount; // Could be calculated based on percentage or fixed amount
    const total = subtotal + tax - discountAmount;
    const change = total === 0 ? 0 : (cash ? parseFloat(cash) - total : 0);

    const categoryColors = {
        "Grilled": "#ff9191",
        "Ready2Eat": "#fdff8e",
        "Ready2Cook": "#9afbff",
        "Bottled": "#a97dff",
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sales" />

            {/* Full-screen prompt overlay */}
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

            {/* Error Message Toast */}
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

            <div className="flex h-full flex-1 gap-4 p-4 bg-gray-900 text-white">
                {/* Product Section */}
                <div className="flex-1 space-y-4 p-4 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg">
                        <input type="text" placeholder="Search Product" className="input w-full bg-gray-600 text-white p-2 rounded-lg" />
                        <Button className="bg-blue-500 p-2 rounded-lg">Categories</Button>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                        {availableProducts.map((product) => (
                            <div
                                key={product.product_id}
                                className={`rounded-xl p-2 border text-center flex flex-col items-center ${parseInt(product.product_qty) > 0 ? 'cursor-pointer opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                                style={{ backgroundColor: categoryColors[product.category_name] || categoryColors["Default"] }}
                                onClick={() => parseInt(product.product_qty) > 0 && addToOrder(product)}
                            >
                                {/* Product Name - 2-line max & vertical centering */}
                                <div className="h-12 flex items-center justify-center">
                                    <p className="font-bold text-black text-sm text-center line-clamp-2 leading-tight">
                                        {product.product_name}
                                    </p>
                                </div>

                                {/* Product Image */}
                                <img 
                                    src={`${window.location.origin}/storage/${product.product_image}`} 
                                    alt={product.product_name} 
                                    className="w-full h-24 object-cover rounded-md"
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.src = '/placeholder.png';
                                    }}
                                />

                                {/* Price & Stock */}
                                <p className="text-xl font-semibold text-black">₱ {parseFloat(product.product_price).toFixed(2)}</p>
                                <p className="text-xs text-black">Stock: {product.product_qty}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="w-1/3 p-4 pt-2 bg-gray-800 rounded-xl flex flex-col">
                    <h2 className="text-m font-bold mb-2">Order Summary</h2>

                    {/* Scrollable Order List - Fixed height for 3 items */}
                    <div className="max-h-[216px] overflow-y-auto space-y-2 mb-4">
                        {selectedItems.map((product) => (
                            <div key={product.product_id} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                                {/* Product Image - Keeps Aspect Ratio */}
                                <img 
                                    src={`${window.location.origin}/storage/${product.product_image}`} 
                                    alt={product.product_name} 
                                    className="h-12 w-12 object-cover rounded-md bg-white"
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.src = '/placeholder.png';
                                    }}
                                />

                                {/* Product Info */}
                                <div className="flex justify-between items-center w-2/3 ml-2">
                                    <p className="flex-1 text-left">{product.product_name}</p>
                                    <p className="text-right">₱ {parseFloat(product.product_price).toFixed(2)}</p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="cursor-pointer" 
                                        onClick={() => adjustQty(product.product_id, -1)}
                                    >
                                        <CircleMinus size={18} className="text-red-500" />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`w-8 h-8 text-center bg-gray-600 rounded cursor-pointer ${focusedInputType === 'quantity' && focusedItemId === product.product_id ? 'border-2 border-blue-400' : ''}`}
                                            value={focusedInputType === 'quantity' && focusedItemId === product.product_id && editableQty !== null ? editableQty : product.qty}
                                            readOnly
                                            onClick={() => handleQuantityFocus(product.product_id)}
                                            onBlur={() => completeQuantityEdit()}
                                        />
                                        {/* Fixed edit indicator logic */}
                                        {!(focusedInputType === 'quantity' && focusedItemId === product.product_id) && (
                                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center">
                                                <span className="text-white text-[8px]">✎</span>
                                            </div>
                                        )}
                                    </div>
                                    <div 
                                        className="cursor-pointer" 
                                        onClick={() => {
                                            // Get the available product
                                            const availableProduct = availableProducts.find(p => p.product_id === product.product_id);
                                            if (availableProduct && parseInt(availableProduct.product_qty) > 0) {
                                                adjustQty(product.product_id, 1);
                                            } else {
                                                setErrorMessage("No more stock available for this item.");
                                                setTimeout(() => setErrorMessage(null), 3000);
                                            }
                                        }}
                                    >
                                        <CirclePlus size={18} className="text-green-500" />
                                    </div>
                                    <div 
                                        className="cursor-pointer ml-1" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(product.product_id);
                                        }}
                                    >
                                        <CircleX size={18} className="text-red-600" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-0 p-3 py-1 text-xs rounded-lg bg-gray-700 mb-2">
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
                        <div className="flex justify-between font-bold text-sm">
                            <span>Total:</span>
                            <span>₱ {total.toFixed(2)}</span>
                        </div>

                        {paymentMethod === 'CASH' && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span>Cash:</span>
                                    <input 
                                        type="text"
                                        ref={cashInputRef}
                                        placeholder="0.00" 
                                        className={`w-1/2 text-right text-white bg-transparent p-1 rounded ${focusedInputType === 'cash' ? 'border-2 border-blue-400' : ''}`}
                                        value={cash} 
                                        readOnly
                                        onClick={handleCashFocus}
                                        onBlur={() => setFocusedInputType(null)}
                                    />
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span>Change:</span>
                                    <span>₱ {change > 0 ? change.toFixed(2) : '0.00'}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Payment Method Buttons */}
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

                    {/* Keypad with Utility Buttons */}
                    <div onMouseDown={(e) => e.preventDefault()} className="grid grid-cols-5 gap-1">
                        {/* Row 1 */}
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('1')}
                        >
                            1
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('2')}
                        >
                            2
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
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

                        {/* Row 2 */}
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('4')}
                        >
                            4
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('5')}
                        >
                            5
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('6')}
                        >
                            6
                        </Button>
                        <Button 
                            className="bg-gray-500 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('clear')}
                        >
                            CLR
                        </Button>
                        <Button className="bg-yellow-500 text-sm p-0 h-8">Disc</Button>

                        {/* Row 3 */}
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('7')}
                        >
                            7
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('8')}
                        >
                            8
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('9')}
                        >
                            9
                        </Button>
                        <Button className="bg-orange-500 text-sm p-0 h-8">Hold</Button>
                        <Button className="bg-red-500 text-sm p-0 h-8">Void</Button>

                        {/* Row 4-5 with Open spanning 2 rows */}
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('00')}
                        >
                            00
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('0')}
                        >
                            0
                        </Button>
                        <Button 
                            className="bg-gray-600 text-sm p-0 h-8" 
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('.')}
                        >
                            .
                        </Button>
                        <Button className="bg-green-500 col-span-2 text-sm p-0 h-8">Open</Button>

                        {/* Checkout button spanning all 5 columns */}
                        <Button 
                            className="col-span-5 bg-green-600 text-sm p-2 mt-1" 
                            onClick={() => alert("Checkout Modal")}
                            disabled={selectedItems.length === 0 || (paymentMethod === 'CASH' && (!cash || parseFloat(cash) < total))}
                        >
                            CHECKOUT
                        </Button>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}