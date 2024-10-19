import { Button } from "@/components/ui/button";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { TbHorseshoe } from "react-icons/tb";
import { FaRegCalendarAlt } from "react-icons/fa";
import heroImage from "@/assets/hero.jpg";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section
          className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  Manage Your Horses with Ease
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Ferrier is the all-in-one solution for horse owners and stable
                  managers. Keep track of your horses' profiles, schedules, and
                  farrier needs.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button className="w-full sm:w-auto hover:bg-black hover:text-white">
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white/20 text-white hover:bg-white/30"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8">
              Key Features
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-4">
                <LiaHorseHeadSolid className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">Horse Profiles</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Maintain detailed profiles for each of your horses, including
                  breed, age, and special care instructions.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <TbHorseshoe className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">Farrier Tracking</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Monitor shoeing schedules, hoof health, and keep detailed
                  records of each farrier visit for optimal hoof care.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <FaRegCalendarAlt className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">Scheduling</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage appointments, farrier visits, and veterinary check-ups
                  with our intuitive scheduling system.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="w-full py-12 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Streamline Your Horse Management?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join horse owners and stable managers who trust Farrier for
                  their equine management needs. Try Farrier today!
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2 ">
                <Button className="hover:bg-black hover:text-white">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
