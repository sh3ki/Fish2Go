<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="icon" href="{{ asset('images/f2g_logo_white.png') }}" type="image/x-icon">
        
        {{-- Inline script to detect system dark mode preference --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';
                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style for theme colors --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }
            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes

        {{-- Simple version that works in all scenarios --}}
        @php
            $isNgrokRequest = strpos(request()->getHost(), 'ngrok-free.app') !== false;
            $viteUrl = $isNgrokRequest ? env('NGROK_VITE_URL') : 'http://192.168.1.10:5173';
        @endphp

        @if($isNgrokRequest)
            {{-- Plain script and link tags for ngrok --}}
            <script type="module" src="{{ $viteUrl }}/@vite/client"></script>
            <script type="module" src="{{ $viteUrl }}/resources/js/app.tsx"></script>
            <link rel="stylesheet" href="{{ $viteUrl }}/resources/css/app.css">
            @if(isset($page['component']))
                <script type="module" src="{{ $viteUrl }}/resources/js/pages/{{ $page['component'] }}.tsx"></script>
            @endif
        @else
            {{-- Standard Vite for local development --}}
            @viteReactRefresh
            @vite(['resources/css/app.css', 'resources/js/app.tsx'])
            @if(isset($page['component']))
                @vite("resources/js/pages/{$page['component']}.tsx")
            @endif
        @endif
        
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
