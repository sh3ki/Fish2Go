import { useState } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BreadcrumbItem } from "@/types";
import { MinusCircle } from "lucide-react";
import Modal from "@/components/ui/modal";
import axios from "axios";

type Product = {
    id: number;
    product_name: string;
    product_price: number;
    product_quantity: number;
    product_category: string;
    product_image: string;
};

type OrderFormData = {
    items: { product_id: number; quantity: number }[];
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
    const { flash, errors } = usePage().props;
    const [cart, setCart] = useState<Product[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const [payment, setPayment] = useState<number | null>(null);
    const [change, setChange] = useState<number | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [enteredPayment, setEnteredPayment] = useState("");
    const { data, setData, post } = useForm<OrderFormData>({
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        payment: 0,
        change: 0,
    });

    // Add Product to Cart
    const addToCart = (product: Product) => {
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            if (existingProduct.product_quantity + 1 > product.product_quantity) {
                alert("Not enough stock available.");
                return;
            }
            const updatedCart = cart.map(item =>
                item.id === product.id ? { ...item, product_quantity: item.product_quantity + 1 } : item
            );
            setCart(updatedCart);
            updateTotals(updatedCart);
        } else {
            if (product.product_quantity < 1) {
                alert("Not enough stock available.");
                return;
            }
            const updatedCart = [...cart, { ...product, product_quantity: 1 }];
            setCart(updatedCart);
            updateTotals(updatedCart);
        }
    };

    // Remove Product from Cart
    const removeFromCart = (productId: number) => {
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart);
        updateTotals(updatedCart);
    };

    // Calculate Totals
    const updateTotals = (cartItems: Product[]) => {
        const subtotalAmount = cartItems.reduce((acc, item) => acc + item.product_price * item.product_quantity, 0);
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
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = () => {
        const paymentAmount = parseFloat(enteredPayment);
        if (isNaN(paymentAmount) || paymentAmount < total) {
            return;
        }

        setPayment(paymentAmount);
        setChange(paymentAmount - total);

        // Prepare the order data
        setData({
            items: cart.map(item => ({ product_id: item.id, quantity: item.product_quantity })),
            subtotal,
            tax,
            discount,
            total,
            payment: paymentAmount,
            change: paymentAmount - total,
        });

        post(route('staff.orders.store'), {
            onSuccess: (page) => {
                if ((page.props.flash as { success?: boolean }).success) {
                    setShowReceipt(true);
                    setShowPaymentModal(false);
                } else {
                    alert("An error occurred during checkout.");
                }
            },
            onError: (errors) => {
                alert(errors.error || "An error occurred during checkout.");
            },
        });
    };

    const handleNextOrder = () => {
        setCart([]);
        setSubtotal(0);
        setTax(0);
        setDiscount(0);
        setTotal(0);
        setPayment(null);
        setChange(null);
        setEnteredPayment("");
        setShowReceipt(false);
        setShowPaymentModal(false); // Hide the payment modal
    };

    // Print Receipt
    const handlePrintReceipt = () => {
        window.print();
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sale" />

            <div className="grid grid-cols-4 gap-4">
                {/* Left Side: Products */}
                <div className="col-span-3">
                    <Card className="bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {products.map((product) => (
                                    <div key={product.id} className="border rounded-lg p-3 text-center h-40 w-32 bg-gray-100 dark:bg-gray-900">
                                        <img src={`/storage/${product.product_image}`}
                                            alt="Product"
                                            className="w-16 h-12 mx-auto rounded" />
                                        <h3 className="text-[13px] font-semibold mt-0.5">{product.product_name}</h3>
                                        <p className="text-[10px] mt-0.5">Qty: {Number(product.product_quantity)}</p>
                                        <p className="text-[11px] mt-0.5">₱ {Number(product.product_price).toFixed(2)}</p>
                                   
                                        <Button className="text-[11px] bg-blue-500 text-white px-2 py-1 rounded mt-1 w-full h-7" onClick={() => addToCart(product)}>
                                            ADD
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Order Summary */}
                <div className="col-span-1">
                    <Card className="bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {cart.map((item, index) => (
                                    <div key={index} className="border rounded-lg p-3 text-center h-40 w-32 bg-gray-100 dark:bg-gray-900 relative">
                                        <img src={`/storage/${item.product_image}`}
                                            alt="Product"
                                            className="w-16 h-12 mx-auto rounded" />
                                            <br />
                                        <h3 className="text-[13px] font-semibold">{item.product_name}</h3>
                                        <p className="text-[12px] mt-0.5">Qty: {item.product_quantity}</p>
                                        <p className="text-sm mt-1">Total: ₱{(item.product_price * item.product_quantity).toFixed(2)}</p>
                                        <button className="absolute top-2 right-2 text-red-500" onClick={() => removeFromCart(item.id)}>
                                            <MinusCircle size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <br />

                            <table className="mt-4 w-full text-right">
                                <tbody>
                                    <tr>
                                        <td className="font-semibold">Subtotal:</td>
                                        <td>₱ {subtotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Tax:</td>
                                        <td>₱ {tax.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Discount:</td>
                                        <td>₱ {discount.toFixed(2)}</td>
                                    </tr>
                                    {payment !== null && (
                                        <>
                                            <tr>
                                                <td className="font-semibold text-white-500">Cash:</td>
                                                <td>₱ {payment.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-semibold">Total:</td>
                                                <td>₱ {total.toFixed(2)}</td>
                                            </tr>

                                            <tr>
                                                <td className="font-semibold text-white-500">------------</td>
                                                <td className="font-semibold text-white-500">------------</td>
                                            </tr>

                                            <tr>
                                                <td className="font-semibold text-white-500">Change:</td>
                                                <td>₱ {change?.toFixed(2)}</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>


                            <Button className="bg-green-500 text-white px-4 py-2 mt-4 w-full" onClick={handleCheckout}>
                                CHECKOUT
                            </Button>
                            <br />

                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <Modal onClose={() => setShowPaymentModal(false)}>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Enter Payment Amount</h2>
                        <input
                            type="number"
                            className="block w-full rounded-md border-2 border-red-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            value={enteredPayment}
                            onChange={(e) => setEnteredPayment(e.target.value)}
                            required
                        />
                        <div className="mt-4 flex justify-end">
                            <Button className="bg-blue-500 text-white px-4 py-2 mr-2" onClick={handlePaymentSubmit}>
                                Submit
                            </Button>
                            <Button className="bg-red-500 text-white px-4 py-2 mr-2" onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button className="bg-red-500 text-white px-4 py-2 mr-8" onClick={handleNextOrder}>
                            Next Order
                        </Button>
                    </div>
                </Modal>
            )}
        </StaffLayout>
    );
}
