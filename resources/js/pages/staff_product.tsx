import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import StaffLayout from "@/components/staff/StaffLayout"; 
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt"; // Import the component

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Products",
        href: "/staff/products",
    },
];

export default function ProductsPOS() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortField, setSortField] = useState("product_id");
    const [sortDirection, setSortDirection] = useState("asc");
    const [searchQuery, setSearchQuery] = useState("");
    const [isFullScreen, setIsFullScreen] = useState(false);
    const tableRef = useRef(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchQuery, products]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/staff/products");
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...products];

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (product) =>
                    product.product_name.toLowerCase().includes(query) ||
                    product.product_id.toString().includes(query)
            );
        }

        filtered.sort((a, b) => {
            const fieldA = a[sortField];
            const fieldB = b[sortField];
            return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
        });

        setFilteredProducts(filtered);
    };

    const handleSortChange = (e) => {
        const [field, direction] = e.target.value.split("-");
        setSortField(field);
        setSortDirection(direction);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <select
                        className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300"
                        onChange={handleSortChange}
                        defaultValue="product_id-asc"
                    >
                        <option value="product_id-asc">Product ID (Ascending)</option>
                        <option value="product_id-desc">Product ID (Descending)</option>
                        <option value="product_name-asc">Name (A-Z)</option>
                        <option value="product_name-desc">Name (Z-A)</option>
                        <option value="product_price-asc">Price (Low to High)</option>
                        <option value="product_price-desc">Price (High to Low)</option>
                        <option value="product_qty-asc">Stock (Low to High)</option>
                        <option value="product_qty-desc">Stock (High to Low)</option>
                    </select>
                </div>

                <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-700 border-collapse">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-32">Product ID</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-60">Name</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider w-40">Price</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider w-40">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Loading products...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.product_id} className="hover:bg-gray-700/60 transition-colors">
                                        <td className="px-6 py-4 text-left text-sm text-gray-300">{product.product_id}</td>
                                        <td className="px-6 py-4 text-left text-sm text-gray-300">{product.product_name}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-300">{product.product_price}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-300">{product.product_qty}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </StaffLayout>
    );
}