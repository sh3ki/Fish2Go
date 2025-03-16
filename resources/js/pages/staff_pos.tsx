import { useState, useEffect } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type BreadcrumbItem } from "@/types";
import { MinusCircle } from "lucide-react";
import Modal from "@/components/ui/modal";
import axios from "axios";
import { AlertDestructive, AlertSuccess } from "@/components/ui/alerts";

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
    status: string;
};

interface PosProps {
    products: Product[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Point of Sale", href: "/staff/pos" },
];

const Calculator = ({ handlePaymentChange, clearInput }) => {
    const [input, setInput] = useState("");

    const handleButtonClick = (value) => {
        setInput((prev) => prev + value);
        handlePaymentChange({ target: { value: input + value } });
    };

    const handleClear = () => {
        setInput("");
        handlePaymentChange({ target: { value: "" } });
    };

    useEffect(() => {
        if (clearInput) {
            setInput("");
        }
    }, [clearInput]);

    return (
        <div className="calculator bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <input
                type="text"
                value={input}
                readOnly
                className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white mb-2"
            />
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "."].map((num) => (
                    <Button key={num} onClick={() => handleButtonClick(num.toString())}>
                        {num}
                    </Button>
                ))}
                <Button onClick={handleClear}>C</Button>
            </div>
        </div>
    );
};

