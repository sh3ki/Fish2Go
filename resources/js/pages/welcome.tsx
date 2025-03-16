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
            <h1 className="text-5xl font-bold mb-4 z-1 absolute top-0 left-0 p-4">Fish2Go</h1>
               {/* Main Content Box */}
             
               <div className="flex w-full max-w-2xl bg-green-600 text-white rounded-lg shadow-lg p-8 z-10 ">
                    {/* Left Side - Welcome Message */}
                    <div className="flex-1">
                        <br />
                        <br />
                

                    
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
                      <br />
                      <br />
                               
                    </div>

                 
                </div>

               

                {/* Video Section */}
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


