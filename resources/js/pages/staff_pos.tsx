import { useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";

const breadcrumbs: BreadcrumbItem[] = [{ title: "POS", href: "/staff/pos" }];

export default function POS() {
    const { products, categories } = usePage().props;

    console.log("Products:", products);
    console.log("Categories:", categories);
    const [selectedItems, setSelectedItems] = useState([]);
    const [cash, setCash] = useState("");

    const addToOrder = (product) => {
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

    const adjustQty = (id, delta) => {
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.product_id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
            )
        );
    };

    const subtotal = selectedItems.reduce((sum, item) => sum + item.product_price * item.qty, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const change = cash ? parseFloat(cash) - total : 0;

    const categoryColors: Record<string, string> = {
        "Grilled": "#ff9191",
        "Ready2Eat": "#fdff8e",
        "Ready2Cook": "#9afbff",
        "Bottled": "#a97dff",
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sales" />
            <div className="flex h-full flex-1 gap-4 p-4 bg-gray-900 text-white">
                {/* Product Section */}
                <div className="flex-1 space-y-4 p-4 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-lg">
                        <input type="text" placeholder="Search Product" className="input w-full bg-gray-600 text-white p-2 rounded-lg" />
                        <Button className="bg-blue-500 p-2 rounded-lg">Categories</Button>
                    </div>
                    <div className="grid grid-cols-9 gap-1">
                        {products.map((product) => (
                            <div
                                key={product.product_id}
                                className="rounded-xl p-2 border cursor-pointer text-center flex flex-col items-center"
                                style={{ backgroundColor: categoryColors[product.category_name] || categoryColors["Default"] }}
                                onClick={() => addToOrder(product)}
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
                                />

                                {/* Price & Stock */}
                                <p className="text-xl font-semibold text-black">₱ {parseFloat(product.product_price).toFixed(2)}</p>
                                <p className="text-xs text-black">Stock: {product.product_qty}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="w-1/3 p-4 bg-gray-800 rounded-xl">
                    <h2 className="text-xl font-bold">Order Summary</h2>
                    <div className="h-64 overflow-y-auto space-y-2">
                        {selectedItems.map((product) => (
                            <div key={product.product_id} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                                {/* Product Image - Keeps Aspect Ratio */}
                                <img 
                                    src={`${window.location.origin}/storage/${product.product_image}`} 
                                    alt={product.product_name} 
                                    className="h-12 w-12 object-cover rounded-md bg-white"
                                />
                                
                                {/* Product Info */}
                                <div className="flex justify-between items-center w-2/3  ml-2">
                                    <p className="flex-1 text-left">{product.product_name}</p>
                                    <p className="text-right">₱ {parseFloat(product.product_price).toFixed(2)}</p>
                                </div>
                                
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                    <Button className="bg-red-500 p-2" onClick={() => adjustQty(product.product_id, -1)}>-</Button>
                                    <span>{product.qty}</span>
                                    <Button className="bg-green-500 p-2" onClick={() => adjustQty(product.product_id, 1)}>+</Button>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Payment Details */}
                    <div className="space-y-2 p-2 rounded-lg">
                        <p>Subtotal: ₱ {subtotal.toFixed(2)}</p>
                        <p>Tax: ₱ {tax.toFixed(2)}</p>
                        <p className="text-lg font-bold">Total: ₱ {total.toFixed(2)}</p>
                        <input type="number" placeholder="Enter Cash" value={cash} onChange={(e) => setCash(e.target.value)} className="input w-full text-black p-2 rounded-lg" />
                        <p>Change: ₱ {change.toFixed(2)}</p>
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-4 gap-2 p-2">
                        {[...Array(10).keys()].map((num) => (
                            <Button key={num} className="bg-gray-600 p-2" onClick={() => setCash(cash + num)}>{num}</Button>
                        ))}
                        <Button className="bg-red-500">⌫</Button>
                        <Button className="bg-gray-500">CLR</Button>
                        <Button className="bg-blue-500">Tax</Button>
                        <Button className="bg-yellow-500">Discount</Button>
                        <Button className="bg-orange-500">Hold</Button>
                        <Button className="bg-green-500">Open</Button>
                    </div>

                    {/* Checkout Button */}
                    <Button className="w-full bg-green-500 text-lg p-3 mt-2" onClick={() => alert("Checkout Modal")}>CHECKOUT</Button>
                </div>
            </div>
        </StaffLayout>
    );
}