export default function StaffPOS({ products: initialProducts }: PosProps) {
    const { flash, errors } = usePage<{ flash: { success?: string; error?: string } | undefined }>().props;
    const [cart, setCart] = useState<Product[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [total, setTotal] = useState(0);
    const [payment, setPayment] = useState<number | null>(null);
    const [change, setChange] = useState<number | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [enteredPayment, setEnteredPayment] = useState("");
    const { data, setData, post } = useForm<OrderFormData>({
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        payment: 0,
        change: 0,
        status: "pending",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<"success" | "error" | null>(null);
    const [clearCalculator, setClearCalculator] = useState(false);

    const closeAlert = () => {
        setAlertMessage(null);
        setAlertType(null);
    };

    // Fetch updated products from the server
    const fetchUpdatedProducts = async () => {
        try {
            const response = await axios.get(route('staff.products.index'));
            setProducts(response.data.products);
        } catch (error) {
            console.error("Error fetching updated products:", error);
        }
    };

    // Add Product to Cart
    const addToCart = (product: Product) => {
        const existingProduct = cart.find(item => item.id === product.id);
        if (existingProduct) {
            if (existingProduct.product_quantity + 1 > product.product_quantity) {
                setAlertMessage("Not enough stock available.");
                setAlertType("error");
                return;
            }
            const updatedCart = cart.map(item =>
                item.id === product.id ? { ...item, product_quantity: item.product_quantity + 1 } : item
            );
            setCart(updatedCart);
            updateTotals(updatedCart);
        } else {
            if (product.product_quantity < 1) {
                setAlertMessage("Not enough stock available.");
                setAlertType("error");
                return;
            }
            const updatedCart = [...cart, { ...product, product_quantity: 1 }];
            setCart(updatedCart);
            updateTotals(updatedCart);
        }

        // Deduct the quantity from the products array
        const updatedProducts = products.map(item =>
            item.id === product.id ? { ...item, product_quantity: item.product_quantity - 1 } : item
        );
        setProducts(updatedProducts);
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
        const paymentAmount = parseFloat(enteredPayment);
        if (isNaN(paymentAmount) || paymentAmount < total) {
            setAlertMessage("Payment amount is invalid or less than the total amount.");
            setAlertType("error");
            return;
        }

        setPayment(paymentAmount);
        setChange(paymentAmount - total);

        // Show confirmation modal
        setShowConfirmationModal(true);
    };

    const confirmCheckout = () => {
        // Prepare the order data
        const orderData = {
            items: cart.map(item => ({ product_id: item.id, quantity: item.product_quantity, category: item.product_category })),
            subtotal,
            tax,
            discount,
            total,
            payment: payment,
            change: change,
            status: "confirmed", // Set status to confirmed directly
        };

        console.log("Order Data:", orderData); // Log order data

        setIsLoading(true); // Set loading state to true

        axios.post(route('staff.orders.store'), orderData)
            .then(response => {
                console.log("Success:", response.data); // Log success response
                setAlertMessage("Order confirmed successfully!");
                setAlertType("success");
                setCart([]);
                setSubtotal(0);
                setTax(0);
                setDiscount(0);
                setTotal(0);
                setPayment(null);
                setChange(null);
                setEnteredPayment("");
                setClearCalculator(true); // Clear calculator input
                fetchUpdatedProducts(); // Fetch updated products after checkout
                setIsLoading(false); // Set loading state to false
                setShowConfirmationModal(false); // Hide confirmation modal
            })
            .catch(error => {
                console.log("Errors:", error.response.data); // Log error response
                setAlertMessage(error.response.data.error || "An error occurred during checkout.");
                setAlertType("error");
                setIsLoading(false); // Set loading state to false
                setShowConfirmationModal(false); // Hide confirmation modal
            });
    };

    const cancelCheckout = () => {
        setShowConfirmationModal(false);
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const paymentAmount = parseFloat(e.target.value);
        setEnteredPayment(e.target.value);
        if (!isNaN(paymentAmount)) {
            setPayment(paymentAmount);
            setChange(paymentAmount - total);
        } else {
            setPayment(null);
            setChange(null);
        }
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sale" />

            <div className="grid grid-cols-4 gap-5">
                {/* Left Side: Products */}
                <div className="col-span-3 overflow-x-auto">
                    <Card className="bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Products</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {products.map((product) => (
                                    <div key={product.id} className="border rounded-lg p-3 text-center h-50 w-40 bg-gray-100 dark:bg-gray-900">
                                        <img src={`/storage/${product.product_image}`}
                                            alt="Product"
                                            className="w-16 h-12 mx-auto rounded" />
                                        <h3 className="text-[15px] font-semibold mt-2">{product.product_name}</h3>
                                        <p className="text-[12px] mt-2">Qty: {Number(product.product_quantity)}</p>
                                        <p className="text-[13px] mt-2">₱ {Number(product.product_price).toFixed(2)}</p>
                                   
                                        <Button className="text-[11px] bg-blue-500 text-white px-3 py-4 rounded mt-2 w-full h-4" onClick={() => addToCart(product)}>
                                            ADD
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Order Summary */}
                <div className="col-span-1 flex flex-col">
                    <Card className="bg-white dark:bg-gray-800 flex-grow">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-between h-full">
                            <div className="overflow-x-auto mb-7">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-35 h-45">
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
                            </div>

                            <Calculator handlePaymentChange={handlePaymentChange} clearInput={clearCalculator} />

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

                            <Button className="bg-green-500 text-white px-4 py-2 mt-4 w-full" onClick={handleCheckout} disabled={isLoading}>
                                {isLoading ? "Processing..." : "CHECKOUT"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Alert Messages */}
            {alertMessage && alertType === "error" && <AlertDestructive message={alertMessage} onClose={closeAlert} />}
            {alertMessage && alertType === "success" && <AlertSuccess message={alertMessage} onClose={closeAlert} />}

            {/* Confirmation Modal */}
            {showConfirmationModal && (
                <Modal isOpen={showConfirmationModal} onClose={cancelCheckout}>
                    <div className="p-4">
                        <h2 className="text-lg font-semibold">Confirm Checkout</h2>
                        <p>Are you sure you want to confirm this order?</p>
                        <div className="mt-4 flex justify-end">
                            <Button className="bg-gray-500 text-white px-4 py-2 mr-2" onClick={cancelCheckout}>
                                Cancel
                            </Button>
                            <Button className="bg-green-500 text-white px-4 py-2" onClick={confirmCheckout}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </StaffLayout>
    );
}
