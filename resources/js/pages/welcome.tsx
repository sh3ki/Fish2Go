import { Head, Link, usePage } from "@inertiajs/react";

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-6 lg:justify-center lg:p-8">
                <div className="absolute top-3 left-3 p-4 z-1">
                    <h1
                        className="text-6xl font-bold mb-4"
                        style={{
                            WebkitTextStroke: "1px black", // Solid black border for each letter
                            color: "white", // Keeps the text filled with white
                        }}
                    >
                        Fish2Go
                    </h1>
                    <h2
                        className="text-3xl font-semibold mb-4"
                        style={{
                            WebkitTextStroke: "1px black", // Solid black border for each letter
                            color: "white", // Keeps the text filled with white
                        }}
                    >
                        Your Healthy Grilled Fish Choice!
                    </h2>
                </div>

                {/* Navigation Bar */}
                <nav className="absolute top-2 right-0 p-4 z-20 mr-3">
                    <Link
                        className="rounded-sm border border-blue-500 bg-gray-800 px-4 py-3 text-m text-white hover:border-blue-200 hover:bg-gray-400 transition-all"
                    >
                        Home
                    </Link>

                    <Link
                        className="rounded-sm border border-blue-500 bg-gray-800 px-4 py-3 text-m text-white hover:border-blue-200 hover:bg-gray-400 transition-all mr-3 ml-8"
                    >
                        About Us
                    </Link>
                </nav>

                {/* Main Content Box */}
                <div className="flex max-w-2xl bg-transparent backdrop-blur-[7px] text-white rounded-lg shadow-2xl p-8 z-10 border border-gray-300 relative ">
                    <div className="flex-1">
                    <h2
                        className="text-3xl font-semibold mb-4"
                        style={{
                            WebkitTextStroke: "1px black", // Solid black border for each letter
                            color: "white", // Keeps the text filled with white
                        }}
                    >
                       Welcome!
                    </h2>

                        {/* Email Field Styled as Log in Button */}
                        <div className="mb-4">
                            <input 
                                type="Log In" 
                                placeholder="Log In" 
                                onClick={() => window.location.href = route("login")} 
                                className="w-full px-4 py-2 text-black bg-gray-300 rounded-md cursor-pointer hover:bg-gray-400 focus:outline-none"
                                readOnly
                            />
                        </div>

                        {/* Password Field Styled as Register Button */}
                        <div className="mb-4">
                            <input 
                                type="Register" 
                                placeholder="Register" 
                                onClick={() => window.location.href = route("register")} 
                                className="w-full px-4 py-2 text-black bg-gray-300 rounded-md cursor-pointer hover:bg-gray-400 focus:outline-none"
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Video Background - Kept Untouched */}
                <div className="fixed inset-0 z-0">
                    <video autoPlay muted loop className="w-full h-full object-cover">
                        <source src="/videos/Fish2Go.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
