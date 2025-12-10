import BottomNavbar from "@/components/home/BottomNavbar";
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

export default function DaftarKomikPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
          <h1 className="mb-6 text-2xl font-bold">Daftar Komik</h1>
          <p className="text-muted-foreground">
            Halaman ini sedang dalam pengembangan.
          </p>
        </div>
      </main>
      <Footer />
      <BottomNavbar />
    </div>
  );
}

