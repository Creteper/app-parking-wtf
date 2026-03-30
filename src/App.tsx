import { MapComponent } from "@/components/map.container";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";

function App() {
  return (
    <main className="w-full h-screen bg-muted overflow-auto px-8 pt-8">
      <header
        data-slot="titlebar"
        className="flex items-center gap-2 justify-between"
      >
        <div className="flex items-center gap-2">
          <img src="/images/pakingPhoto.png" alt="logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">智慧停车</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={"secondary"}
            size={"icon"}
            className="bg-background rounded-full shadow-sm"
          >
            <Search />
          </Button>
          <Button
            variant={"secondary"}
            size={"icon"}
            className="bg-background rounded-full shadow-sm"
          >
            <Bell />
          </Button>
        </div>
      </header>
      <div data-slot="map-container" className="w-full h-64 rounded-lg overflow-hidden mt-6">
        <MapComponent />
      </div>
    </main>
  );
}

export default App;
