export default function Footer() {
    return (
        <footer className="border-t border-zinc-900 bg-black py-12 text-center text-zinc-500 text-sm">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <img src="/affiliatemango_logo.png" alt="AffiliateMango Logo" className="w-6 h-6 object-contain" />
                    <span className="font-bold text-zinc-400">AffiliateMango</span>
                </div>
                <div>&copy; {new Date().getFullYear()} AffiliateMango. All rights reserved.</div>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
