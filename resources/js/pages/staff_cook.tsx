import { useState, useRef, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, LayoutList, CheckCircle, CirclePlus, CircleMinus, CircleX } from "lucide-react";
import SearchBar from "@/components/ui/search-bar";
import axios from "axios";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt"; // Import the component

const breadcrumbs: BreadcrumbItem[] = [{ title: "Cook Station", href: "/staff/cook" }];

export default function CookStation() {
    const { products: initialProducts } = usePage().props;

    const [availableProducts, setAvailableProducts] = useState(() => {
        return initialProducts.filter(product => 
            product.category_name === "Grilled"
        );
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [cookedProducts, setCookedProducts] = useState([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [grilledCategoryColor, setGrilledCategoryColor] = useState("#CCCCCC");
    const [focusedInputType, setFocusedInputType] = useState(null);
    const [focusedItemId, setFocusedItemId] = useState(null);
    const [editableQty, setEditableQty] = useState(null);
    
    const categoryButtonRef = useRef(null);
    const categoryModalRef = useRef(null);

    const sortProductsByCategory = (products) => {
        const groupedProducts = products.reduce((groups, product) => {
            const categoryName = product.category_name;
            if (!groups[categoryName]) {
                groups[categoryName] = [];
            }
            groups[categoryName].push(product);
            return groups;
        }, {});
        
        Object.keys(groupedProducts).forEach(category => {
            groupedProducts[category].sort((a, b) => 
                parseInt(a.product_id) - parseInt(b.product_id)
            );
        });
        
        return Object.keys(groupedProducts).flatMap(category => groupedProducts[category]);
    };

    useEffect(() => {
        const grilledProducts = initialProducts.filter(product => 
            product.category_name === "Grilled"
        );
        
        // Get the color of the Grilled category from any grilled product
        if (grilledProducts.length > 0) {
            const grilledProduct = grilledProducts[0];
            let color = grilledProduct.category_color || "#CCCCCC";
            if (color && !color.startsWith('#')) {
                color = `#${color}`;
            }
            setGrilledCategoryColor(color);
        }
        
        const sortedProducts = sortProductsByCategory(grilledProducts);
        setFilteredProducts(sortedProducts);
        setAvailableProducts(grilledProducts);
    }, [initialProducts]);

    useEffect(() => {
        // Fetch cooked products for today from the database
        axios.get('/staff/cook/get-cooked')
            .then(response => {
                if (response.data.success && response.data.cookedItems) {
                    // Convert database items to the format our UI expects
                    const cookedItemsFromDB = response.data.cookedItems.map(item => ({
                        product_id: item.product_id,
                        product_name: item.product ? item.product.product_name : `Product ${item.product_id}`,
                        product_image: item.product ? `products/${item.product.product_image}` : null,
                        category_name: item.product?.category?.category_name || "Unknown",
                        cooked: true,
                        cookedAt: new Date(item.created_at || Date.now()),
                        availableQty: item.cook_available
                    }));
                    setCookedProducts(cookedItemsFromDB);
                }
            })
            .catch(error => {
                console.error("Error fetching cooked products:", error);
            });
    }, []); // Empty dependency array means this runs once on mount

    const handleSearchResults = (results) => {
        let filtered = results.filter(product => product.category_name === "Grilled");
        
        if (activeCategory === "available") {
            filtered = filtered.filter(product => parseInt(product.product_qty) > 0);
        }
        
        setFilteredProducts(sortProductsByCategory(filtered));
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    useEffect(() => {
        if (searchTerm.trim() === "") {
            filterByCategory(activeCategory);
        } else {
            const searchTokens = searchTerm.toLowerCase().split(/\s+/).filter(token => token.length > 0);
            
            let filtered = availableProducts.filter(product => {
                const productName = product.product_name.toLowerCase();
                return searchTokens.every(token => 
                    productName.includes(token)
                );
            });
            
            if (activeCategory === "available") {
                filtered = filtered.filter(product => parseInt(product.product_qty) > 0);
            }
            
            setFilteredProducts(sortProductsByCategory(filtered));
        }
    }, [searchTerm, availableProducts, activeCategory]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true);
                localStorage.setItem('staffFullScreenMode', 'true');
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
    };

    useEffect(() => {
        const wasInFullScreen = localStorage.getItem('staffFullScreenMode') === 'true';
        if (wasInFullScreen) {
            setIsFullScreen(true);
        }

        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

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

    const addToOrder = (product) => {
        const availableStock = parseInt(product.product_qty);
        
        if (availableStock <= 0) {
            setErrorMessage("No stock available for this item.");
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        // Update available products stock in real-time
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
        // Restore stock to available products when removing an item
        const itemToRemove = selectedItems.find(item => item.product_id === id);
        if (itemToRemove) {
            setAvailableProducts(prev => {
                return prev.map(p => {
                    if (p.product_id === id) {
                        return {
                            ...p,
                            product_qty: parseInt(p.product_qty) + itemToRemove.qty
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

    const toggleCategoryModal = () => {
        setShowCategoryModal(prev => !prev);
    };

    const filterByCategory = (categoryId) => {
        setActiveCategory(categoryId);
        
        let filtered = [...availableProducts];
        
        if (categoryId === "available") {
            filtered = filtered.filter(product => parseInt(product.product_qty) > 0);
        }
        
        if (searchTerm.trim() !== "") {
            const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            filtered = filtered.filter(product => 
                tokens.every(token => product.product_name.toLowerCase().includes(token))
            );
        }
        
        const sortedProducts = sortProductsByCategory(filtered);
        setFilteredProducts(sortedProducts);
        setShowCategoryModal(false);
    };
    
    const markAsCooked = (id) => {
        setSelectedItems((prev) => {
            const itemToMark = prev.find(item => item.product_id === id);
            if (!itemToMark) return prev;
            
            // Check if the product already exists in cooked products
            setCookedProducts(cooked => {
                const existingProduct = cooked.find(item => item.product_id === id);
                
                if (existingProduct) {
                    // Update existing product quantity
                    return cooked.map(item => {
                        if (item.product_id === id) {
                            return {
                                ...item,
                                availableQty: item.availableQty + itemToMark.qty
                            };
                        }
                        return item;
                    });
                } else {
                    // Add as new cooked product
                    return [...cooked, {
                        ...itemToMark,  
                        cooked: true, 
                        cookedAt: new Date(),
                        availableQty: itemToMark.qty
                    }];
                }
            });
            
            // Remove from selected items without restoring stock
            return prev.filter(item => item.product_id !== id);
        });
    };
    
    const markAllAsCooked = () => {
        if (selectedItems.length === 0) return;
        
        // Prepare data to send to the backend
        const itemsToSave = selectedItems.map(item => ({
            product_id: item.product_id,
            qty: item.qty
        }));
        
        // Send data to the backend
        axios.post('/staff/cook/save', { 
            items: itemsToSave 
        })
        .then(response => {
            // Update cooked products, merging quantities for existing products
            setCookedProducts(prev => {
                let updatedCookedProducts = [...prev];
                
                selectedItems.forEach(item => {
                    const existingIndex = updatedCookedProducts.findIndex(p => p.product_id === item.product_id);
                    
                    if (existingIndex >= 0) {
                        // Update existing product
                        updatedCookedProducts[existingIndex] = {
                            ...updatedCookedProducts[existingIndex],
                            availableQty: updatedCookedProducts[existingIndex].availableQty + item.qty
                        };
                    } else {
                        // Add as new product
                        updatedCookedProducts.push({
                            ...item,
                            cooked: true,
                            cookedAt: new Date(),
                            availableQty: item.qty
                        });
                    }
                });
                
                return updatedCookedProducts;
            });
            
            // Clear selected items without restoring stock
            setSelectedItems([]);
            
            setErrorMessage("All items marked as cooked!");
            setTimeout(() => setErrorMessage(null), 2000);
        })
        .catch(error => {
            console.error("Error saving cooked items:", error);
            const errorMsg = error.response && error.response.data && error.response.data.message 
                ? error.response.data.message 
                : "Failed to save items to database. Please try again.";
            
            setErrorMessage(errorMsg);
            setTimeout(() => setErrorMessage(null), 5000);
        });
    };
    
    const clearCooked = (id) => {
        setCookedProducts(prev => prev.filter(item => item.product_id !== id));
    };

    const handleQuantityFocus = (id) => {
        const switchingBetweenQuantities = focusedInputType === 'quantity' && focusedItemId !== id;
        setFocusedInputType('quantity');
        setFocusedItemId(id);

        const item = selectedItems.find(item => item.product_id === id);
        if (item) {
            setEditableQty(item.qty.toString());
        }
        
        if (switchingBetweenQuantities) {
            completeQuantityEdit(true);
        }
    };
    
    const completeQuantityEdit = (isSwitchingInputs = false) => {
        if (focusedItemId && editableQty !== null) {
            if (!editableQty || editableQty === '0') {
                removeItem(focusedItemId);
                return;
            }
            
            const parsedQty = parseInt(editableQty);
            
            if (isNaN(parsedQty) || parsedQty < 1) {
                removeItem(focusedItemId);
                return;
            }

            // Get current item and available product
            const currentItem = selectedItems.find(item => item.product_id === focusedItemId);
            const availableProduct = availableProducts.find(p => p.product_id === focusedItemId);
            
            if (currentItem && availableProduct) {
                // Calculate if we have enough stock for the quantity change
                const originalStock = parseInt(initialProducts.find(p => p.product_id === focusedItemId)?.product_qty || '0');
                const currentlyInUse = currentItem.qty;
                const currentAvailable = parseInt(availableProduct.product_qty);
                const newRequestedQty = parsedQty;
                
                // If trying to increase beyond available, prevent and show error
                if (newRequestedQty > currentlyInUse + currentAvailable) {
                    setErrorMessage(`Cannot set quantity to ${newRequestedQty}. Only ${currentlyInUse + currentAvailable} available in stock.`);
                    setEditableQty(currentlyInUse.toString());
                    setTimeout(() => setErrorMessage(null), 3000);
                    return;
                }

                // Update the stock based on quantity change
                const qtyDifference = newRequestedQty - currentlyInUse;
                
                setAvailableProducts(prev => {
                    return prev.map(p => {
                        if (p.product_id === focusedItemId) {
                            return {
                                ...p,
                                product_qty: Math.max(0, parseInt(p.product_qty) - qtyDifference)
                            };
                        }
                        return p;
                    });
                });

                // Update the item quantity
                setSelectedItems(prev => {
                    return prev.map(item => {
                        if (item.product_id === focusedItemId) {
                            return { ...item, qty: newRequestedQty };
                        }
                        return item;
                    });
                });
            }
        }
        
        if (!isSwitchingInputs) {
            setEditableQty(null);
            setFocusedInputType(null);
            setFocusedItemId(null);
        }
    };
    
    const adjustQty = (id, delta) => {
        // Handle reduction to zero - remove the item
        if (delta < 0) {
            const item = selectedItems.find(item => item.product_id === id);
            if (item && item.qty === 1) {
                removeItem(id);
                return;
            }
        }
        
        // For increases, check stock availability
        if (delta > 0) {
            const product = availableProducts.find(p => p.product_id === id);
            if (!product || parseInt(product.product_qty) <= 0) {
                setErrorMessage("No more stock available for this item.");
                setTimeout(() => setErrorMessage(null), 3000);
                return;
            }
        }

        // Update stock in real-time
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

        // Update quantity in selected items
        setSelectedItems((prev) => {
            return prev.map((item) => {
                if (item.product_id === id) {
                    return { ...item, qty: Math.max(1, item.qty + delta) };
                }
                return item;
            });
        });
    };
    
    const handleKeypadInput = (value) => {
        if (focusedInputType === 'quantity' && focusedItemId) {
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
                
                // Check if potential quantity exceeds available stock
                const currentItem = selectedItems.find(item => item.product_id === focusedItemId);
                const availableProduct = availableProducts.find(p => p.product_id === focusedItemId);
                
                if (currentItem && availableProduct) {
                    const currentlyInUse = currentItem.qty;
                    const currentAvailable = parseInt(availableProduct.product_qty);
                    
                    if (potentialQty > currentlyInUse + currentAvailable) {
                        setErrorMessage(`Cannot set quantity to ${potentialQty}. Only ${currentlyInUse + currentAvailable} available in stock.`);
                        setTimeout(() => setErrorMessage(null), 3000);
                        return;
                    }
                }
                
                // If within stock limits, add the digit
                newQtyString = potentialNewQtyString;
            }
            
            // Update the visible quantity
            setEditableQty(newQtyString);
            
            if (newQtyString === '') {
                return;
            }
            
            // For non-empty strings, update in real-time
            const parsedQty = parseInt(newQtyString);
            
            if (!isNaN(parsedQty)) {
                if (parsedQty === 0) {
                    // Will be handled on blur to remove item
                    return;
                }
                
                const currentItem = selectedItems.find(item => item.product_id === focusedItemId);
                
                if (currentItem) {
                    const qtyDifference = parsedQty - currentItem.qty;
                    
                    // Update stock in real-time
                    setAvailableProducts(prev => {
                        return prev.map(p => {
                            if (p.product_id === focusedItemId) {
                                return {
                                    ...p,
                                    product_qty: Math.max(0, parseInt(p.product_qty) - qtyDifference)
                                };
                            }
                            return p;
                        });
                    });
                    
                    // Update the item quantity
                    setSelectedItems(prev => {
                        return prev.map(item => {
                            if (item.product_id === focusedItemId) {
                                return { ...item, qty: parsedQty };
                            }
                            return item;
                        });
                    });
                }
            }
        }
    };
    
    const adjustCookedAvailability = (id, delta) => {
        setCookedProducts(prev => {
            return prev.map(item => {
                if (item.product_id === id) {
                    const newQty = Math.max(0, item.availableQty + delta);
                    if (newQty === 0) {
                        // If no more available, remove the item
                        return null;
                    }
                    return { ...item, availableQty: newQty };
                }
                return item;
            }).filter(Boolean); // Filter out null items
        });
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Cook Station" />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />

            {errorMessage && (
                <div className={`fixed top-4 right-4 z-50 p-3 rounded-md shadow-lg flex items-center animate-in fade-in slide-in-from-top-5 duration-300 ${errorMessage.includes("marked as") ? "bg-green-500" : "bg-red-500"} text-white`}>
                    {errorMessage.includes("marked as") ? (
                        <CheckCircle className="mr-2" size={20} />
                    ) : (
                        <AlertCircle className="mr-2" size={20} />
                    )}
                    <span>{errorMessage}</span>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="ml-4 text-white hover:text-gray-200"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="flex h-[calc(100vh-41px)] w-full flex-1 gap-2 bg-gray-900 text-white">
                
                {/* Container for products sections with gap */}
                <div className="flex flex-col gap-2 flex-1 h-full max-w-[calc(66.666%-0.5rem)]">
                    {/* Raw Products Section with fixed height */}
                    <div className="min-h-[60vh] p-2 bg-gray-800 flex flex-col">
                        <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg">
                            <SearchBar
                                placeholder="Search Grilled Products"
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
                                                All Grilled
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
                                                Available (Grilled)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <h2 className="text-m font-bold pl-2 mb-1">Raw Products</h2>
                        {/* Fixed height scroll container with fixed card heights */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-6 auto-rows-fr gap-1 content-start">
                                {filteredProducts.map((product) => {
                                    const stockAvailable = parseInt(product.product_qty) > 0;
                                    
                                    return (
                                        <div
                                            key={product.product_id}
                                            className={`rounded-xl p-0.5 border text-center flex flex-col items-center h-40
                                                ${stockAvailable ? 'cursor-pointer opacity-100' : 'opacity-50 cursor-not-allowed'}
                                            `}
                                            style={{ backgroundColor: grilledCategoryColor }}
                                            onClick={() => stockAvailable && addToOrder(product)}
                                        >
                                            <div className="h-8 flex items-center justify-center">
                                                <p className="font-bold text-black text-sm text-center line-clamp-2 leading-none">
                                                    {product.product_name}
                                                </p>
                                            </div>
                                            <div className="flex-grow flex items-center justify-center">
                                                <img
                                                    src={`${window.location.origin}/storage/${product.product_image}`}
                                                    alt={product.product_name}
                                                    className="w-24 h-18 object-cover rounded-md"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                    }}
                                                />
                                            </div>
                                            <p className={`leading-none font-bold py-2 ${stockAvailable ? 'text-black' : 'text-red-700 font-semibold'}`} 
                                               style={{ fontSize: "1rem" }}>
                                                Stock: {product.product_qty}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                            
                    {/* Cooked Products Section with fixed height */}
                    <div className="h-[calc(100vh-40vh-4.5rem)] p-2 bg-gray-800 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-m font-bold pl-2 pb-1">Cooked Products</h2>
                        </div>
                        {cookedProducts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>No cooked products available</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex space-x-1 pb-2">
                                    {cookedProducts.map((product) => (
                                        <div
                                            key={`cooked-${product.product_id}`}
                                            className="rounded-xl p-0.5 border text-center flex-shrink-0 flex flex-col items-center h-40"
                                            style={{ backgroundColor: grilledCategoryColor, width: 'calc(100% / 6 - 0.22rem)' }}
                                        >
                                            <div className="h-8 flex items-center justify-center">
                                                <p className="font-bold text-black text-sm text-center line-clamp-2 leading-none">
                                                    {product.product_name}
                                                </p>
                                            </div>
                                            <div className="flex-grow flex items-center justify-center">
                                                <img
                                                    src={`${window.location.origin}/storage/${product.product_image}`}
                                                    alt={product.product_name}
                                                    className="w-24 h-18 object-cover rounded-md"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                    }}
                                                />
                                            </div>
                                            <p className="leading-none text-center font-bold py-2 text-black" style={{ fontSize: "1rem" }}>
                                                Available: {product.availableQty}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-1/3 p-2 pb-1 bg-gray-800 flex flex-col h-full">
                    <h2 className="text-m font-bold mb-0.5">Cooking Queue</h2>

                    <div className="flex-1 overflow-y-auto space-y-0.5 mb-1">
                        {selectedItems.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-gray-500">
                                <p>No items in queue</p>
                            </div>
                        ) : (
                            selectedItems.map((product) => (
                                <div 
                                    key={product.product_id} 
                                    className="flex items-center justify-between p-1.5 rounded-lg bg-gray-700"
                                >
                                    <div className="flex items-center">
                                        <img
                                            src={`${window.location.origin}/storage/${product.product_image}`}
                                            alt={product.product_name}
                                            className="object-cover rounded-md bg-white h-8 w-8"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                            }}
                                        />
                                        <div className="flex flex-col justify-center ml-2">
                                            <p className="text-left text-sm font-semibold line-clamp-1">{product.product_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="cursor-pointer" onClick={() => adjustQty(product.product_id, -1)}>
                                            <CircleMinus size={17} className="text-red-500" />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                data-product-id={product.product_id}
                                                className="w-10 h-6.5 text-center text-sm leading-none bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                                                value={focusedInputType === 'quantity' && focusedItemId === product.product_id && editableQty !== null ? editableQty : product.qty}
                                                readOnly
                                                onClick={() => handleQuantityFocus(product.product_id)}
                                                onBlur={(e) => {
                                                    const relatedTarget = e.relatedTarget;
                                                    const clickingAnotherQtyInput = relatedTarget && relatedTarget.hasAttribute('data-product-id');
                                                    if (!clickingAnotherQtyInput) {
                                                        completeQuantityEdit();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="cursor-pointer" onClick={() => adjustQty(product.product_id, 1)}>
                                            <CirclePlus size={17} className="text-green-500" />
                                        </div>
                                        <div className="cursor-pointer ml-1" onClick={() => removeItem(product.product_id)}>
                                            <CircleX size={20} className="text-white-500" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Keypad similar to POS */}
                    <div onMouseDown={(e) => e.preventDefault()} className="grid grid-cols-4 gap-1 p-4 pb-1">
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
                        <Button
                            className="bg-gray-400 text-sm p-0 h-8"
                            disabled={!focusedInputType}
                            onClick={() => handleKeypadInput('0')}
                        >
                            0
                        </Button>
                        <Button
                            className="bg-green-600 text-sm p-0 h-8 font-bold col-span-4"
                            disabled={selectedItems.length === 0 || focusedInputType !== null}
                            onClick={markAllAsCooked}
                        >
                            COOK ALL
                        </Button>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
