import DaftarKomikPageContent from "@/components/daftar/DaftarKomikPage";
import BottomNavbar from "@/components/home/BottomNavbar";
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

export const dynamic = "force-dynamic";

export default function DaftarKomikPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <DaftarKomikPageContent />
      </main>
      <Footer />
      <BottomNavbar />
    </div>
  );
}

