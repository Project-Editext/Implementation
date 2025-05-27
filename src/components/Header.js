import Navbar from "./Navbar";
 
export default function Header() {
  return (
    <header className="bg-gray-600 text-white p-4">
      <h1 className="text-xl font-semibold">Editex</h1>
      <Navbar/>
    </header>
  );
}