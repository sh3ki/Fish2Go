import { useState } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BreadcrumbItem } from "@/types";

type Product = {
    id: number;
    product_name: string;
    product_price: number;
    product_quantity: number;
    product_category: string;
    product_image: string;
};

type OrderFormData = {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    payment: number;
    change: number;
};

interface PosProps {
    products: Product[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Point of Sale", href: "/staff/pos" },
];

export default function StaffPOS({ products }: PosProps) {
    console.log("Products:", products);

    if (!products || products.length === 0) {
        return <p className="text-center text-gray-500">No products available</p>;
    }   
    const [cart, setCart] = useState<Product[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const [payment, setPayment] = useState<number | null>(null);
    const [change, setChange] = useState<number | null>(null);
    const { data, setData, post } = useForm<OrderFormData>({
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        payment: 0,
        change: 0,
    });
    

    // Add Product to Cart
    const addToCart = (product: Product) => {
        setCart([...cart, product]);
        updateTotals([...cart, product]);
    };

    // Calculate Totals
    const updateTotals = (cartItems: Product[]) => {
        const subtotalAmount = cartItems.reduce((acc, item) => acc + item.product_price, 0);
        const taxAmount = subtotalAmount * 0.1; // 10% tax
        const discountAmount = 0; // Change if needed
        const totalAmount = subtotalAmount + taxAmount - discountAmount;

        setSubtotal(subtotalAmount);
        setTax(taxAmount);
        setDiscount(discountAmount);
        setTotal(totalAmount);
    };

    // Checkout Function
    const handleCheckout = () => {
        const enteredPayment = parseFloat(prompt("Enter Payment Amount:") || "0");
        if (isNaN(enteredPayment) || enteredPayment < total) {
            alert("Invalid payment amount!");
            return;
        }
        
        setPayment(enteredPayment);
        setChange(enteredPayment - total);
    
        setData({
            subtotal,
            tax,
            discount,
            total,
            payment: enteredPayment,
            change: enteredPayment - total,
        });
    
        post("/staff/checkout");
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sale" />

            <div className="grid grid-cols-2 gap-4 p-4">
                {/* Left Side: Products */}
                <Card className="bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            {products.map((product) => (
                                <div key={product.id} className="border rounded p-2 text-center bg-gray-100 dark:bg-gray-900">
                                    <img src={`/storage/₱{product.product_image}`} alt={product.product_name} className="w-24 h-24 mx-auto rounded" />
                                    <h3 className="text-sm font-semibold">{product.product_name}</h3>
                                    <p className="text-sm">₱{Number(product.product_price).toFixed(2)}</p>
                                    <Button className="bg-blue-500 text-white px-2 py-1 rounded mt-2 w-full" onClick={() => addToCart(product)}>
                                        Add to Order
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Side: Order Summary */}
                <Card className="bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            {cart.map((item, index) => (
                                <li key={index} className="flex justify-between border-b py-2">
                                    <span>{item.product_name}</span>
                                    <span>₱{Number(item.product_price).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4">Subtotal: ₱{subtotal.toFixed(2)}</p>
                        <p>Tax: ₱{tax.toFixed(2)}</p>
                        <p>Discount: ₱{discount.toFixed(2)}</p>
                        <p className="font-semibold">Total: ₱{total.toFixed(2)}</p>

                        {payment !== null && (
                            <>
                                <p className="text-green-500">Payment: ₱{payment.toFixed(2)}</p>
                                <p className="text-blue-500">Change: ₱{change?.toFixed(2)}</p>
                            </>
                        )}

                        <Button className="bg-green-500 text-white px-4 py-2 mt-4 w-full" onClick={handleCheckout}>
                            Checkout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </StaffLayout>
    );
}
