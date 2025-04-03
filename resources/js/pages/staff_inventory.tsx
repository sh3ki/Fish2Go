import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Inventory",
        href: "/staff/inventory",
    },
];

export default function InventoryPOS() {
    const [inventory, setInventory] = useState([]); // Original inventory fetched from the backend
    const [filteredInventory, setFilteredInventory] = useState([]); // Filtered and sorted inventory
    const [isLoading, setIsLoading] = useState(true);
    const [sortField, setSortField] = useState("inventory_id");
    const [sortDirection, setSortDirection] = useState("asc");
    const [searchQuery, setSearchQuery] = useState("");
    const tableRef = useRef(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchQuery, inventory]);

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/staff/inventory");
            setInventory(response.data);
            setFilteredInventory(response.data); // Initialize filtered inventory
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...inventory];

        // Apply search filter (case-insensitive, matches any field)
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.inventory_name.toLowerCase().includes(query) ||
                    item.inventory_id.toString().toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const fieldA = a[sortField];
            const fieldB = b[sortField];

            if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
            if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredInventory(filtered);
    };

    const handleSortChange = (e) => {
        const value = e.target.value;
        const [field, direction] = value.split("-");
        setSortField(field);
        setSortDirection(direction);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Search and Filter Section */}
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <select
                        className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300"
                        onChange={handleSortChange}
                        defaultValue="inventory_id-asc"
                    >
                        <option value="inventory_id-asc">Inventory ID (Ascending)</option>
                        <option value="inventory_id-desc">Inventory ID (Descending)</option>
                        <option value="inventory_name-asc">Name (A-Z)</option>
                        <option value="inventory_name-desc">Name (Z-A)</option>
                        <option value="inventory_qty-asc">Quantity (Low to High)</option>
                        <option value="inventory_qty-desc">Quantity (High to Low)</option>
                        <option value="inventory_price-asc">Price (Low to High)</option>
                        <option value="inventory_price-desc">Price (High to Low)</option>
                        <option value="created_at-desc">Newest</option>
                        <option value="created_at-asc">Oldest</option>
                    </select>
                </div>

                {/* Table wrapper with fixed header and scrollable body */}
                <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                    {/* Fixed header table */}
                    <div className="sticky top-0 bg-gray-900 shadow-md">
                        <table className="min-w-full divide-y divide-gray-700 border-collapse">
                        <thead className="bg-gray-700">
    <tr>
        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-32">
            Inventory ID
        </th>
        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-60">
            Name
        </th>
        <th className="px-6 py-4 text-center text-sm font-medium text-gray-400 uppercase tracking-wider w-32">
            Quantity
        </th>
        <th className="px-6 py-4 text-center text-sm font-medium text-gray-400 uppercase tracking-wider w-32">
            Price
        </th>
    </tr>
</thead>
<tbody className="bg-gray-800 divide-y divide-gray-700">
    {filteredInventory.map((item) => (
        <tr key={item.inventory_id} className="hover:bg-gray-700/60 transition-colors">
            <td className="px-6 py-4 text-left text-sm text-gray-300 w-32">{item.inventory_id}</td>
            <td className="px-6 py-4 text-left text-sm text-gray-300 w-60">{item.inventory_name}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-300 w-32">{item.inventory_qty}</td>
            <td className="px-6 py-4 text-center text-sm text-gray-300 w-32">{item.inventory_price}</td>
        </tr>
    ))}
</tbody>

                        </table>
                    </div>

                    {/* Scrollable table body */}
                    <div
                        ref={tableRef}
                        className="overflow-y-auto"
                        style={{ maxHeight: "calc(100vh - 175px)" }}
                    >
                     
                       
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
