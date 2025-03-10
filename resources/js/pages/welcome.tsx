import { Head, Link, usePage } from "@inertiajs/react";

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-black-100 text-white p-6 lg:justify-center lg:p-8">
                {/* Header - Login and Register Buttons */}
                <header className="mb-6 w-full max-w-[335px] text-sm lg:max-w-4xl">
                    <nav className="flex items-center justify-center gap-10">
                        {auth.user ? (
                            <Link
                                href={route("dashboard")}
                                className="rounded-sm border border-gray-300 px-5 py-1.5 text-sm leading-normal text-white hover:border-gray-400"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route("login")}
                                    className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm leading-normal text-white hover:border-gray-400"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route("register")}
                                    className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm leading-normal text-white hover:border-gray-400"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* Main Content Box */}
                <div className="flex w-full max-w-3xl bg-green-900 text-white rounded-lg shadow-lg p-8">
                    {/* Left Side - Welcome Message */}
                    <div className="flex-1">
                        <br />
                        <br />
                    <h1 className="text-5xl font-bold mb-4">Fish2Go</h1>
                    <h2>POS System</h2>
                    
                      
                      <br />
                      <br />
                               
                    </div>

                    {/* Right Side - Fish2Go Logo */}
                    <div className="flex-1 flex justify-center">
                        <img src="/path-to-fish2go-logo.png" alt="Fish2Go Logo" className="w-48 h-48" />
                    </div>
                </div>

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
