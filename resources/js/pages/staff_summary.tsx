import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import StaffLayout from "@/components/staff/StaffLayout"; 
import { type BreadcrumbItem } from "@/types";
import { Head, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Summary",
        href: "/staff/summary",
    },
];

export default function SummaryPOS() {
    const { total_sales, total_income, total_expense, total_cash, total_gcash, total_grabfood, total_foodpanda, date: serverDate } = usePage().props;
    const [selectedDate, setSelectedDate] = useState(new Date(serverDate || new Date())); // Default to server-provided date or today's date

    useEffect(() => {
        if (serverDate) {
            setSelectedDate(new Date(serverDate)); // Sync the date picker with the server-provided date
        }
    }, [serverDate]);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date); // Update the state with the selected date
        router.get('/staff/summary', { date: date.toISOString().split('T')[0] }); // Send selected date to the backend
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Summary" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <h1 className="text-center text-lg font-bold">Staff Summary</h1>
                <div className="flex justify-center mb-4">
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        dateFormat="yyyy-MM-dd"
                        className="border rounded p-2"
                    />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total Sales</h2>
                        <p className="text-center">{total_sales}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total Income</h2>
                        <p className="text-center">{total_income}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total Expense</h2>
                        <p className="text-center">{total_expense}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total Cash</h2>
                        <p className="text-center">{total_cash}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total GCash</h2>
                        <p className="text-center">{total_gcash}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total GrabFood</h2>
                        <p className="text-center">{total_grabfood}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h2 className="text-center font-bold">Total FoodPanda</h2>
                        <p className="text-center">{total_foodpanda}</p>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
