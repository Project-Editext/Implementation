import Header from "../components/Header";
import Footer from "../components/Footer";
 
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold text-gray-800">Welcome to Editex</h1>
      </main>
      <Footer />
    </div>
  );
}